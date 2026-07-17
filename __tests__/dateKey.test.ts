import {
  addDaysToKey,
  dayOfWeekOfKey,
  diffInDays,
  formatDateKey,
  makeDateKey,
  parseDateKeyLocal,
  todayDateKey,
} from '../lib/dateKey';

describe('makeDateKey', () => {
  it('zero-pads month and day', () => {
    expect(makeDateKey(2026, 7, 4)).toBe('2026-07-04');
    expect(makeDateKey(2026, 12, 31)).toBe('2026-12-31');
  });
});

describe('todayDateKey / formatDateKey', () => {
  it('uses the local calendar day, including near midnight', () => {
    // Local wall-clock components go in; the same components must come out,
    // whatever timezone the test host runs in.
    expect(todayDateKey(new Date(2026, 6, 17, 0, 0, 1))).toBe('2026-07-17');
    expect(todayDateKey(new Date(2026, 6, 17, 23, 59, 59))).toBe('2026-07-17');
    expect(formatDateKey(new Date(2026, 0, 1, 12))).toBe('2026-01-01');
  });
});

describe('parseDateKeyLocal', () => {
  it('round-trips through formatDateKey', () => {
    for (const key of ['2026-01-01', '2028-02-29', '2026-07-17', '2026-12-31']) {
      expect(formatDateKey(parseDateKeyLocal(key))).toBe(key);
    }
  });

  it('yields the named calendar day for local display getters', () => {
    const d = parseDateKeyLocal('2026-03-08');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(8);
  });
});

describe('addDaysToKey', () => {
  it('crosses month and year boundaries', () => {
    expect(addDaysToKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('handles leap years', () => {
    expect(addDaysToKey('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysToKey('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('is exact across DST transition dates regardless of host timezone', () => {
    // US spring-forward (2026-03-08) and fall-back (2026-11-01): a
    // local-midnight implementation drifts a day here in US timezones.
    expect(addDaysToKey('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDaysToKey('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDaysToKey('2026-10-31', 2)).toBe('2026-11-02');
    expect(addDaysToKey('2026-11-02', -2)).toBe('2026-10-31');
  });
});

describe('diffInDays', () => {
  it('is signed and exact', () => {
    expect(diffInDays('2026-07-01', '2026-07-17')).toBe(16);
    expect(diffInDays('2026-07-17', '2026-07-01')).toBe(-16);
    expect(diffInDays('2026-07-17', '2026-07-17')).toBe(0);
  });

  it('spans DST transitions without off-by-one', () => {
    expect(diffInDays('2026-03-07', '2026-03-09')).toBe(2);
    expect(diffInDays('2026-10-31', '2026-11-02')).toBe(2);
    expect(diffInDays('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('returns NaN on malformed keys', () => {
    expect(Number.isNaN(diffInDays('not-a-date', '2026-07-17'))).toBe(true);
  });
});

describe('dayOfWeekOfKey', () => {
  it('matches known calendar dates', () => {
    expect(dayOfWeekOfKey('2026-01-01')).toBe(4); // Thursday
    expect(dayOfWeekOfKey('2026-07-17')).toBe(5); // Friday
    expect(dayOfWeekOfKey('2026-12-31')).toBe(4); // Thursday
  });
});
