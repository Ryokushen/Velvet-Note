import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';
import { diffInDays } from './dateKey';
import { seasonForDate } from './journal';
import { latestWearForFragrance } from './lastWorn';

export type SortMode = 'rating' | 'recent';
export type CollectionSegment = 'shelf' | 'wants' | 'past';
export type CollectionFilter = 'in-season' | 'neglected';

export const NEGLECTED_AFTER_DAYS = 60;

export function segmentFragrances(list: Fragrance[], segment: CollectionSegment): Fragrance[] {
  return list.filter((f) => {
    const status = f.bottle_status ?? null;
    if (segment === 'wants') return status === 'wishlist';
    if (segment === 'past') return status === 'sold' || status === 'gifted';
    return status !== 'wishlist' && status !== 'sold' && status !== 'gifted';
  });
}

export function daysSinceWorn(
  wears: Wear[] | undefined,
  fragranceId: string,
  todayKey: string,
): number | null {
  const latest = latestWearForFragrance(wears, fragranceId);
  if (!latest) return null;
  const diff = diffInDays(latest.worn_on, todayKey);
  if (!Number.isFinite(diff)) return null;
  return Math.max(0, diff);
}

export function applyCollectionFilters(
  list: Fragrance[],
  filters: CollectionFilter[],
  context: { todayKey: string; wears: Wear[] | undefined },
): Fragrance[] {
  if (filters.length === 0) return list;
  const currentSeason = seasonForDate(context.todayKey);

  return list.filter((f) => {
    if (filters.includes('in-season')) {
      if (!currentSeason) return false;
      if (!f.preferred_seasons || !f.preferred_seasons.includes(currentSeason)) return false;
    }
    if (filters.includes('neglected')) {
      const days = daysSinceWorn(context.wears, f.id, context.todayKey);
      if (days != null && days < NEGLECTED_AFTER_DAYS) return false;
    }
    return true;
  });
}

export function filterFragrances(list: Fragrance[], query: string): Fragrance[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((f) => {
    if (f.brand.toLowerCase().includes(q)) return true;
    if (f.name.toLowerCase().includes(q)) return true;
    if (f.accords.some((a) => a.toLowerCase().includes(q))) return true;
    return false;
  });
}

export function sortFragrances(list: Fragrance[], mode: SortMode): Fragrance[] {
  const copy = [...list];
  if (mode === 'rating') {
    copy.sort((a, b) => {
      if (a.rating == null && b.rating == null) return 0;
      if (a.rating == null) return 1;
      if (b.rating == null) return -1;
      return b.rating - a.rating;
    });
  } else {
    copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return copy;
}
