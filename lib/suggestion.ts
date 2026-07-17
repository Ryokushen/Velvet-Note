import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';
import { climateAffinityForAccords } from './accordClimate';
import { diffInDays } from './dateKey';
import { seasonForDate } from './journal';
import { latestWearForFragrance } from './lastWorn';

export type WeatherConditions = {
  tempC: number;
  humidity: number;
  precipitationMm: number;
};

export type SuggestionContext = {
  fragrances: Fragrance[];
  wears: Wear[];
  todayKey: string;
  hour: number;
  // Optional refinement: absent weather must leave scores untouched.
  weather?: WeatherConditions | null;
};

export type WearSuggestion = {
  fragrance: Fragrance;
  score: number;
  reasons: string[];
};

export const SUGGESTION_WEIGHTS = {
  ratingMultiplier: 3,
  defaultRating: 5,
  favoriteRatingThreshold: 9,
  seasonMatch: 25,
  seasonMismatch: -12,
  timeEither: 4,
  timeMatch: 10,
  timeMismatch: -6,
  neverWorn: 15,
  restLongDays: 60,
  restLongPoints: 20,
  restMediumDays: 30,
  restMediumPoints: 12,
  restShortDays: 14,
  restShortPoints: 6,
  recentDays: 2,
  recentPenalty: -15,
  complimentBonus: 10,
  complimentRatioThreshold: 1,
  // Weather refines but never outranks explicit preferred seasons (25 pts):
  // the temperature axis tops out at 15 and rain at 6.
  weatherHotC: 27,
  weatherWarmC: 22,
  weatherColdC: 8,
  weatherCoolC: 14,
  weatherTempPoints: 15,
  weatherMildFactor: 0.5,
  weatherRainMinMm: 0.2,
  weatherRainPoints: 6,
  weatherHumidThreshold: 75,
  weatherHumidPenalty: -6,
  weatherHumidHeavyAffinity: 0.5,
  weatherTempReasonMin: 8,
  weatherRainReasonMin: 4,
} as const;

const EXCLUDED_STATUSES = new Set(['wishlist', 'sold', 'gifted', 'empty']);

type ScoredReason = {
  text: string;
  points: number;
};

export function suggestWears(context: SuggestionContext): WearSuggestion[] {
  const { fragrances, wears, todayKey, hour, weather } = context;
  const currentSlot: 'day' | 'night' = hour >= 6 && hour < 18 ? 'day' : 'night';
  const currentSeason = seasonForDate(todayKey);

  const wornToday = new Set(
    wears.filter((wear) => wear.worn_on === todayKey).map((wear) => wear.fragrance_id),
  );

  const complimentTotals = new Map<string, { total: number; count: number }>();
  wears.forEach((wear) => {
    const entry = complimentTotals.get(wear.fragrance_id) ?? { total: 0, count: 0 };
    entry.total += wear.compliment_count ?? 0;
    entry.count += 1;
    complimentTotals.set(wear.fragrance_id, entry);
  });

  const candidates = fragrances.filter((fragrance) => {
    if (fragrance.bottle_status && EXCLUDED_STATUSES.has(fragrance.bottle_status)) {
      return false;
    }
    return !wornToday.has(fragrance.id);
  });

  const results: WearSuggestion[] = candidates.map((fragrance) => {
    const reasons: ScoredReason[] = [];
    let score = 0;

    // Rating.
    const rating = fragrance.rating ?? SUGGESTION_WEIGHTS.defaultRating;
    const ratingPoints = rating * SUGGESTION_WEIGHTS.ratingMultiplier;
    score += ratingPoints;
    if (rating >= SUGGESTION_WEIGHTS.favoriteRatingThreshold) {
      reasons.push({ text: 'A favorite', points: ratingPoints });
    }

    // Season.
    if (fragrance.preferred_seasons && fragrance.preferred_seasons.length > 0 && currentSeason) {
      if (fragrance.preferred_seasons.includes(currentSeason)) {
        score += SUGGESTION_WEIGHTS.seasonMatch;
        reasons.push({ text: 'In season', points: SUGGESTION_WEIGHTS.seasonMatch });
      } else {
        score += SUGGESTION_WEIGHTS.seasonMismatch;
      }
    }

    // Time of day.
    if (fragrance.preferred_time_of_day === 'either') {
      score += SUGGESTION_WEIGHTS.timeEither;
    } else if (fragrance.preferred_time_of_day === currentSlot) {
      score += SUGGESTION_WEIGHTS.timeMatch;
      reasons.push({
        text: currentSlot === 'day' ? 'Day-friendly' : 'Made for tonight',
        points: SUGGESTION_WEIGHTS.timeMatch,
      });
    } else if (fragrance.preferred_time_of_day) {
      score += SUGGESTION_WEIGHTS.timeMismatch;
    }

    // Recency.
    const lastWear = latestWearForFragrance(wears, fragrance.id);
    if (!lastWear) {
      score += SUGGESTION_WEIGHTS.neverWorn;
      reasons.push({ text: 'Never worn — give it a first wear', points: SUGGESTION_WEIGHTS.neverWorn });
    } else {
      const daysSince = daysBetween(lastWear.worn_on, todayKey);
      if (daysSince >= SUGGESTION_WEIGHTS.restLongDays) {
        const weeks = Math.floor(daysSince / 7);
        score += SUGGESTION_WEIGHTS.restLongPoints;
        reasons.push({ text: `Resting for ${weeks} weeks`, points: SUGGESTION_WEIGHTS.restLongPoints });
      } else if (daysSince >= SUGGESTION_WEIGHTS.restMediumDays) {
        const weeks = Math.floor(daysSince / 7);
        score += SUGGESTION_WEIGHTS.restMediumPoints;
        reasons.push({ text: `Resting for ${weeks} weeks`, points: SUGGESTION_WEIGHTS.restMediumPoints });
      } else if (daysSince >= SUGGESTION_WEIGHTS.restShortDays) {
        score += SUGGESTION_WEIGHTS.restShortPoints;
      } else if (daysSince <= SUGGESTION_WEIGHTS.recentDays) {
        score += SUGGESTION_WEIGHTS.recentPenalty;
      }
    }

    // Compliments.
    const complimentEntry = complimentTotals.get(fragrance.id);
    if (complimentEntry && complimentEntry.count > 0) {
      const ratio = complimentEntry.total / complimentEntry.count;
      if (ratio >= SUGGESTION_WEIGHTS.complimentRatioThreshold) {
        score += SUGGESTION_WEIGHTS.complimentBonus;
        reasons.push({ text: 'Crowd-pleaser', points: SUGGESTION_WEIGHTS.complimentBonus });
      }
    }

    // Weather (optional). Scent-profile affinity comes from the accord
    // climate table; the whole rule is a no-op without conditions.
    if (weather) {
      const affinity = climateAffinityForAccords(fragrance.accords);
      if (affinity) {
        let tempPoints = 0;
        let tempReason: string | null = null;
        if (weather.tempC >= SUGGESTION_WEIGHTS.weatherHotC) {
          tempPoints = Math.round(SUGGESTION_WEIGHTS.weatherTempPoints * affinity.heat);
          tempReason = 'Made for this heat';
        } else if (weather.tempC >= SUGGESTION_WEIGHTS.weatherWarmC) {
          tempPoints = Math.round(
            SUGGESTION_WEIGHTS.weatherTempPoints * affinity.heat * SUGGESTION_WEIGHTS.weatherMildFactor,
          );
          tempReason = 'Made for this heat';
        } else if (weather.tempC <= SUGGESTION_WEIGHTS.weatherColdC) {
          tempPoints = Math.round(SUGGESTION_WEIGHTS.weatherTempPoints * affinity.cold);
          tempReason = 'A cold-day comfort';
        } else if (weather.tempC <= SUGGESTION_WEIGHTS.weatherCoolC) {
          tempPoints = Math.round(
            SUGGESTION_WEIGHTS.weatherTempPoints * affinity.cold * SUGGESTION_WEIGHTS.weatherMildFactor,
          );
          tempReason = 'A cold-day comfort';
        }
        score += tempPoints;
        if (tempReason && tempPoints >= SUGGESTION_WEIGHTS.weatherTempReasonMin) {
          reasons.push({ text: tempReason, points: tempPoints });
        }

        if (weather.precipitationMm >= SUGGESTION_WEIGHTS.weatherRainMinMm) {
          const rainPoints = Math.round(SUGGESTION_WEIGHTS.weatherRainPoints * affinity.rain);
          score += rainPoints;
          if (rainPoints >= SUGGESTION_WEIGHTS.weatherRainReasonMin) {
            reasons.push({ text: 'Right for the rain', points: rainPoints });
          }
        }

        if (
          weather.humidity >= SUGGESTION_WEIGHTS.weatherHumidThreshold &&
          weather.tempC >= SUGGESTION_WEIGHTS.weatherWarmC &&
          affinity.cold >= SUGGESTION_WEIGHTS.weatherHumidHeavyAffinity
        ) {
          score += SUGGESTION_WEIGHTS.weatherHumidPenalty;
        }
      }
    }

    const topReasons = [...reasons]
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
      .map((reason) => reason.text);

    return { fragrance, score, reasons: topReasons };
  });

  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ratingCompare = compareRatingDesc(a.fragrance.rating, b.fragrance.rating);
    if (ratingCompare !== 0) return ratingCompare;
    return a.fragrance.name.localeCompare(b.fragrance.name);
  });
}

function compareRatingDesc(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function daysBetween(fromKey: string, toKey: string): number {
  return diffInDays(fromKey, toKey);
}

export function describeSuggestion(suggestion: WearSuggestion): string {
  return suggestion.reasons.join(' · ');
}
