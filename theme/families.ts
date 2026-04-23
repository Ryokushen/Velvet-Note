// Accord family taxonomy. Tints live inside the oxblood hue family —
// small chroma/lightness shifts only; no rainbow.

export type Family = 'woody' | 'oriental' | 'fresh' | 'floral' | 'spicy';

export const FAMILY: Record<Family, { tint: string; border: string; dot: string; label: string }> = {
  woody:    { tint: 'rgba(139,58,58,0.22)',  border: 'rgba(139,58,58,0.45)',  dot: '#8B3A3A', label: 'Woody' },
  oriental: { tint: 'rgba(163,70,55,0.18)',  border: 'rgba(163,70,55,0.40)',  dot: '#A34637', label: 'Oriental' },
  fresh:    { tint: 'rgba(120,88,88,0.18)',  border: 'rgba(120,88,88,0.38)',  dot: '#785858', label: 'Fresh' },
  floral:   { tint: 'rgba(170,110,110,0.16)', border: 'rgba(170,110,110,0.36)', dot: '#AA6E6E', label: 'Floral' },
  spicy:    { tint: 'rgba(139,58,58,0.28)',  border: 'rgba(139,58,58,0.55)',  dot: '#8B3A3A', label: 'Spicy' },
};

// Curated vocabulary → family. Unknown free-text falls back to 'woody'.
const VOCAB: Record<string, Family> = {
  // fresh
  bergamot: 'fresh', lemon: 'fresh', lime: 'fresh', grapefruit: 'fresh', orange: 'fresh',
  mandarin: 'fresh', 'neroli': 'fresh', aquatic: 'fresh', marine: 'fresh', green: 'fresh',
  petrichor: 'fresh', citrus: 'fresh', fig: 'fresh', milk: 'fresh', mint: 'fresh',
  cucumber: 'fresh', ozonic: 'fresh', salty: 'fresh', 'orange blossom': 'fresh',
  // floral
  rose: 'floral', jasmine: 'floral', iris: 'floral', tuberose: 'floral', violet: 'floral',
  ylang: 'floral', lily: 'floral', magnolia: 'floral', lotus: 'floral', peony: 'floral',
  gardenia: 'floral', osmanthus: 'floral', 'orange-blossom': 'floral', floral: 'floral',
  // woody
  vetiver: 'woody', cedar: 'woody', oud: 'woody', sandalwood: 'woody', leather: 'woody',
  smoke: 'woody', patchouli: 'woody', pine: 'woody', agar: 'woody', birch: 'woody',
  guaiac: 'woody', hinoki: 'woody', teak: 'woody', woody: 'woody', wood: 'woody',
  // oriental
  amber: 'oriental', labdanum: 'oriental', tonka: 'oriental', vanilla: 'oriental',
  tobacco: 'oriental', honey: 'oriental', musk: 'oriental', myrrh: 'oriental',
  benzoin: 'oriental', frankincense: 'oriental', 'balsam': 'oriental', oriental: 'oriental',
  // spicy
  pepper: 'spicy', 'pink pepper': 'spicy', saffron: 'spicy', cardamom: 'spicy',
  clove: 'spicy', cinnamon: 'spicy', ginger: 'spicy', nutmeg: 'spicy', spicy: 'spicy',
};

export function familyFor(accord: string): Family {
  const k = accord.trim().toLowerCase();
  if (!k) return 'woody';
  return VOCAB[k] ?? VOCAB[k.replace(/[\s-]/g, '')] ?? 'woody';
}
