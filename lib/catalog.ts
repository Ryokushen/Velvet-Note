import catalogData from '../data/catalog/perfume-recommendation-catalog.json';
import type { Concentration } from '../types/fragrance';
import { normalizeAccord } from './accordVocabulary';
import { supabase } from './supabase';

export type CatalogFragrance = {
  id: string;
  brand: string;
  name: string;
  concentration?: Concentration | null;
  description: string;
  notes: string[];
  imageUrl: string | null;
  source: string;
};

const catalog = catalogData as CatalogFragrance[];

type CatalogRow = {
  id: string;
  brand: string;
  name: string;
  concentration: Concentration | null;
  accords: string[] | null;
  notes_top: string[] | null;
  notes_middle: string[] | null;
  notes_base: string[] | null;
  source: string;
};

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

export async function searchSupabaseCatalog(
  query: string,
  limit = 8,
): Promise<CatalogFragrance[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return [];
  }

  const { data, error } = await supabase.rpc('search_catalog_fragrances', {
    search_text: q,
    match_limit: limit,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CatalogRow[]).map(mapCatalogRow);
}

function mapCatalogRow(row: CatalogRow): CatalogFragrance {
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    concentration: row.concentration,
    description: '',
    notes: uniqueText([
      ...(row.accords ?? []),
      ...(row.notes_top ?? []),
      ...(row.notes_middle ?? []),
      ...(row.notes_base ?? []),
    ]),
    imageUrl: null,
    source: row.source,
  };
}

function uniqueText(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(trimmed);
  });
  return result;
}
