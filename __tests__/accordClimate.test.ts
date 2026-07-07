import { climateAffinityForAccord, climateAffinityForAccords } from '../lib/accordClimate';

describe('climateAffinityForAccord', () => {
  it('uses overrides for high-signal accords', () => {
    expect(climateAffinityForAccord('citrus').heat).toBe(1);
    expect(climateAffinityForAccord('amber').cold).toBe(1);
    expect(climateAffinityForAccord('earthy').rain).toBe(1);
  });

  it('is case-insensitive', () => {
    expect(climateAffinityForAccord('Citrus')).toEqual(climateAffinityForAccord('citrus'));
    expect(climateAffinityForAccord('  AMBER  ')).toEqual(climateAffinityForAccord('amber'));
  });

  it('falls back to the accord family for unmapped accords', () => {
    const affinity = climateAffinityForAccord('some-unknown-descriptor');
    // Unknown accords classify as woody: mild cold/rain lean.
    expect(affinity.cold).toBeGreaterThan(0);
    expect(affinity.rain).toBeGreaterThan(0);
    expect(affinity.heat).toBeLessThan(0);
  });
});

describe('climateAffinityForAccords', () => {
  it('returns null for missing or empty accord lists', () => {
    expect(climateAffinityForAccords(null)).toBeNull();
    expect(climateAffinityForAccords(undefined)).toBeNull();
    expect(climateAffinityForAccords([])).toBeNull();
  });

  it('averages affinity across accords', () => {
    const citrus = climateAffinityForAccord('citrus');
    const amber = climateAffinityForAccord('amber');
    const combined = climateAffinityForAccords(['citrus', 'amber'])!;
    expect(combined.heat).toBeCloseTo((citrus.heat + amber.heat) / 2);
    expect(combined.cold).toBeCloseTo((citrus.cold + amber.cold) / 2);
    expect(combined.rain).toBeCloseTo((citrus.rain + amber.rain) / 2);
  });

  it('keeps single-accord affinity unchanged', () => {
    expect(climateAffinityForAccords(['tobacco'])).toEqual(climateAffinityForAccord('tobacco'));
  });
});
