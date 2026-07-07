import { suggestWears, type SuggestionContext } from '../lib/suggestion';
import type { Fragrance } from '../types/fragrance';

const baseFragrance = (over: Partial<Fragrance>): Fragrance =>
  ({
    id: 'f',
    user_id: 'u',
    brand: 'Brand',
    name: 'Name',
    concentration: 'EDP',
    accords: [],
    rating: 7,
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
  }) as Fragrance;

const fresh = baseFragrance({ id: 'fresh', name: 'Fresh One', accords: ['citrus'] });
const amber = baseFragrance({ id: 'amber', name: 'Amber One', accords: ['amber'] });
const earthy = baseFragrance({ id: 'earthy', name: 'Earthy One', accords: ['earthy'] });

function context(over: Partial<SuggestionContext>): SuggestionContext {
  return {
    fragrances: [fresh, amber],
    wears: [],
    todayKey: '2026-07-06',
    hour: 10,
    ...over,
  };
}

function scoreOf(results: ReturnType<typeof suggestWears>, id: string): number {
  return results.find((r) => r.fragrance.id === id)!.score;
}

describe('suggestWears weather rule', () => {
  it('leaves scores untouched when weather is absent', () => {
    const withoutKey = suggestWears(context({}));
    const withNull = suggestWears(context({ weather: null }));
    expect(withNull.map((r) => [r.fragrance.id, r.score])).toEqual(
      withoutKey.map((r) => [r.fragrance.id, r.score]),
    );
  });

  it('boosts fresh profiles and penalizes heavy ones in heat', () => {
    const neutral = suggestWears(context({}));
    const hot = suggestWears(
      context({ weather: { tempC: 32, humidity: 40, precipitationMm: 0 } }),
    );
    expect(scoreOf(hot, 'fresh')).toBe(scoreOf(neutral, 'fresh') + 15);
    expect(scoreOf(hot, 'amber')).toBe(scoreOf(neutral, 'amber') - 15);
    expect(hot[0].fragrance.id).toBe('fresh');
    expect(hot[0].reasons).toContain('Made for this heat');
  });

  it('reverses in cold weather with a cold-day reason', () => {
    const cold = suggestWears(
      context({ weather: { tempC: 2, humidity: 40, precipitationMm: 0 } }),
    );
    expect(cold[0].fragrance.id).toBe('amber');
    expect(cold[0].reasons).toContain('A cold-day comfort');
  });

  it('applies half weight in mild warm weather', () => {
    const neutral = suggestWears(context({}));
    const warm = suggestWears(
      context({ weather: { tempC: 24, humidity: 40, precipitationMm: 0 } }),
    );
    expect(scoreOf(warm, 'fresh')).toBe(scoreOf(neutral, 'fresh') + 8);
  });

  it('rewards rain-loving profiles when it rains', () => {
    const rainy = suggestWears(
      context({
        fragrances: [earthy, fresh],
        weather: { tempC: 16, humidity: 60, precipitationMm: 2 },
      }),
    );
    const earthyResult = rainy.find((r) => r.fragrance.id === 'earthy')!;
    expect(earthyResult.reasons).toContain('Right for the rain');
  });

  it('penalizes heavy profiles in warm humidity', () => {
    const humid = suggestWears(
      context({ weather: { tempC: 24, humidity: 85, precipitationMm: 0 } }),
    );
    const dry = suggestWears(
      context({ weather: { tempC: 24, humidity: 40, precipitationMm: 0 } }),
    );
    expect(scoreOf(humid, 'amber')).toBe(scoreOf(dry, 'amber') - 6);
    expect(scoreOf(humid, 'fresh')).toBe(scoreOf(dry, 'fresh'));
  });

  it('keeps the temperature axis weaker than an explicit season preference', () => {
    const { SUGGESTION_WEIGHTS } = require('../lib/suggestion');
    expect(SUGGESTION_WEIGHTS.weatherTempPoints).toBeLessThan(SUGGESTION_WEIGHTS.seasonMatch);
    expect(SUGGESTION_WEIGHTS.weatherRainPoints).toBeLessThan(SUGGESTION_WEIGHTS.seasonMatch);
  });
});
