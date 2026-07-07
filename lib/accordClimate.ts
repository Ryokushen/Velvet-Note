import { familyForAccord, normalizeAccord, type AccordUiFamily } from './accordVocabulary';

// Affinity per weather axis, each in [-1, 1]: positive means the accord
// wants that condition, negative means it fights it. Community heuristics:
// fresh/citrus scents carry heat; ambers and ouds bloom in cold air and
// suffocate in humidity; woods and earth read best around rain.
export type ClimateAffinity = {
  heat: number;
  cold: number;
  rain: number;
};

const FAMILY_CLIMATE: Record<AccordUiFamily, ClimateAffinity> = {
  fresh: { heat: 1, cold: -0.5, rain: 0 },
  floral: { heat: 0.3, cold: -0.2, rain: -0.2 },
  woody: { heat: -0.3, cold: 0.5, rain: 0.7 },
  spicy: { heat: -0.6, cold: 0.8, rain: 0.2 },
  oriental: { heat: -1, cold: 1, rain: 0 },
};

// High-signal accords where the family default is too coarse.
const ACCORD_CLIMATE_OVERRIDES: Record<string, ClimateAffinity> = {
  citrus: { heat: 1, cold: -0.6, rain: -0.2 },
  aquatic: { heat: 1, cold: -0.7, rain: 0.3 },
  marine: { heat: 1, cold: -0.7, rain: 0.3 },
  green: { heat: 0.8, cold: -0.4, rain: 0.4 },
  aromatic: { heat: 0.7, cold: -0.2, rain: 0.1 },
  fruity: { heat: 0.6, cold: -0.3, rain: -0.2 },
  soapy: { heat: 0.7, cold: -0.3, rain: 0 },
  powdery: { heat: -0.2, cold: 0.3, rain: -0.3 },
  musky: { heat: -0.2, cold: 0.4, rain: 0.1 },
  earthy: { heat: -0.4, cold: 0.4, rain: 1 },
  mossy: { heat: -0.3, cold: 0.4, rain: 0.9 },
  smoky: { heat: -0.8, cold: 0.9, rain: 0.4 },
  leather: { heat: -0.8, cold: 0.9, rain: 0.3 },
  tobacco: { heat: -0.9, cold: 1, rain: 0.2 },
  amber: { heat: -1, cold: 1, rain: 0 },
  vanilla: { heat: -0.7, cold: 0.9, rain: -0.1 },
  gourmand: { heat: -0.8, cold: 1, rain: -0.1 },
  sweet: { heat: -0.6, cold: 0.7, rain: -0.1 },
  oud: { heat: -1, cold: 0.9, rain: 0.1 },
};

export function climateAffinityForAccord(accord: string): ClimateAffinity {
  const override = ACCORD_CLIMATE_OVERRIDES[normalizeAccord(accord)];
  return override ?? FAMILY_CLIMATE[familyForAccord(accord)];
}

export function climateAffinityForAccords(accords: string[] | null | undefined): ClimateAffinity | null {
  if (!accords || accords.length === 0) return null;
  const sum = accords.reduce(
    (acc, accord) => {
      const affinity = climateAffinityForAccord(accord);
      return {
        heat: acc.heat + affinity.heat,
        cold: acc.cold + affinity.cold,
        rain: acc.rain + affinity.rain,
      };
    },
    { heat: 0, cold: 0, rain: 0 },
  );
  return {
    heat: sum.heat / accords.length,
    cold: sum.cold / accords.length,
    rain: sum.rain / accords.length,
  };
}
