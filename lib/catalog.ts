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
  notesTop: string[];
  notesMiddle: string[];
  notesBase: string[];
  releaseYear: number | null;
  perfumers: string[];
  ratingValue: number | null;
  ratingCount: number | null;
  imageUrl: string | null;
  source: string;
};

type LocalCatalogRow = Omit<
  CatalogFragrance,
  'notesTop' | 'notesMiddle' | 'notesBase' | 'releaseYear' | 'perfumers' | 'ratingValue' | 'ratingCount'
>;

const catalog = (catalogData as LocalCatalogRow[]).map((entry) => ({
  ...entry,
  notesTop: [],
  notesMiddle: [],
  notesBase: [],
  releaseYear: null,
  perfumers: [],
  ratingValue: null,
  ratingCount: null,
}));

type CatalogRow = {
  id: string;
  brand: string;
  name: string;
  concentration: Concentration | null;
  accords: string[] | null;
  notes_top: string[] | null;
  notes_middle: string[] | null;
  notes_base: string[] | null;
  release_year: number | null;
  perfumers: string[] | null;
  rating_value: number | string | null;
  rating_count: number | null;
  image_url: string | null;
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

export function normalizeBarcode(value: string): string {
  const payload = value.split(/[:=]/).pop() ?? value;
  const digits = payload.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 14) {
    return '';
  }
  return digits;
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

export async function findSupabaseCatalogByBarcode(
  barcode: string,
): Promise<CatalogFragrance | null> {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) {
    return null;
  }

  const { data, error } = await supabase.rpc('find_catalog_fragrance_by_barcode', {
    barcode_text: normalized,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CatalogRow[];
  return rows[0] ? mapCatalogRow(rows[0]) : null;
}

export async function submitCatalogBarcodeSubmission(
  barcode: string,
  catalogFragranceId: string,
): Promise<void> {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) {
    throw new Error('Valid barcode required');
  }
  if (!catalogFragranceId.trim()) {
    throw new Error('Catalog fragrance required');
  }

  const { error } = await supabase.from('catalog_barcode_submissions').insert({
    barcode: normalized,
    catalog_fragrance_id: catalogFragranceId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function mapCatalogRow(row: CatalogRow): CatalogFragrance {
  const notesTop = uniqueText(row.notes_top ?? []);
  const notesMiddle = uniqueText(row.notes_middle ?? []);
  const notesBase = uniqueText(row.notes_base ?? []);
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    concentration: row.concentration,
    description: '',
    notes: uniqueText([
      ...(row.accords ?? []),
      ...notesTop,
      ...notesMiddle,
      ...notesBase,
    ]),
    notesTop,
    notesMiddle,
    notesBase,
    releaseYear: row.release_year ?? null,
    perfumers: uniqueText(row.perfumers ?? []),
    ratingValue: normalizeNumber(row.rating_value),
    ratingCount: row.rating_count ?? null,
    imageUrl: row.image_url ?? null,
    source: row.source,
  };
}

function normalizeNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
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
