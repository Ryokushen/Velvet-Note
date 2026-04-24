import accordsData from '../data/accords.json';
import descriptorsData from '../data/descriptors.json';

export type AccordUiFamily = 'woody' | 'oriental' | 'fresh' | 'floral' | 'spicy';

type AccordEntry = {
  label: string;
  ui_family: AccordUiFamily;
};

type DescriptorData = {
  main_accord_descriptors: AccordEntry[];
};

type AccordData = {
  family_accords: AccordEntry[];
  house_signature_accords: AccordEntry[];
};

const descriptors = descriptorsData as DescriptorData;
const accordFamilies = accordsData as AccordData;

const entries: AccordEntry[] = [
  ...descriptors.main_accord_descriptors,
  ...accordFamilies.family_accords,
  ...accordFamilies.house_signature_accords,
];

const byLabel = new Map<string, AccordEntry>();

entries.forEach((entry) => {
  byLabel.set(normalizeAccord(entry.label), entry);
});

export const ACCORD_DESCRIPTORS = descriptors.main_accord_descriptors.map((entry) => entry.label);

export function normalizeAccord(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

export function familyForAccord(value: string): AccordUiFamily {
  return byLabel.get(normalizeAccord(value))?.ui_family ?? 'woody';
}

export function suggestAccords(query: string, selected: string[] = [], limit = 8): string[] {
  const normalizedQuery = normalizeAccord(query);
  if (!normalizedQuery) {
    return [];
  }

  const selectedSet = new Set(selected.map(normalizeAccord));

  return ACCORD_DESCRIPTORS.filter((label) => {
    const normalizedLabel = normalizeAccord(label);
    if (selectedSet.has(normalizedLabel)) {
      return false;
    }
    return normalizedLabel.startsWith(normalizedQuery) || normalizedLabel.includes(` ${normalizedQuery}`);
  }).slice(0, limit);
}
