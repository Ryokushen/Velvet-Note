import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';

export type TodayWearRow = {
  wear: Wear;
  fragrance: Fragrance | null;
};

export type TodayWearState = {
  stack: TodayWearRow[];
  active: TodayWearRow | null;
};

import { todayDateKey as todayLocalDate } from './dateKey';

export { todayDateKey as todayLocalDate } from './dateKey';

export const selectTodayWearState = (
  wears: Wear[],
  fragrances: Fragrance[],
  dateKey = todayLocalDate(),
): TodayWearState => {
  const fragrancesById = new Map(fragrances.map((fragrance) => [fragrance.id, fragrance]));
  const stack = wears
    .filter((wear) => wear.worn_on === dateKey)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((wear) => ({
      wear,
      fragrance: fragrancesById.get(wear.fragrance_id) ?? null,
    }));

  return {
    stack,
    active: stack.find((row) => row.wear.is_active) ?? stack[0] ?? null,
  };
};

export const clampComplimentCount = (value: number): number => Math.max(0, Math.trunc(value));
