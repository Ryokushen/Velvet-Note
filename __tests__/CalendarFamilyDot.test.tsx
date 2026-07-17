import { dotForFragrance } from '../app/(tabs)/calendar';
import { FAMILY } from '../theme/families';
import { colors } from '../theme/colors';
import type { Fragrance } from '../types/fragrance';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

function makeFragrance(accords: string[]): Fragrance {
  return {
    id: 'f-test',
    user_id: 'user-1',
    brand: 'Test House',
    name: 'Test Scent',
    concentration: 'EDP',
    accords,
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
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('calendar family dot derivation', () => {
  it("colours a dot by the fragrance's real accord family", () => {
    expect(dotForFragrance(makeFragrance(['woody']))).toBe(FAMILY.woody.dot);
    expect(dotForFragrance(makeFragrance(['amber']))).toBe(FAMILY.oriental.dot);
    expect(dotForFragrance(makeFragrance(['fresh']))).toBe(FAMILY.fresh.dot);
    expect(dotForFragrance(makeFragrance(['floral']))).toBe(FAMILY.floral.dot);
  });

  it('uses the first accord to decide the family', () => {
    expect(dotForFragrance(makeFragrance(['fresh', 'woody']))).toBe(FAMILY.fresh.dot);
  });

  it('falls back to a neutral muted dot when there are no accords', () => {
    expect(dotForFragrance(makeFragrance([]))).toBe(colors.textMuted);
    expect(dotForFragrance(undefined)).toBe(colors.textMuted);
  });

  it('keeps woody and spicy distinguishable while staying warm-hued', () => {
    expect(FAMILY.woody.dot).not.toBe(FAMILY.spicy.dot);
  });
});
