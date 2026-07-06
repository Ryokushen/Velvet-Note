import {
  ML_PER_WEAR,
  costPerWear,
  estimatedMlUsed,
  estimatedRemainingMl,
  fillFraction,
  formatCostPerWear,
  isOwnedStatus,
  isWearableStatus,
  shelfValueByCurrency,
} from '../lib/bottleEconomics';
import type { Fragrance } from '../types/fragrance';

const baseFragrance = {
  user_id: 'user-1',
  concentration: 'EDP',
  accords: [],
  rating: null,
  catalog_id: null,
  image_url: null,
  personal_image_url: null,
  catalog_description: null,
  catalog_source: null,
  catalog_release_year: null,
  catalog_notes_top: null,
  catalog_notes_middle: null,
  catalog_notes_base: null,
  catalog_perfumers: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} satisfies Partial<Fragrance>;

function makeFragrance(overrides: Partial<Fragrance> = {}): Fragrance {
  return {
    ...baseFragrance,
    id: overrides.id ?? 'f1',
    brand: 'Guerlain',
    name: 'Shalimar',
    ...overrides,
  } as Fragrance;
}

describe('isOwnedStatus', () => {
  it('treats null/undefined as owned', () => {
    expect(isOwnedStatus(null)).toBe(true);
    expect(isOwnedStatus(undefined)).toBe(true);
  });

  it('treats full/partial/sample/decant/empty as owned', () => {
    expect(isOwnedStatus('full')).toBe(true);
    expect(isOwnedStatus('partial')).toBe(true);
    expect(isOwnedStatus('sample')).toBe(true);
    expect(isOwnedStatus('decant')).toBe(true);
    expect(isOwnedStatus('empty')).toBe(true);
  });

  it('treats wishlist/sold/gifted as not owned', () => {
    expect(isOwnedStatus('wishlist')).toBe(false);
    expect(isOwnedStatus('sold')).toBe(false);
    expect(isOwnedStatus('gifted')).toBe(false);
  });
});

describe('isWearableStatus', () => {
  it('excludes empty in addition to non-owned statuses', () => {
    expect(isWearableStatus('empty')).toBe(false);
    expect(isWearableStatus('wishlist')).toBe(false);
    expect(isWearableStatus('sold')).toBe(false);
    expect(isWearableStatus('gifted')).toBe(false);
  });

  it('includes full/partial/sample/decant and null/undefined', () => {
    expect(isWearableStatus(null)).toBe(true);
    expect(isWearableStatus(undefined)).toBe(true);
    expect(isWearableStatus('full')).toBe(true);
    expect(isWearableStatus('partial')).toBe(true);
    expect(isWearableStatus('sample')).toBe(true);
    expect(isWearableStatus('decant')).toBe(true);
  });
});

describe('estimatedMlUsed', () => {
  it('multiplies wear count by ML_PER_WEAR', () => {
    expect(estimatedMlUsed(10)).toBeCloseTo(8);
    expect(ML_PER_WEAR).toBeCloseTo(0.8);
  });

  it('treats negative wear counts as 0', () => {
    expect(estimatedMlUsed(-5)).toBe(0);
  });

  it('handles zero', () => {
    expect(estimatedMlUsed(0)).toBe(0);
  });
});

describe('estimatedRemainingMl', () => {
  it('returns null when bottle size is null/undefined/<=0', () => {
    expect(estimatedRemainingMl(null, 5)).toBeNull();
    expect(estimatedRemainingMl(undefined, 5)).toBeNull();
    expect(estimatedRemainingMl(0, 5)).toBeNull();
    expect(estimatedRemainingMl(-10, 5)).toBeNull();
  });

  it('subtracts estimated ml used from bottle size', () => {
    expect(estimatedRemainingMl(100, 10)).toBeCloseTo(92);
  });

  it('clamps to 0 when usage exceeds bottle size', () => {
    expect(estimatedRemainingMl(10, 1000)).toBe(0);
  });

  it('clamps to bottle size when wear count is negative', () => {
    expect(estimatedRemainingMl(50, -10)).toBe(50);
  });
});

describe('fillFraction', () => {
  it('returns null for invalid bottle size', () => {
    expect(fillFraction(null, 5)).toBeNull();
    expect(fillFraction(0, 5)).toBeNull();
  });

  it('computes remaining fraction clamped between 0 and 1', () => {
    expect(fillFraction(100, 0)).toBe(1);
    expect(fillFraction(100, 125)).toBe(0);
    // 50 wears * ML_PER_WEAR (0.8) = 40ml used, 60ml remaining out of 100ml.
    expect(fillFraction(100, 50)).toBeCloseTo(0.6);
  });
});

describe('costPerWear', () => {
  it('returns null for invalid price', () => {
    expect(costPerWear(null, 5)).toBeNull();
    expect(costPerWear(undefined, 5)).toBeNull();
    expect(costPerWear(0, 5)).toBeNull();
    expect(costPerWear(-20, 5)).toBeNull();
  });

  it('returns null for non-positive wear count', () => {
    expect(costPerWear(100, 0)).toBeNull();
    expect(costPerWear(100, -1)).toBeNull();
  });

  it('divides price by wear count', () => {
    expect(costPerWear(100, 20)).toBe(5);
  });
});

describe('shelfValueByCurrency', () => {
  it('returns an empty array for no fragrances', () => {
    expect(shelfValueByCurrency([])).toEqual([]);
  });

  it('aggregates owned fragrances by currency and defaults missing currency to USD', () => {
    const fragrances: Fragrance[] = [
      makeFragrance({ id: 'f1', purchase_price: 100, purchase_currency: 'USD', bottle_status: 'full' }),
      makeFragrance({ id: 'f2', purchase_price: 50, purchase_currency: null, bottle_status: 'partial' }),
      makeFragrance({ id: 'f3', purchase_price: 200, purchase_currency: 'EUR', bottle_status: 'decant' }),
      makeFragrance({ id: 'f4', purchase_price: 10, purchase_currency: 'EUR', bottle_status: 'sample' }),
    ];

    const result = shelfValueByCurrency(fragrances);
    expect(result).toEqual([
      { currency: 'EUR', total: 210, count: 2 },
      { currency: 'USD', total: 150, count: 2 },
    ]);
  });

  it('excludes non-owned statuses and fragrances without a positive price', () => {
    const fragrances: Fragrance[] = [
      makeFragrance({ id: 'f1', purchase_price: 100, bottle_status: 'wishlist' }),
      makeFragrance({ id: 'f2', purchase_price: 100, bottle_status: 'sold' }),
      makeFragrance({ id: 'f3', purchase_price: 100, bottle_status: 'gifted' }),
      makeFragrance({ id: 'f4', purchase_price: null, bottle_status: 'full' }),
      makeFragrance({ id: 'f5', purchase_price: 0, bottle_status: 'full' }),
      makeFragrance({ id: 'f6', purchase_price: -5, bottle_status: 'full' }),
    ];

    expect(shelfValueByCurrency(fragrances)).toEqual([]);
  });

  it('treats missing bottle_status as owned', () => {
    const fragrances: Fragrance[] = [makeFragrance({ id: 'f1', purchase_price: 42, bottle_status: undefined })];
    expect(shelfValueByCurrency(fragrances)).toEqual([{ currency: 'USD', total: 42, count: 1 }]);
  });
});

describe('formatCostPerWear', () => {
  it('returns null when value is null', () => {
    expect(formatCostPerWear(null)).toBeNull();
  });

  it('formats using currency and appends /wear', () => {
    expect(formatCostPerWear(4.5, 'USD')).toBe('$4.50/wear');
  });

  it('defaults to USD when currency omitted', () => {
    expect(formatCostPerWear(10)).toBe('$10/wear');
  });
});
