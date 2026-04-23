import type { Fragrance } from '../types/fragrance';

export type SortMode = 'rating' | 'recent';

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
