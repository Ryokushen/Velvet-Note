import { filterFragrances, sortFragrances } from '../lib/filters';
import type { Fragrance } from '../types/fragrance';

const frag = (over: Partial<Fragrance> = {}): Fragrance => ({
  id: 'x',
  user_id: 'u',
  brand: 'Chanel',
  name: 'Bleu',
  concentration: 'EDP',
  accords: ['woody', 'citrus'],
  rating: 8,
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
