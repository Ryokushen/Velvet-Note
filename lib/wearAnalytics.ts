import type { Fragrance, Season } from '../types/fragrance';
import { SEASONS } from '../types/fragrance';
import type { Wear } from '../types/wear';
import { costPerWear, estimatedMlUsed, isOwnedStatus } from './bottleEconomics';
import { seasonForDate } from './journal';

export type HeatmapDay = { date: string; count: number };

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateKey(dateKey: string): Date {
  return new Date(dateKey + 'T00:00:00Z');
}

function formatDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getTime() + amount * DAY_MS);
}

function wearSeason(wear: Wear): Season | null {
  return wear.season ?? seasonForDate(wear.worn_on);
}

export function buildYearHeatmap(
  wears: Wear[],
  year: number,
): { weeks: (HeatmapDay | null)[][]; maxCount: number; totalWears: number } {
  const prefix = `${year}-`;
  const counts = new Map<string, number>();
  let totalWears = 0;

  wears.forEach((wear) => {
    if (!wear.worn_on.startsWith(prefix)) return;
    totalWears += 1;
    counts.set(wear.worn_on, (counts.get(wear.worn_on) ?? 0) + 1);
  });

  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));
  const startDow = jan1.getUTCDay();
  const endDow = dec31.getUTCDay();

  const days: (HeatmapDay | null)[] = [];
  for (let i = 0; i < startDow; i += 1) {
    days.push(null);
  }

  let cursor = jan1;
  while (cursor.getTime() <= dec31.getTime()) {
    const key = formatDateKey(cursor);
    days.push({ date: key, count: counts.get(key) ?? 0 });
    cursor = addDays(cursor, 1);
  }

  for (let i = endDow; i < 6; i += 1) {
    days.push(null);
  }

  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  let maxCount = 0;
  counts.forEach((count) => {
    if (count > maxCount) maxCount = count;
  });

  return { weeks, maxCount, totalWears };
}

export function currentStreak(wears: Wear[], todayKey: string): number {
  const wornDates = new Set(wears.map((wear) => wear.worn_on));

  let anchor: Date;
  if (wornDates.has(todayKey)) {
    anchor = parseDateKey(todayKey);
  } else {
    const yesterday = addDays(parseDateKey(todayKey), -1);
    const yesterdayKey = formatDateKey(yesterday);
    if (!wornDates.has(yesterdayKey)) return 0;
    anchor = yesterday;
  }

  let streak = 0;
  let cursor = anchor;
  while (wornDates.has(formatDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(wears: Wear[]): number {
  const uniqueDates = [...new Set(wears.map((wear) => wear.worn_on))].sort();
  if (uniqueDates.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < uniqueDates.length; i += 1) {
    const diffDays = (parseDateKey(uniqueDates[i]).getTime() - parseDateKey(uniqueDates[i - 1]).getTime()) / DAY_MS;
    if (diffDays === 1) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > longest) longest = current;
  }
  return longest;
}

export function seasonalSignatures(
  wears: Wear[],
  fragrances: Fragrance[],
): Array<{ season: Season; fragrance: Fragrance; wearCount: number }> {
  const fragranceById = new Map(fragrances.map((fragrance) => [fragrance.id, fragrance]));
  const countsBySeason = new Map<Season, Map<string, number>>();

  wears.forEach((wear) => {
    const season = wearSeason(wear);
    if (!season) return;
    const fragrance = fragranceById.get(wear.fragrance_id);
    if (!fragrance) return;

    const seasonCounts = countsBySeason.get(season) ?? new Map<string, number>();
    seasonCounts.set(fragrance.id, (seasonCounts.get(fragrance.id) ?? 0) + 1);
    countsBySeason.set(season, seasonCounts);
  });

  const results: Array<{ season: Season; fragrance: Fragrance; wearCount: number }> = [];

  SEASONS.forEach((season) => {
    const seasonCounts = countsBySeason.get(season);
    if (!seasonCounts || seasonCounts.size === 0) return;

    let bestFragranceId: string | null = null;
    let bestCount = -1;
    seasonCounts.forEach((count, fragranceId) => {
      if (bestFragranceId === null) {
        bestFragranceId = fragranceId;
        bestCount = count;
        return;
      }
      const current = fragranceById.get(bestFragranceId)!;
      const candidate = fragranceById.get(fragranceId)!;
      if (
        count > bestCount ||
        (count === bestCount && isBetterTiebreak(candidate, current))
      ) {
        bestFragranceId = fragranceId;
        bestCount = count;
      }
    });

    if (bestFragranceId) {
      results.push({
        season,
        fragrance: fragranceById.get(bestFragranceId)!,
        wearCount: bestCount,
      });
    }
  });

  return results;
}

function isBetterTiebreak(candidate: Fragrance, current: Fragrance): boolean {
  const candidateRating = candidate.rating ?? -Infinity;
  const currentRating = current.rating ?? -Infinity;
  if (candidateRating !== currentRating) return candidateRating > currentRating;
  return candidate.name.localeCompare(current.name) < 0;
}

export function complimentLeaderboard(
  wears: Wear[],
  fragrances: Fragrance[],
  limit = 5,
): Array<{ fragrance: Fragrance; totalCompliments: number; wearCount: number; complimentsPerWear: number }> {
  const fragranceById = new Map(fragrances.map((fragrance) => [fragrance.id, fragrance]));
  const stats = new Map<string, { totalCompliments: number; wearCount: number }>();

  wears.forEach((wear) => {
    if (!fragranceById.has(wear.fragrance_id)) return;
    const existing = stats.get(wear.fragrance_id) ?? { totalCompliments: 0, wearCount: 0 };
    existing.totalCompliments += wear.compliment_count ?? 0;
    existing.wearCount += 1;
    stats.set(wear.fragrance_id, existing);
  });

  return [...stats.entries()]
    .filter(([, value]) => value.totalCompliments >= 1)
    .map(([fragranceId, value]) => ({
      fragrance: fragranceById.get(fragranceId)!,
      totalCompliments: value.totalCompliments,
      wearCount: value.wearCount,
      complimentsPerWear: Math.round((value.totalCompliments / value.wearCount) * 100) / 100,
    }))
    .sort((a, b) => {
      if (a.complimentsPerWear !== b.complimentsPerWear) return b.complimentsPerWear - a.complimentsPerWear;
      if (a.totalCompliments !== b.totalCompliments) return b.totalCompliments - a.totalCompliments;
      return a.fragrance.name.localeCompare(b.fragrance.name);
    })
    .slice(0, limit);
}

export type WrappedStats = {
  year: number;
  totalWears: number;
  distinctFragranceCount: number;
  mostWorn: { fragrance: Fragrance; count: number } | null;
  complimentChampion: { fragrance: Fragrance; totalCompliments: number } | null;
  totalCompliments: number;
  estimatedMlUsed: number;
  bottlesAdded: number;
  busiestMonth: { month: number; count: number } | null;
  topSeason: { season: Season; count: number } | null;
  longestStreak: number;
  bestValue: { fragrance: Fragrance; costPerWear: number } | null;
};

export function buildWrapped(wears: Wear[], fragrances: Fragrance[], year: number): WrappedStats | null {
  const prefix = `${year}-`;
  const yearWears = wears.filter((wear) => wear.worn_on.startsWith(prefix));
  if (yearWears.length === 0) return null;

  const fragranceById = new Map(fragrances.map((fragrance) => [fragrance.id, fragrance]));

  const wearCounts = new Map<string, number>();
  const complimentTotals = new Map<string, number>();
  const monthCounts = new Map<number, number>();
  const seasonCounts = new Map<Season, number>();
  let totalCompliments = 0;

  yearWears.forEach((wear) => {
    wearCounts.set(wear.fragrance_id, (wearCounts.get(wear.fragrance_id) ?? 0) + 1);

    const compliments = wear.compliment_count ?? 0;
    totalCompliments += compliments;
    if (compliments > 0) {
      complimentTotals.set(wear.fragrance_id, (complimentTotals.get(wear.fragrance_id) ?? 0) + compliments);
    }

    const month = Number(wear.worn_on.slice(5, 7));
    if (month) {
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    }

    const season = wearSeason(wear);
    if (season) {
      seasonCounts.set(season, (seasonCounts.get(season) ?? 0) + 1);
    }
  });

  const distinctFragranceCount = wearCounts.size;

  let mostWorn: { fragrance: Fragrance; count: number } | null = null;
  wearCounts.forEach((count, fragranceId) => {
    const fragrance = fragranceById.get(fragranceId);
    if (!fragrance) return;
    if (
      !mostWorn ||
      count > mostWorn.count ||
      (count === mostWorn.count && fragrance.name.localeCompare(mostWorn.fragrance.name) < 0)
    ) {
      mostWorn = { fragrance, count };
    }
  });

  let complimentChampion: { fragrance: Fragrance; totalCompliments: number } | null = null;
  complimentTotals.forEach((count, fragranceId) => {
    const fragrance = fragranceById.get(fragranceId);
    if (!fragrance) return;
    if (
      !complimentChampion ||
      count > complimentChampion.totalCompliments ||
      (count === complimentChampion.totalCompliments &&
        fragrance.name.localeCompare(complimentChampion.fragrance.name) < 0)
    ) {
      complimentChampion = { fragrance, totalCompliments: count };
    }
  });

  let busiestMonth: { month: number; count: number } | null = null;
  monthCounts.forEach((count, month) => {
    if (
      !busiestMonth ||
      count > busiestMonth.count ||
      (count === busiestMonth.count && month < busiestMonth.month)
    ) {
      busiestMonth = { month, count };
    }
  });

  let topSeason: { season: Season; count: number } | null = null;
  SEASONS.forEach((season) => {
    const count = seasonCounts.get(season);
    if (count == null) return;
    if (!topSeason || count > topSeason.count) {
      topSeason = { season, count };
    }
  });

  const bottlesAdded = fragrances.filter(
    (fragrance) => isOwnedStatus(fragrance.bottle_status) && fragrance.created_at.startsWith(prefix),
  ).length;

  const lifetimeWearCounts = new Map<string, number>();
  wears.forEach((wear) => {
    lifetimeWearCounts.set(wear.fragrance_id, (lifetimeWearCounts.get(wear.fragrance_id) ?? 0) + 1);
  });

  let bestValue: { fragrance: Fragrance; costPerWear: number } | null = null;
  fragrances.forEach((fragrance) => {
    if (fragrance.purchase_price == null || fragrance.purchase_price <= 0) return;
    const lifetimeWears = lifetimeWearCounts.get(fragrance.id) ?? 0;
    if (lifetimeWears < 3) return;
    const value = costPerWear(fragrance.purchase_price, lifetimeWears);
    if (value == null) return;
    if (
      !bestValue ||
      value < bestValue.costPerWear ||
      (value === bestValue.costPerWear && fragrance.name.localeCompare(bestValue.fragrance.name) < 0)
    ) {
      bestValue = { fragrance, costPerWear: value };
    }
  });

  return {
    year,
    totalWears: yearWears.length,
    distinctFragranceCount,
    mostWorn,
    complimentChampion,
    totalCompliments,
    estimatedMlUsed: estimatedMlUsed(yearWears.length),
    bottlesAdded,
    busiestMonth,
    topSeason,
    longestStreak: longestStreak(yearWears),
    bestValue,
  };
}
