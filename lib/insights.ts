import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';
import { formatAccordLabel } from './accordDisplay';
import { SEASON_LABELS, WEAR_TIME_LABELS } from './journal';

type RankedFragrance = {
  fragranceId: string;
  fragrance: Fragrance;
  count: number;
  lastWorn: string | null;
};

type ComplimentLeader = {
  fragranceId: string;
  fragrance: Fragrance;
  compliments: number;
};

type CountRow = {
  label: string;
  count: number;
};

type AccordRow = {
  label: string;
  score: number;
};

export type JournalInsights = {
  mostWorn: RankedFragrance[];
  neglected: RankedFragrance[];
  complimentLeaders: ComplimentLeader[];
  favoriteSeasons: CountRow[];
  timeOfDay: CountRow[];
  topAccords: AccordRow[];
};

export function buildJournalInsights(fragrances: Fragrance[], wears: Wear[]): JournalInsights {
  const fragranceById = new Map(fragrances.map((fragrance) => [fragrance.id, fragrance]));
  const wearCounts = new Map<string, number>();
  const compliments = new Map<string, number>();
  const lastWorn = new Map<string, string>();
  const seasonCounts = new Map<string, number>();
  const timeCounts = new Map<string, number>();

  wears.forEach((wear) => {
    wearCounts.set(wear.fragrance_id, (wearCounts.get(wear.fragrance_id) ?? 0) + 1);
    compliments.set(
      wear.fragrance_id,
      (compliments.get(wear.fragrance_id) ?? 0) + (wear.compliment_count ?? 0),
    );
    const currentLast = lastWorn.get(wear.fragrance_id);
    if (!currentLast || wear.worn_on > currentLast) {
      lastWorn.set(wear.fragrance_id, wear.worn_on);
    }
    if (wear.season) {
      const label = SEASON_LABELS[wear.season];
      seasonCounts.set(label, (seasonCounts.get(label) ?? 0) + 1);
    }
    if (wear.time_of_day) {
      const label = WEAR_TIME_LABELS[wear.time_of_day];
      timeCounts.set(label, (timeCounts.get(label) ?? 0) + 1);
    }
  });

  const ranked = fragrances.map((fragrance) => ({
    fragranceId: fragrance.id,
    fragrance,
    count: wearCounts.get(fragrance.id) ?? 0,
    lastWorn: lastWorn.get(fragrance.id) ?? null,
  }));

  return {
    mostWorn: [...ranked].sort((a, b) => b.count - a.count || a.fragrance.name.localeCompare(b.fragrance.name)),
    neglected: [...ranked].sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      if (!a.lastWorn && !b.lastWorn) return a.fragrance.name.localeCompare(b.fragrance.name);
      if (!a.lastWorn) return -1;
      if (!b.lastWorn) return 1;
      return a.lastWorn.localeCompare(b.lastWorn);
    }),
    complimentLeaders: [...compliments.entries()]
      .map(([fragranceId, count]) => ({
        fragranceId,
        fragrance: fragranceById.get(fragranceId)!,
        compliments: count,
      }))
      .filter((row) => row.fragrance && row.compliments > 0)
      .sort((a, b) => b.compliments - a.compliments || a.fragrance.name.localeCompare(b.fragrance.name)),
    favoriteSeasons: mapCounts(seasonCounts),
    timeOfDay: mapCounts(timeCounts),
    topAccords: buildAccordScores(fragrances, wearCounts),
  };
}

function mapCounts(counts: Map<string, number>): CountRow[] {
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildAccordScores(fragrances: Fragrance[], wearCounts: Map<string, number>): AccordRow[] {
  const scores = new Map<string, number>();
  fragrances.forEach((fragrance) => {
    const ratingWeight = fragrance.rating ?? 0;
    const wearWeight = wearCounts.get(fragrance.id) ?? 0;
    const score = ratingWeight + wearWeight * 2;
    fragrance.accords.forEach((accord) => {
      const label = formatAccordLabel(accord);
      scores.set(label, (scores.get(label) ?? 0) + score);
    });
  });
  return [...scores.entries()]
    .map(([label, score]) => ({ label, score }))
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}
