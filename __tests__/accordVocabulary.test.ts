import {
  familyForAccord,
  normalizeAccord,
  suggestAccords,
} from '../lib/accordVocabulary';

describe('accord vocabulary', () => {
  it('normalizes accord labels for storage', () => {
    expect(normalizeAccord('  Orange Blossom  ')).toBe('orange blossom');
    expect(normalizeAccord('Warm-Spicy')).toBe('warm spicy');
  });

  it('suggests curated accord descriptors by prefix or contained word', () => {
    expect(suggestAccords('van')).toContain('vanilla');
    expect(suggestAccords('spicy')).toEqual(
      expect.arrayContaining(['fresh spicy', 'soft spicy', 'warm spicy']),
    );
  });

  it('excludes accords that are already selected', () => {
    expect(suggestAccords('van', ['vanilla'])).not.toContain('vanilla');
  });

  it('maps curated descriptors to UI families', () => {
    expect(familyForAccord('white floral')).toBe('floral');
    expect(familyForAccord('warm spicy')).toBe('spicy');
    expect(familyForAccord('ambroxan')).toBe('woody');
    expect(familyForAccord('unknown custom accord')).toBe('woody');
  });
});
