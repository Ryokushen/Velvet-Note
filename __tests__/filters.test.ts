import {
  NEGLECTED_AFTER_DAYS,
  applyCollectionFilters,
  daysSinceWorn,
  filterFragrances,
  segmentFragrances,
  sortFragrances,
} from '../lib/filters';
import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';

const frag = (over: Partial<Fragrance> = {}): Fragrance => ({
  id: 'x',
  user_id: 'u',
  brand: 'Chanel',
  name: 'Bleu',
  concentration: 'EDP',
  accords: ['woody', 'citrus'],
  rating: 8,
  catalog_id: null,
  image_url: null,
  catalog_description: null,
  catalog_source: null,
  catalog_release_year: null,
  catalog_notes_top: null,
  catalog_notes_middle: null,
  catalog_notes_base: null,
  catalog_perfumers: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

describe('filterFragrances', () => {
  it('returns all entries when query is empty', () => {
    const list = [frag(), frag({ id: 'y', brand: 'Dior' })];
    expect(filterFragrances(list, '')).toHaveLength(2);
  });

  it('matches brand case-insensitively', () => {
    const list = [frag({ brand: 'Chanel' }), frag({ id: 'y', brand: 'Dior' })];
    expect(filterFragrances(list, 'chan')).toHaveLength(1);
  });

  it('matches name', () => {
    const list = [frag({ name: 'Bleu' }), frag({ id: 'y', name: 'Sauvage' })];
    expect(filterFragrances(list, 'sauv')).toHaveLength(1);
  });

  it('matches accords', () => {
    const list = [
      frag({ accords: ['woody'] }),
      frag({ id: 'y', accords: ['floral'] }),
    ];
    expect(filterFragrances(list, 'floral')).toHaveLength(1);
  });
});

const wear = (over: Partial<Wear> = {}): Wear => ({
  id: 'w',
  user_id: 'u',
  fragrance_id: 'x',
  worn_on: '2026-07-01',
  notes: null,
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
  ...over,
});

describe('segmentFragrances', () => {
  const shelfNull = frag({ id: 'null-status' });
  const shelfFull = frag({ id: 'full', bottle_status: 'full' });
  const shelfSample = frag({ id: 'sample', bottle_status: 'sample' });
  const shelfEmpty = frag({ id: 'empty', bottle_status: 'empty' });
  const want = frag({ id: 'want', bottle_status: 'wishlist' });
  const sold = frag({ id: 'sold', bottle_status: 'sold' });
  const gifted = frag({ id: 'gifted', bottle_status: 'gifted' });
  const all = [shelfNull, shelfFull, shelfSample, shelfEmpty, want, sold, gifted];

  it('shelf keeps owned statuses including empty and unset', () => {
    expect(segmentFragrances(all, 'shelf').map((f) => f.id)).toEqual([
      'null-status',
      'full',
      'sample',
      'empty',
    ]);
  });

  it('wants keeps only wishlist bottles', () => {
    expect(segmentFragrances(all, 'wants').map((f) => f.id)).toEqual(['want']);
  });

  it('past keeps sold and gifted bottles', () => {
    expect(segmentFragrances(all, 'past').map((f) => f.id)).toEqual(['sold', 'gifted']);
  });
});

describe('daysSinceWorn', () => {
  it('returns whole days between the latest wear and today', () => {
    const wears = [wear({ worn_on: '2026-06-20' }), wear({ id: 'w2', worn_on: '2026-07-01' })];
    expect(daysSinceWorn(wears, 'x', '2026-07-06')).toBe(5);
  });

  it('returns null when the fragrance has never been worn', () => {
    expect(daysSinceWorn([wear({ fragrance_id: 'other' })], 'x', '2026-07-06')).toBeNull();
  });
});

describe('applyCollectionFilters', () => {
  const context = { todayKey: '2026-07-06', wears: [] as Wear[] };

  it('returns the list untouched with no filters', () => {
    const list = [frag()];
    expect(applyCollectionFilters(list, [], context)).toBe(list);
  });

  it('in-season keeps only explicit current-season matches', () => {
    const summer = frag({ id: 'summer', preferred_seasons: ['summer'] });
    const winter = frag({ id: 'winter', preferred_seasons: ['winter'] });
    const unset = frag({ id: 'unset' });
    const result = applyCollectionFilters([summer, winter, unset], ['in-season'], context);
    expect(result.map((f) => f.id)).toEqual(['summer']);
  });

  it('neglected keeps never-worn and long-rested bottles', () => {
    const rested = frag({ id: 'rested' });
    const recent = frag({ id: 'recent' });
    const never = frag({ id: 'never' });
    const wears = [
      wear({ fragrance_id: 'rested', worn_on: '2026-04-01' }),
      wear({ id: 'w2', fragrance_id: 'recent', worn_on: '2026-07-01' }),
    ];
    const result = applyCollectionFilters([rested, recent, never], ['neglected'], {
      todayKey: '2026-07-06',
      wears,
    });
    expect(result.map((f) => f.id)).toEqual(['rested', 'never']);
  });

  it('combines filters with AND semantics', () => {
    const match = frag({ id: 'match', preferred_seasons: ['summer'] });
    const wrongSeason = frag({ id: 'wrong', preferred_seasons: ['winter'] });
    const result = applyCollectionFilters([match, wrongSeason], ['in-season', 'neglected'], {
      todayKey: '2026-07-06',
      wears: [],
    });
    expect(result.map((f) => f.id)).toEqual(['match']);
  });

  it('exposes the neglect threshold constant', () => {
    expect(NEGLECTED_AFTER_DAYS).toBe(60);
  });
});

describe('sortFragrances', () => {
  it('sorts by rating descending, nulls last', () => {
    const list = [
      frag({ id: 'a', rating: 5 }),
      frag({ id: 'b', rating: 9 }),
      frag({ id: 'c', rating: null }),
    ];
    const sorted = sortFragrances(list, 'rating');
    expect(sorted.map((f) => f.id)).toEqual(['b', 'a', 'c']);
  });

  it('sorts by created_at descending (recent first)', () => {
    const list = [
      frag({ id: 'a', created_at: '2026-01-01T00:00:00Z' }),
      frag({ id: 'b', created_at: '2026-03-01T00:00:00Z' }),
    ];
    const sorted = sortFragrances(list, 'recent');
    expect(sorted.map((f) => f.id)).toEqual(['b', 'a']);
  });
});
