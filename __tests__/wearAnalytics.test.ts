import {
  buildWrapped,
  buildYearHeatmap,
  complimentLeaderboard,
  currentStreak,
  longestStreak,
  seasonalSignatures,
} from '../lib/wearAnalytics';
import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';

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

let fragranceCounter = 0;
function makeFragrance(overrides: Partial<Fragrance> = {}): Fragrance {
  fragranceCounter += 1;
  return {
    ...baseFragrance,
    id: `f${fragranceCounter}`,
    brand: 'Brand',
    name: `Fragrance ${fragranceCounter}`,
    ...overrides,
  } as Fragrance;
}

const baseWear = {
  user_id: 'user-1',
  notes: null,
  occasion: null,
  compliment_note: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} satisfies Partial<Wear>;

let wearCounter = 0;
function makeWear(overrides: Partial<Wear> = {}): Wear {
  wearCounter += 1;
  return {
    ...baseWear,
    id: `w${wearCounter}`,
    fragrance_id: 'f1',
    worn_on: '2026-01-01',
    ...overrides,
  } as Wear;
}

beforeEach(() => {
  fragranceCounter = 0;
  wearCounter = 0;
});

describe('buildYearHeatmap', () => {
  it('returns empty weeks with zero counts for a year with no wears', () => {
    const result = buildYearHeatmap([], 2026);
    expect(result.totalWears).toBe(0);
    expect(result.maxCount).toBe(0);
    expect(result.weeks.length).toBeGreaterThan(0);
    result.weeks.forEach((week) => expect(week.length).toBe(7));
  });

  it('pads the first and last week columns for 2026 (Jan 1 and Dec 31 are both Thursdays)', () => {
    const result = buildYearHeatmap([], 2026);
    const firstWeek = result.weeks[0];
    const lastWeek = result.weeks[result.weeks.length - 1];

    // Jan 1 2026 is a Thursday (index 4): 4 leading nulls, then Thu/Fri/Sat.
    expect(firstWeek.slice(0, 4)).toEqual([null, null, null, null]);
    expect(firstWeek[4]).toEqual({ date: '2026-01-01', count: 0 });
    expect(firstWeek[5]).toEqual({ date: '2026-01-02', count: 0 });
    expect(firstWeek[6]).toEqual({ date: '2026-01-03', count: 0 });

    // Dec 31 2026 is also a Thursday (index 4): entry at index 4, then 2 trailing nulls.
    expect(lastWeek[4]).toEqual({ date: '2026-12-31', count: 0 });
    expect(lastWeek[5]).toBeNull();
    expect(lastWeek[6]).toBeNull();
  });

  it('counts wears per day and computes maxCount/totalWears within the year only', () => {
    const wears: Wear[] = [
      makeWear({ worn_on: '2026-03-10' }),
      makeWear({ worn_on: '2026-03-10' }),
      makeWear({ worn_on: '2026-03-11' }),
      makeWear({ worn_on: '2025-12-31' }), // outside the requested year
      makeWear({ worn_on: '2027-01-01' }), // outside the requested year
    ];

    const result = buildYearHeatmap(wears, 2026);
    expect(result.totalWears).toBe(3);
    expect(result.maxCount).toBe(2);

    const flat = result.weeks.flat().filter((day): day is { date: string; count: number } => day != null);
    const mar10 = flat.find((day) => day.date === '2026-03-10');
    const mar11 = flat.find((day) => day.date === '2026-03-11');
    expect(mar10?.count).toBe(2);
    expect(mar11?.count).toBe(1);
  });
});

describe('currentStreak', () => {
  it('returns 0 when there are no wears', () => {
    expect(currentStreak([], '2026-04-20')).toBe(0);
  });

  it('counts consecutive days ending today when today has a wear', () => {
    const wears: Wear[] = [
      makeWear({ worn_on: '2026-04-18' }),
      makeWear({ worn_on: '2026-04-19' }),
      makeWear({ worn_on: '2026-04-20' }),
    ];
    expect(currentStreak(wears, '2026-04-20')).toBe(3);
  });

  it('falls back to yesterday when today has no wear', () => {
    const wears: Wear[] = [
      makeWear({ worn_on: '2026-04-18' }),
      makeWear({ worn_on: '2026-04-19' }),
    ];
    expect(currentStreak(wears, '2026-04-20')).toBe(2);
  });

  it('returns 0 when neither today nor yesterday has a wear', () => {
    const wears: Wear[] = [makeWear({ worn_on: '2026-04-10' })];
    expect(currentStreak(wears, '2026-04-20')).toBe(0);
  });

  it('stops counting at a gap', () => {
    const wears: Wear[] = [
      makeWear({ worn_on: '2026-04-10' }),
      makeWear({ worn_on: '2026-04-18' }),
      makeWear({ worn_on: '2026-04-19' }),
      makeWear({ worn_on: '2026-04-20' }),
    ];
    expect(currentStreak(wears, '2026-04-20')).toBe(3);
  });
});

describe('longestStreak', () => {
  it('returns 0 for no wears', () => {
    expect(longestStreak([])).toBe(0);
  });

  it('returns 1 for a single wear', () => {
    expect(longestStreak([makeWear({ worn_on: '2026-04-20' })])).toBe(1);
  });

  it('finds the longest consecutive run across gaps', () => {
    const wears: Wear[] = [
      makeWear({ worn_on: '2026-01-01' }),
      makeWear({ worn_on: '2026-01-02' }),
      makeWear({ worn_on: '2026-01-05' }),
      makeWear({ worn_on: '2026-01-06' }),
      makeWear({ worn_on: '2026-01-07' }),
      makeWear({ worn_on: '2026-01-08' }),
    ];
    expect(longestStreak(wears)).toBe(4);
  });

  it('deduplicates multiple wears on the same day', () => {
    const wears: Wear[] = [
      makeWear({ worn_on: '2026-01-01' }),
      makeWear({ worn_on: '2026-01-01' }),
      makeWear({ worn_on: '2026-01-02' }),
    ];
    expect(longestStreak(wears)).toBe(2);
  });
});

describe('seasonalSignatures', () => {
  it('returns empty array with no wears', () => {
    expect(seasonalSignatures([], [])).toEqual([]);
  });

  it('picks the most-worn fragrance per season using explicit wear.season or derived season', () => {
    const f1 = makeFragrance({ id: 'f1', name: 'Spring One', rating: 5 });
    const f2 = makeFragrance({ id: 'f2', name: 'Spring Two', rating: 8 });
    const fragrances = [f1, f2];

    const wears: Wear[] = [
      makeWear({ fragrance_id: 'f1', worn_on: '2026-04-01', season: 'spring' }),
      makeWear({ fragrance_id: 'f2', worn_on: '2026-04-02', season: 'spring' }),
      makeWear({ fragrance_id: 'f2', worn_on: '2026-04-03', season: 'spring' }),
      // no explicit season, derived from date (July -> summer)
      makeWear({ fragrance_id: 'f1', worn_on: '2026-07-01' }),
    ];

    const result = seasonalSignatures(wears, fragrances);
    const spring = result.find((row) => row.season === 'spring');
    const summer = result.find((row) => row.season === 'summer');

    expect(spring).toMatchObject({ fragrance: f2, wearCount: 2 });
    expect(summer).toMatchObject({ fragrance: f1, wearCount: 1 });
  });

  it('breaks ties by higher rating then name ascending', () => {
    const fLowRating = makeFragrance({ id: 'f1', name: 'Zeta', rating: 3 });
    const fHighRating = makeFragrance({ id: 'f2', name: 'Alpha', rating: 9 });
    const fragrances = [fLowRating, fHighRating];

    const wears: Wear[] = [
      makeWear({ fragrance_id: 'f1', worn_on: '2026-04-01', season: 'spring' }),
      makeWear({ fragrance_id: 'f2', worn_on: '2026-04-02', season: 'spring' }),
    ];

    const result = seasonalSignatures(wears, fragrances);
    expect(result).toEqual([{ season: 'spring', fragrance: fHighRating, wearCount: 1 }]);
  });

  it('breaks ties by name ascending when ratings are equal', () => {
    const fZeta = makeFragrance({ id: 'f1', name: 'Zeta', rating: 5 });
    const fAlpha = makeFragrance({ id: 'f2', name: 'Alpha', rating: 5 });
    const fragrances = [fZeta, fAlpha];

    const wears: Wear[] = [
      makeWear({ fragrance_id: 'f1', worn_on: '2026-04-01', season: 'spring' }),
      makeWear({ fragrance_id: 'f2', worn_on: '2026-04-02', season: 'spring' }),
    ];

    const result = seasonalSignatures(wears, fragrances);
    expect(result).toEqual([{ season: 'spring', fragrance: fAlpha, wearCount: 1 }]);
  });

  it('skips wears with unknown fragrance or unresolvable season', () => {
    const f1 = makeFragrance({ id: 'f1' });
    const wears: Wear[] = [
      makeWear({ fragrance_id: 'unknown-fragrance', worn_on: '2026-04-01', season: 'spring' }),
      makeWear({ fragrance_id: 'f1', worn_on: 'bad-date' }),
    ];
    expect(seasonalSignatures(wears, [f1])).toEqual([]);
  });

  it('returns seasons in SEASONS order (spring, summer, fall, winter)', () => {
    const f1 = makeFragrance({ id: 'f1' });
    const wears: Wear[] = [
      makeWear({ fragrance_id: 'f1', worn_on: '2026-12-01', season: 'winter' }),
      makeWear({ fragrance_id: 'f1', worn_on: '2026-04-01', season: 'spring' }),
      makeWear({ fragrance_id: 'f1', worn_on: '2026-09-01', season: 'fall' }),
      makeWear({ fragrance_id: 'f1', worn_on: '2026-07-01', season: 'summer' }),
    ];
    const result = seasonalSignatures(wears, [f1]);
    expect(result.map((row) => row.season)).toEqual(['spring', 'summer', 'fall', 'winter']);
  });
});

describe('complimentLeaderboard', () => {
  it('returns empty array with no wears', () => {
    expect(complimentLeaderboard([], [])).toEqual([]);
  });

  it('excludes fragrances with zero total compliments', () => {
    const f1 = makeFragrance({ id: 'f1' });
    const wears: Wear[] = [makeWear({ fragrance_id: 'f1', compliment_count: 0 })];
    expect(complimentLeaderboard(wears, [f1])).toEqual([]);
  });

  it('aggregates totals and computes compliments per wear rounded to 2 decimals', () => {
    const f1 = makeFragrance({ id: 'f1', name: 'Aventus' });
    const wears: Wear[] = [
      makeWear({ fragrance_id: 'f1', worn_on: '2026-01-01', compliment_count: 1 }),
      makeWear({ fragrance_id: 'f1', worn_on: '2026-01-02', compliment_count: 1 }),
      makeWear({ fragrance_id: 'f1', worn_on: '2026-01-03', compliment_count: 1 }),
    ];
    const result = complimentLeaderboard(wears, [f1]);
    expect(result).toEqual([
      { fragrance: f1, totalCompliments: 3, wearCount: 3, complimentsPerWear: 1 },
    ]);
  });

  it('sorts by complimentsPerWear desc, then totalCompliments desc, then name asc', () => {
    const fHighRate = makeFragrance({ id: 'f1', name: 'Zephyr' }); // 1 wear, 1 compliment -> 1.0
    const fLowRateManyCompliments = makeFragrance({ id: 'f2', name: 'Beta' }); // 4 wears, 3 compliments -> 0.75
    const fTieA = makeFragrance({ id: 'f3', name: 'Bravo' }); // 2 wears, 1 compliment -> 0.5
    const fTieB = makeFragrance({ id: 'f4', name: 'Alpha' }); // 2 wears, 1 compliment -> 0.5

    const wears: Wear[] = [
      makeWear({ fragrance_id: 'f1', worn_on: '2026-01-01', compliment_count: 1 }),
      makeWear({ fragrance_id: 'f2', worn_on: '2026-01-01', compliment_count: 2 }),
      makeWear({ fragrance_id: 'f2', worn_on: '2026-01-02', compliment_count: 1 }),
      makeWear({ fragrance_id: 'f2', worn_on: '2026-01-03', compliment_count: 0 }),
      makeWear({ fragrance_id: 'f2', worn_on: '2026-01-04', compliment_count: 0 }),
      makeWear({ fragrance_id: 'f3', worn_on: '2026-01-01', compliment_count: 1 }),
      makeWear({ fragrance_id: 'f3', worn_on: '2026-01-02', compliment_count: 0 }),
      makeWear({ fragrance_id: 'f4', worn_on: '2026-01-01', compliment_count: 1 }),
      makeWear({ fragrance_id: 'f4', worn_on: '2026-01-02', compliment_count: 0 }),
    ];

    const result = complimentLeaderboard(wears, [fHighRate, fLowRateManyCompliments, fTieA, fTieB]);
    expect(result.map((row) => row.fragrance.id)).toEqual(['f1', 'f2', 'f4', 'f3']);
  });

  it('respects the limit parameter', () => {
    const fragrances = [1, 2, 3].map((n) => makeFragrance({ id: `f${n}`, name: `F${n}` }));
    const wears: Wear[] = fragrances.map((f) =>
      makeWear({ fragrance_id: f.id, worn_on: '2026-01-01', compliment_count: 1 }),
    );
    expect(complimentLeaderboard(wears, fragrances, 2)).toHaveLength(2);
  });

  it('ignores wears referencing unknown fragrances', () => {
    const f1 = makeFragrance({ id: 'f1' });
    const wears: Wear[] = [makeWear({ fragrance_id: 'ghost', compliment_count: 5 })];
    expect(complimentLeaderboard(wears, [f1])).toEqual([]);
  });
});

describe('buildWrapped', () => {
  it('returns null when the year has no wears', () => {
    expect(buildWrapped([], [], 2026)).toBeNull();
  });

  it('builds full wrapped stats for a year', () => {
    const aventus = makeFragrance({
      id: 'f1',
      name: 'Aventus',
      created_at: '2026-02-01T00:00:00Z',
      bottle_status: 'full',
      purchase_price: 30,
    });
    const shalimar = makeFragrance({
      id: 'f2',
      name: 'Shalimar',
      created_at: '2025-06-01T00:00:00Z',
      bottle_status: 'full',
      purchase_price: 300,
    });
    const wishlisted = makeFragrance({
      id: 'f3',
      name: 'Wishlist Item',
      created_at: '2026-03-01T00:00:00Z',
      bottle_status: 'wishlist',
    });
    const fragrances = [aventus, shalimar, wishlisted];

    const wears: Wear[] = [
      makeWear({ fragrance_id: 'f1', worn_on: '2026-01-05', compliment_count: 2, season: 'winter' }),
      makeWear({ fragrance_id: 'f1', worn_on: '2026-01-06', compliment_count: 1, season: 'winter' }),
      makeWear({ fragrance_id: 'f1', worn_on: '2026-02-10', compliment_count: 0, season: 'winter' }),
      makeWear({ fragrance_id: 'f2', worn_on: '2026-01-20', compliment_count: 0, season: 'winter' }),
      // lifetime wears for f2 (bestValue needs >= 3 lifetime wears); two more outside the year
      makeWear({ fragrance_id: 'f2', worn_on: '2025-01-01', compliment_count: 0, season: 'winter' }),
      makeWear({ fragrance_id: 'f2', worn_on: '2025-01-02', compliment_count: 0, season: 'winter' }),
    ];

    const wrapped = buildWrapped(wears, fragrances, 2026);
    expect(wrapped).not.toBeNull();
    expect(wrapped?.totalWears).toBe(4);
    expect(wrapped?.distinctFragranceCount).toBe(2);
    expect(wrapped?.mostWorn).toMatchObject({ fragrance: aventus, count: 3 });
    expect(wrapped?.complimentChampion).toMatchObject({ fragrance: aventus, totalCompliments: 3 });
    expect(wrapped?.totalCompliments).toBe(3);
    expect(wrapped?.estimatedMlUsed).toBeCloseTo(4 * 0.8);
    expect(wrapped?.bottlesAdded).toBe(1); // wishlist excluded even though created in 2026
    expect(wrapped?.busiestMonth).toEqual({ month: 1, count: 3 });
    expect(wrapped?.topSeason).toEqual({ season: 'winter', count: 4 });
    expect(wrapped?.longestStreak).toBe(2); // Jan 5 & 6 consecutive within the year

    // f1 (aventus): price 30 / 3 lifetime wears = 10/wear
    // f2 (shalimar): price 300 / 3 lifetime wears (1 in-year + 2 prior years) = 100/wear
    expect(wrapped?.bestValue).toMatchObject({ fragrance: aventus, costPerWear: 10 });
  });

  it('excludes fragrances with fewer than 3 lifetime wears from bestValue', () => {
    const f1 = makeFragrance({ id: 'f1', name: 'OnlyTwoWears', purchase_price: 50 });
    const fragrances = [f1];
    const wears: Wear[] = [
      makeWear({ fragrance_id: 'f1', worn_on: '2026-01-01' }),
      makeWear({ fragrance_id: 'f1', worn_on: '2026-01-02' }),
    ];
    const wrapped = buildWrapped(wears, fragrances, 2026);
    expect(wrapped?.bestValue).toBeNull();
  });

  it('returns null complimentChampion when no wears in the year have compliments', () => {
    const f1 = makeFragrance({ id: 'f1' });
    const wears: Wear[] = [makeWear({ fragrance_id: 'f1', worn_on: '2026-01-01', compliment_count: 0 })];
    const wrapped = buildWrapped(wears, [f1], 2026);
    expect(wrapped?.complimentChampion).toBeNull();
  });

  it('only counts wears whose worn_on falls within the requested year', () => {
    const f1 = makeFragrance({ id: 'f1' });
    const wears: Wear[] = [
      makeWear({ fragrance_id: 'f1', worn_on: '2025-12-31' }),
      makeWear({ fragrance_id: 'f1', worn_on: '2026-01-01' }),
      makeWear({ fragrance_id: 'f1', worn_on: '2027-01-01' }),
    ];
    const wrapped = buildWrapped(wears, [f1], 2026);
    expect(wrapped?.totalWears).toBe(1);
  });
});
