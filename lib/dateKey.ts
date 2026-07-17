// Canonical helpers for YYYY-MM-DD wear-date keys.
//
// Wear dates are stored as plain calendar-date strings (no timezone). The
// device's local timezone enters exactly once — deciding what "today" is —
// and every other operation is pure calendar arithmetic. Internally that
// arithmetic runs on UTC timestamps so day math stays exact across DST
// transitions (a local-midnight subtraction can be 23 or 25 hours).
//
// Do not hand-roll key parsing/formatting elsewhere: `T00:00:00` (local) and
// `T00:00:00Z` (UTC) parses disagree by a day for users behind UTC the moment
// a Date from one convention is formatted with the other's getters.

const DAY_MS = 24 * 60 * 60 * 1000;

// month is 1-12, matching the key text, not Date's 0-11.
export function makeDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// The local calendar day a Date instance falls on. Only meaningful for Dates
// representing real moments (like `new Date()`), not parsed keys.
export function formatDateKey(date: Date): string {
  return makeDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function todayDateKey(now = new Date()): string {
  return formatDateKey(now);
}

// Local-midnight Date for a key — safe to feed to toLocaleDateString and
// local getters for display. Never format one of these with UTC getters.
export function parseDateKeyLocal(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

function utcTime(key: string): number {
  return new Date(`${key}T00:00:00Z`).getTime();
}

export function addDaysToKey(key: string, days: number): string {
  const shifted = new Date(utcTime(key) + days * DAY_MS);
  return makeDateKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

// Whole days from fromKey to toKey (positive when toKey is later). NaN when
// either key is malformed.
export function diffInDays(fromKey: string, toKey: string): number {
  return Math.round((utcTime(toKey) - utcTime(fromKey)) / DAY_MS);
}

// 0 = Sunday … 6 = Saturday, exact for the calendar date named by the key.
export function dayOfWeekOfKey(key: string): number {
  return new Date(`${key}T00:00:00Z`).getUTCDay();
}
