import { buildJournalInsights } from '../lib/insights';
import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';

const baseFragrance = {
  user_id: 'user-1',
  concentration: 'EDP',
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
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
} satisfies Partial<Fragrance>;

const baseWear = {
  user_id: 'user-1',
  notes: null,
  occasion: null,
  compliment_note: null,
  created_at: '2026-04-20T00:00:00Z',
  updated_at: '2026-04-20T00:00:00Z',
} satisfies Partial<Wear>;

describe('buildJournalInsights', () => {
  it('summarizes wear intelligence and taste profile from fragrances and wears', () => {
    const fragrances: Fragrance[] = [
      {
        ...baseFragrance,
        id: 'f1',
        brand: 'Guerlain',
        name: 'Shalimar',
        accords: ['amber', 'vanilla'],
        rating: 9,
      } as Fragrance,
      {
        ...baseFragrance,
        id: 'f2',
        brand: 'Diptyque',
        name: 'Tam Dao',
        accords: ['woody', 'cedar'],
        rating: 7,
      } as Fragrance,
    ];
    const wears: Wear[] = [
      {
        ...baseWear,
        id: 'w1',
        fragrance_id: 'f1',
        worn_on: '2026-04-20',
        season: 'spring',
        time_of_day: 'night',
        compliment_count: 2,
      } as Wear,
      {
        ...baseWear,
        id: 'w2',
        fragrance_id: 'f1',
        worn_on: '2026-04-21',
        season: 'spring',
        time_of_day: 'day',
        compliment_count: 1,
      } as Wear,
      {
        ...baseWear,
        id: 'w3',
        fragrance_id: 'f2',
        worn_on: '2026-04-22',
        season: 'winter',
        time_of_day: 'day',
        compliment_count: 0,
      } as Wear,
    ];

    const insights = buildJournalInsights(fragrances, wears);

    expect(insights.mostWorn[0]).toMatchObject({ fragranceId: 'f1', count: 2 });
    expect(insights.complimentLeaders[0]).toMatchObject({ fragranceId: 'f1', compliments: 3 });
    expect(insights.favoriteSeasons[0]).toEqual({ label: 'Spring', count: 2 });
    expect(insights.timeOfDay).toEqual([
      { label: 'Day', count: 2 },
      { label: 'Night', count: 1 },
    ]);
    expect(insights.topAccords[0]).toMatchObject({ label: 'Amber' });
    expect(insights.neglected[0]).toMatchObject({ fragranceId: 'f2' });
  });
});
