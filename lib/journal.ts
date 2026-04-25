import type { BottleStatus, PreferredTimeOfDay, Season } from '../types/fragrance';
import type { WearTimeOfDay } from '../types/wear';

export const BOTTLE_STATUS_LABELS: Record<BottleStatus, string> = {
  full: 'Full',
  partial: 'Partial',
  sample: 'Sample',
  decant: 'Decant',
  empty: 'Empty',
  wishlist: 'Wishlist',
  sold: 'Sold',
  gifted: 'Gifted',
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
};

export const PREFERRED_TIME_LABELS: Record<PreferredTimeOfDay, string> = {
  day: 'Day',
  night: 'Night',
  either: 'Either',
};

export const WEAR_TIME_LABELS: Record<WearTimeOfDay, string> = {
  day: 'Day',
  night: 'Night',
};

export function seasonForDate(dateKey: string): Season | null {
  const month = Number(dateKey.slice(5, 7));
  if (!month) return null;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

export function formatCurrency(value: number | null | undefined, currency = 'USD'): string | null {
  if (value == null || Number.isNaN(value)) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatMl(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  const display = Number.isInteger(value) ? value.toFixed(0) : String(value);
  return `${display} ml`;
}
