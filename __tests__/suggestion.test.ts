import { describeSuggestion, suggestWears } from '../lib/suggestion';
import type { BottleStatus, Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';

let fragranceIdCounter = 0;
let wearIdCounter = 0;

function makeFragrance(overrides: Partial<Fragrance> = {}): Fragrance {
  fragranceIdCounter += 1;
  return {
    id: `frag-${fragranceIdCounter}`,
    user_id: 'user-1',
    brand: 'Brand',
    name: `Fragrance ${fragranceIdCounter}`,
    concentration: 'EDP',
    accords: [],
    rating: null,
    catalog_id: null,
    image_url: null,
    personal_image_url: null,
    catalog_image_url: null,
    catalog_description: null,
    catalog_source: null,
    catalog_release_year: null,
    catalog_notes_top: null,
    catalog_notes_middle: null,
    catalog_notes_base: null,
    catalog_perfumers: null,
    bottle_status: 'full',
    bottle_size_ml: null,
    purchase_date: null,
    purchase_source: null,
    purchase_price: null,
    purchase_currency: null,
    preferred_seasons: null,
    preferred_time_of_day: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeWear(overrides: Partial<Wear> & { fragrance_id: string; worn_on: string }): Wear {
  wearIdCounter += 1;
  return {
    id: `wear-${wearIdCounter}`,
    user_id: 'user-1',
    notes: null,
    occasion: null,
    compliment_note: null,
    compliment_count: 0,
    created_at: `${overrides.worn_on}T00:00:00Z`,
    updated_at: `${overrides.worn_on}T00:00:00Z`,
    ...overrides,
  };
}

// 2026-07-06 is a Monday in summer (July).
const TODAY = '2026-07-06';
const DAY_HOUR = 10;
const NIGHT_HOUR = 21;

function daysAgo(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

describe('suggestWears - candidate filtering', () => {
  it('excludes wishlist, sold, gifted, and empty bottles', () => {
    const excludedStatuses: BottleStatus[] = ['wishlist', 'sold', 'gifted', 'empty'];
    const excluded = excludedStatuses.map((status) =>
      makeFragrance({ id: `excluded-${status}`, bottle_status: status }),
    );
    const included = makeFragrance({ id: 'included-full', bottle_status: 'full' });

    const result = suggestWears({
      fragrances: [...excluded, included],
      wears: [],
      todayKey: TODAY,
      hour: DAY_HOUR,
    });

    expect(result.map((r) => r.fragrance.id)).toEqual(['included-full']);
  });

  it('includes partial, sample, decant, null, and undefined bottle statuses', () => {
    const partial = makeFragrance({ id: 'partial', bottle_status: 'partial' });
    const sample = makeFragrance({ id: 'sample', bottle_status: 'sample' });
    const decant = makeFragrance({ id: 'decant', bottle_status: 'decant' });
    const nullStatus = makeFragrance({ id: 'null-status', bottle_status: null });
    const undefinedStatus = makeFragrance({ id: 'undefined-status', bottle_status: undefined });

    const fragrances = [partial, sample, decant, nullStatus, undefinedStatus];
    const result = suggestWears({ fragrances, wears: [], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.map((r) => r.fragrance.id).sort()).toEqual(
      fragrances.map((f) => f.id).sort(),
    );
  });

  it('excludes fragrances already worn today', () => {
    const wornToday = makeFragrance({ id: 'worn-today' });
    const notWorn = makeFragrance({ id: 'not-worn' });
    const wears = [makeWear({ fragrance_id: 'worn-today', worn_on: TODAY })];

    const result = suggestWears({
      fragrances: [wornToday, notWorn],
      wears,
      todayKey: TODAY,
      hour: DAY_HOUR,
    });

    expect(result.map((r) => r.fragrance.id)).toEqual(['not-worn']);
  });
});

describe('suggestWears - rating scoring', () => {
  it('defaults a missing rating to 5 (15 points) with no favorite reason', () => {
    const frag = makeFragrance({ id: 'no-rating', rating: null });
    const wear = makeWear({ fragrance_id: 'no-rating', worn_on: daysAgo(TODAY, 5) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15);
    expect(result.reasons).not.toContain('A favorite');
  });

  it('scores rating * 3 and adds "A favorite" at rating >= 9', () => {
    const frag = makeFragrance({ id: 'top-rated', rating: 9 });
    const wear = makeWear({ fragrance_id: 'top-rated', worn_on: daysAgo(TODAY, 5) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(27);
    expect(result.reasons).toContain('A favorite');
  });

  it('does not add "A favorite" just below the threshold', () => {
    const frag = makeFragrance({ id: 'mid-rated', rating: 8 });
    const wear = makeWear({ fragrance_id: 'mid-rated', worn_on: daysAgo(TODAY, 5) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(24);
    expect(result.reasons).not.toContain('A favorite');
  });
});

describe('suggestWears - season scoring', () => {
  it('adds 25 and "In season" when preferred_seasons includes the current season', () => {
    const frag = makeFragrance({ id: 'in-season', preferred_seasons: ['summer'] });
    const wear = makeWear({ fragrance_id: 'in-season', worn_on: daysAgo(TODAY, 5) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 + 25);
    expect(result.reasons).toContain('In season');
  });

  it('subtracts 12 with no reason when preferred_seasons excludes the current season', () => {
    const frag = makeFragrance({ id: 'off-season', preferred_seasons: ['winter'] });
    const wear = makeWear({ fragrance_id: 'off-season', worn_on: daysAgo(TODAY, 5) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 - 12);
    expect(result.reasons).not.toContain('In season');
  });

  it('applies no season adjustment when preferred_seasons is empty or unset', () => {
    const emptySeasons = makeFragrance({ id: 'empty-seasons', preferred_seasons: [] });
    const unsetSeasons = makeFragrance({ id: 'unset-seasons', preferred_seasons: null });
    const wears = [
      makeWear({ fragrance_id: 'empty-seasons', worn_on: daysAgo(TODAY, 5) }),
      makeWear({ fragrance_id: 'unset-seasons', worn_on: daysAgo(TODAY, 5) }),
    ];

    const result = suggestWears({
      fragrances: [emptySeasons, unsetSeasons],
      wears,
      todayKey: TODAY,
      hour: DAY_HOUR,
    });

    result.forEach((r) => expect(r.score).toBe(15));
  });
});

describe('suggestWears - time of day scoring', () => {
  it('adds 4 for an "either" preference regardless of slot', () => {
    const frag = makeFragrance({ id: 'either-time', preferred_time_of_day: 'either' });
    const wear = makeWear({ fragrance_id: 'either-time', worn_on: daysAgo(TODAY, 5) });

    const dayResult = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR })[0];
    const nightResult = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: NIGHT_HOUR })[0];

    expect(dayResult.score).toBe(15 + 4);
    expect(nightResult.score).toBe(15 + 4);
  });

  it('adds 10 and "Day-friendly" when the day preference matches the day slot', () => {
    const frag = makeFragrance({ id: 'day-pref', preferred_time_of_day: 'day' });
    const wear = makeWear({ fragrance_id: 'day-pref', worn_on: daysAgo(TODAY, 5) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 + 10);
    expect(result.reasons).toContain('Day-friendly');
  });

  it('adds 10 and "Made for tonight" when the night preference matches the night slot', () => {
    const frag = makeFragrance({ id: 'night-pref', preferred_time_of_day: 'night' });
    const wear = makeWear({ fragrance_id: 'night-pref', worn_on: daysAgo(TODAY, 5) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: NIGHT_HOUR });

    expect(result.score).toBe(15 + 10);
    expect(result.reasons).toContain('Made for tonight');
  });

  it('subtracts 6 with no reason when the time of day preference mismatches the slot', () => {
    const frag = makeFragrance({ id: 'mismatch-time', preferred_time_of_day: 'night' });
    const wear = makeWear({ fragrance_id: 'mismatch-time', worn_on: daysAgo(TODAY, 5) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 - 6);
    expect(result.reasons).not.toContain('Day-friendly');
    expect(result.reasons).not.toContain('Made for tonight');
  });
});

describe('suggestWears - recency scoring', () => {
  it('adds 15 and a reason for a never-worn fragrance', () => {
    const frag = makeFragrance({ id: 'never-worn' });
    const [result] = suggestWears({ fragrances: [frag], wears: [], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 + 15);
    expect(result.reasons).toContain('Never worn — give it a first wear');
  });

  it('adds 20 and "Resting for N weeks" at >= 60 days since last worn', () => {
    const frag = makeFragrance({ id: 'rest-60' });
    const wear = makeWear({ fragrance_id: 'rest-60', worn_on: daysAgo(TODAY, 60) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 + 20);
    expect(result.reasons).toContain('Resting for 8 weeks');
  });

  it('adds 12 and "Resting for N weeks" at >= 30 days since last worn', () => {
    const frag = makeFragrance({ id: 'rest-30' });
    const wear = makeWear({ fragrance_id: 'rest-30', worn_on: daysAgo(TODAY, 30) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 + 12);
    expect(result.reasons).toContain('Resting for 4 weeks');
  });

  it('adds 6 with no reason at >= 14 days since last worn', () => {
    const frag = makeFragrance({ id: 'rest-14' });
    const wear = makeWear({ fragrance_id: 'rest-14', worn_on: daysAgo(TODAY, 14) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 + 6);
    expect(result.reasons).toEqual([]);
  });

  it('subtracts 15 with no reason at <= 2 days since last worn', () => {
    const frag = makeFragrance({ id: 'recent-2' });
    const wear = makeWear({ fragrance_id: 'recent-2', worn_on: daysAgo(TODAY, 2) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 - 15);
    expect(result.reasons).toEqual([]);
  });

  it('applies no recency adjustment for a mid-range gap', () => {
    const frag = makeFragrance({ id: 'mid-gap' });
    const wear = makeWear({ fragrance_id: 'mid-gap', worn_on: daysAgo(TODAY, 5) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15);
    expect(result.reasons).toEqual([]);
  });

  it('uses the 30-day tier just below the 60-day boundary', () => {
    const frag = makeFragrance({ id: 'rest-59' });
    const wear = makeWear({ fragrance_id: 'rest-59', worn_on: daysAgo(TODAY, 59) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 + 12);
  });

  it('uses the 14-day tier just below the 30-day boundary', () => {
    const frag = makeFragrance({ id: 'rest-29' });
    const wear = makeWear({ fragrance_id: 'rest-29', worn_on: daysAgo(TODAY, 29) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 + 6);
  });

  it('applies no adjustment just above the 2-day boundary', () => {
    const frag = makeFragrance({ id: 'recent-3' });
    const wear = makeWear({ fragrance_id: 'recent-3', worn_on: daysAgo(TODAY, 3) });
    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15);
  });
});

describe('suggestWears - compliment scoring', () => {
  it('adds 10 and "Crowd-pleaser" when the average compliments per wear is >= 1', () => {
    const frag = makeFragrance({ id: 'crowd-pleaser' });
    const wears = [
      makeWear({ fragrance_id: 'crowd-pleaser', worn_on: daysAgo(TODAY, 5), compliment_count: 1 }),
      makeWear({ fragrance_id: 'crowd-pleaser', worn_on: daysAgo(TODAY, 6), compliment_count: 1 }),
    ];
    const [result] = suggestWears({ fragrances: [frag], wears, todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15 + 10);
    expect(result.reasons).toContain('Crowd-pleaser');
  });

  it('does not add the compliment bonus when the average is below 1', () => {
    const frag = makeFragrance({ id: 'no-crowd' });
    const wears = [
      makeWear({ fragrance_id: 'no-crowd', worn_on: daysAgo(TODAY, 5), compliment_count: 1 }),
      makeWear({ fragrance_id: 'no-crowd', worn_on: daysAgo(TODAY, 6), compliment_count: 0 }),
    ];
    const [result] = suggestWears({ fragrances: [frag], wears, todayKey: TODAY, hour: DAY_HOUR });

    expect(result.score).toBe(15);
    expect(result.reasons).not.toContain('Crowd-pleaser');
  });
});

describe('suggestWears - reason ordering and max 3', () => {
  it('keeps only the top 3 reasons ordered by point contribution', () => {
    const frag = makeFragrance({
      id: 'stacked',
      rating: 10,
      preferred_seasons: ['summer'],
      preferred_time_of_day: 'day',
    });
    const wear = makeWear({
      fragrance_id: 'stacked',
      worn_on: daysAgo(TODAY, 60),
      compliment_count: 2,
    });

    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour: DAY_HOUR });

    // favorite(30) + season(25) + time(10) + recency(20) + compliments(10) = 95
    expect(result.score).toBe(95);
    expect(result.reasons).toEqual(['A favorite', 'In season', 'Resting for 8 weeks']);
    expect(result.reasons.length).toBeLessThanOrEqual(3);
  });
});

describe('suggestWears - deterministic tie-breaks', () => {
  it('breaks score ties by rating desc, with null ratings last', () => {
    const higherRating = makeFragrance({
      id: 'rating-9',
      name: 'Rating Nine',
      rating: 9,
      preferred_time_of_day: 'night', // mismatched at DAY_HOUR: -6
    });
    const midRating = makeFragrance({
      id: 'rating-7',
      name: 'Rating Seven',
      rating: 7,
    });
    const nullRating = makeFragrance({
      id: 'rating-null',
      name: 'Rating Null',
      rating: null,
    });

    const wears = [
      makeWear({ fragrance_id: 'rating-9', worn_on: daysAgo(TODAY, 5) }), // neutral recency
      makeWear({ fragrance_id: 'rating-7', worn_on: daysAgo(TODAY, 5) }), // neutral recency
      makeWear({ fragrance_id: 'rating-null', worn_on: daysAgo(TODAY, 14) }), // +6 short rest
    ];

    const result = suggestWears({
      fragrances: [higherRating, midRating, nullRating],
      wears,
      todayKey: TODAY,
      hour: DAY_HOUR,
    });

    // All three tie at score 21.
    result.forEach((r) => expect(r.score).toBe(21));
    expect(result.map((r) => r.fragrance.id)).toEqual(['rating-9', 'rating-7', 'rating-null']);
  });

  it('breaks score and rating ties by name ascending', () => {
    const zephyr = makeFragrance({ id: 'zephyr', name: 'Zephyr', rating: 5 });
    const amber = makeFragrance({ id: 'amber', name: 'Amber', rating: 5 });
    const wears = [
      makeWear({ fragrance_id: 'zephyr', worn_on: daysAgo(TODAY, 5) }),
      makeWear({ fragrance_id: 'amber', worn_on: daysAgo(TODAY, 5) }),
    ];

    const result = suggestWears({
      fragrances: [zephyr, amber],
      wears,
      todayKey: TODAY,
      hour: DAY_HOUR,
    });

    expect(result.map((r) => r.fragrance.name)).toEqual(['Amber', 'Zephyr']);
  });
});

describe('suggestWears - day/night slot boundaries', () => {
  it.each([
    [5, 15 - 6],
    [6, 15 + 10],
    [17, 15 + 10],
    [18, 15 - 6],
  ])('hour %i scores a day-preference fragrance at %i', (hour, expectedScore) => {
    const frag = makeFragrance({ id: 'boundary-day', preferred_time_of_day: 'day' });
    const wear = makeWear({ fragrance_id: 'boundary-day', worn_on: daysAgo(TODAY, 5) });

    const [result] = suggestWears({ fragrances: [frag], wears: [wear], todayKey: TODAY, hour });

    expect(result.score).toBe(expectedScore);
  });
});

describe('suggestWears - integration ranking', () => {
  it('ranks a mixed set of fragrances in the expected order', () => {
    const bergamotDream = makeFragrance({
      id: 'bergamot-dream',
      name: 'Bergamot Dream',
      rating: 9,
      preferred_seasons: ['summer'],
      preferred_time_of_day: 'day',
    });
    const winterOud = makeFragrance({
      id: 'winter-oud',
      name: 'Winter Oud',
      rating: 8,
      preferred_seasons: ['winter'],
      preferred_time_of_day: 'night',
    });
    const everydayCitrus = makeFragrance({
      id: 'everyday-citrus',
      name: 'Everyday Citrus',
      rating: null,
      preferred_time_of_day: 'either',
    });
    const oldReliable = makeFragrance({
      id: 'old-reliable',
      name: 'Old Reliable',
      rating: 6,
    });
    const crowdFavorite = makeFragrance({
      id: 'crowd-favorite',
      name: 'Crowd Favorite',
      rating: 7,
      preferred_seasons: ['summer', 'fall'],
    });

    const wears = [
      makeWear({ fragrance_id: 'bergamot-dream', worn_on: daysAgo(TODAY, 90), compliment_count: 2 }),
      makeWear({ fragrance_id: 'winter-oud', worn_on: daysAgo(TODAY, 10), compliment_count: 0 }),
      makeWear({ fragrance_id: 'old-reliable', worn_on: daysAgo(TODAY, 1), compliment_count: 0 }),
      makeWear({ fragrance_id: 'crowd-favorite', worn_on: daysAgo(TODAY, 45), compliment_count: 3 }),
      // everyday-citrus is never worn.
    ];

    const result = suggestWears({
      fragrances: [bergamotDream, winterOud, everydayCitrus, oldReliable, crowdFavorite],
      wears,
      todayKey: TODAY,
      hour: DAY_HOUR,
    });

    expect(result.map((r) => r.fragrance.name)).toEqual([
      'Bergamot Dream',
      'Crowd Favorite',
      'Everyday Citrus',
      'Winter Oud',
      'Old Reliable',
    ]);

    expect(result.map((r) => r.score)).toEqual([92, 68, 34, 6, 3]);
  });
});

describe('describeSuggestion', () => {
  it('joins reasons with " · "', () => {
    const suggestion = { fragrance: makeFragrance(), score: 10, reasons: ['A', 'B', 'C'] };
    expect(describeSuggestion(suggestion)).toBe('A · B · C');
  });

  it('returns an empty string when there are no reasons', () => {
    const suggestion = { fragrance: makeFragrance(), score: 10, reasons: [] };
    expect(describeSuggestion(suggestion)).toBe('');
  });
});
