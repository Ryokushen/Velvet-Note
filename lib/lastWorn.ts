import type { Wear } from '../types/wear';

export function latestWearForFragrance(
  wears: Wear[] | undefined,
  fragranceId: string,
): Wear | null {
  if (!wears || !fragranceId) {
    return null;
  }

  return wears
    .filter((wear) => wear.fragrance_id === fragranceId)
    .sort((a, b) => {
      const wornDiff = b.worn_on.localeCompare(a.worn_on);
      if (wornDiff !== 0) {
        return wornDiff;
      }
      return b.created_at.localeCompare(a.created_at);
    })[0] ?? null;
}

export function formatLastWornShort(value: string): string {
  return formatWearDate(value, { month: 'short', day: 'numeric' });
}

export function formatLastWornLong(value: string): string {
  return formatWearDate(value, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWearDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleDateString('en-US', options);
}
