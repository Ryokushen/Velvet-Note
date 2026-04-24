import catalogData from '../data/catalog/perfume-recommendation-catalog.json';
import { normalizeAccord } from './accordVocabulary';

export type CatalogFragrance = {
  id: string;
  brand: string;
  name: string;
  description: string;
  notes: string[];
  imageUrl: string;
  source: string;
};

const catalog = catalogData as CatalogFragrance[];

export function notesToAccords(notes: string[]): string[] {
  const seen = new Set<string>();
  const accords: string[] = [];

  notes.forEach((note) => {
    const accord = normalizeAccord(note);
    if (!accord || seen.has(accord)) {
      return;
    }
    seen.add(accord);
    accords.push(accord);
  });

  return accords;
}

export function searchCatalog(query: string, limit = 8): CatalogFragrance[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return [];
  }

  return catalog
    .filter((entry) => {
      const haystack = [
        entry.brand,
        entry.name,
        entry.description,
        ...entry.notes,
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, limit);
}
