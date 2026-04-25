import {
  clampComplimentCount,
  selectTodayWearState,
  todayLocalDate,
} from '../lib/todayWear';
import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';

const fragrance = (overrides: Partial<Fragrance> = {}): Fragrance => ({
  id: 'f-1',
  user_id: 'u-1',
  brand: 'Maison Test',
  name: 'Daily',
  concentration: 'EDP',
  accords: [],
  rating: null,
  catalog_id: null,
  image_url: null,
  catalog_description: null,
  catalog_source: null,
  catalog_release_year: null,
  catalog_notes_top: null,
  catalog_notes_middle: null,
  catalog_notes_base: null,
  catalog_perfumers: null,
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
  ...overrides,
});

const wear = (overrides: Partial<Wear> = {}): Wear => ({
  id: 'w-1',
  user_id: 'u-1',
  fragrance_id: 'f-1',
  worn_on: '2026-04-25',
  notes: null,
  created_at: '2026-04-25T08:00:00Z',
  updated_at: '2026-04-25T08:00:00Z',
  ...overrides,
});

describe('todayLocalDate', () => {
  it('formats a date as a local YYYY-MM-DD key', () => {
    expect(todayLocalDate(new Date(2026, 3, 5, 9, 30))).toBe('2026-04-05');
  });
});

describe('selectTodayWearState', () => {
  it('selects the active row over a newer wear', () => {
    const olderActive = wear({
      id: 'active',
      fragrance_id: 'f-active',
      created_at: '2026-04-25T08:00:00Z',
      is_active: true,
    });
    const newer = wear({
      id: 'newer',
      fragrance_id: 'f-newer',
      created_at: '2026-04-25T10:00:00Z',
    });

    const state = selectTodayWearState(
      [olderActive, newer],
      [fragrance({ id: 'f-active' }), fragrance({ id: 'f-newer' })],
      '2026-04-25',
    );

    expect(state.stack.map((row) => row.wear.id)).toEqual(['newer', 'active']);
    expect(state.active?.wear.id).toBe('active');
    expect(state.active?.fragrance?.id).toBe('f-active');
  });

  it('falls back to the newest today wear when none is active', () => {
    const state = selectTodayWearState(
      [
        wear({ id: 'older', created_at: '2026-04-25T08:00:00Z' }),
        wear({ id: 'newest', created_at: '2026-04-25T12:00:00Z' }),
      ],
      [],
      '2026-04-25',
    );

    expect(state.active?.wear.id).toBe('newest');
    expect(state.active?.fragrance).toBeNull();
  });

  it('ignores active wears from other dates', () => {
    const state = selectTodayWearState(
      [
        wear({ id: 'yesterday-active', worn_on: '2026-04-24', is_active: true }),
        wear({ id: 'today', worn_on: '2026-04-25' }),
      ],
      [],
      '2026-04-25',
    );

    expect(state.stack.map((row) => row.wear.id)).toEqual(['today']);
    expect(state.active?.wear.id).toBe('today');
  });
});

describe('clampComplimentCount', () => {
  it('truncates values and clamps negative counts to zero', () => {
    expect(clampComplimentCount(3.9)).toBe(3);
    expect(clampComplimentCount(-2.1)).toBe(0);
  });
});
