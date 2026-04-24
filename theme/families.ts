import { familyForAccord, type AccordUiFamily } from '../lib/accordVocabulary';

// Accord family taxonomy. Tints live inside the oxblood hue family —
// small chroma/lightness shifts only; no rainbow.

export type Family = AccordUiFamily;

export const FAMILY: Record<Family, { tint: string; border: string; dot: string; label: string }> = {
  woody:    { tint: 'rgba(139,58,58,0.22)',  border: 'rgba(139,58,58,0.45)',  dot: '#8B3A3A', label: 'Woody' },
  oriental: { tint: 'rgba(163,70,55,0.18)',  border: 'rgba(163,70,55,0.40)',  dot: '#A34637', label: 'Oriental' },
  fresh:    { tint: 'rgba(120,88,88,0.18)',  border: 'rgba(120,88,88,0.38)',  dot: '#785858', label: 'Fresh' },
  floral:   { tint: 'rgba(170,110,110,0.16)', border: 'rgba(170,110,110,0.36)', dot: '#AA6E6E', label: 'Floral' },
  spicy:    { tint: 'rgba(139,58,58,0.28)',  border: 'rgba(139,58,58,0.55)',  dot: '#8B3A3A', label: 'Spicy' },
};

export function familyFor(accord: string): Family {
  return familyForAccord(accord);
}
