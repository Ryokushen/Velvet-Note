import {
  findSupabaseCatalogByBarcode,
  notesToAccords,
  normalizeBarcode,
  searchCatalog,
  searchSupabaseCatalog,
  submitCatalogBarcodeSubmission,
} from '../lib/catalog';

jest.mock('../lib/supabase', () => {
  const builder: any = {
    select: jest.fn(() => builder),
    or: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(),
  };
  return {
    supabase: {
      from: jest.fn(() => builder),
      rpc: jest.fn(),
      __builder: builder,
    },
  };
});

const { supabase } = require('../lib/supabase');
const builder = (supabase as any).__builder;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('catalog', () => {
  it('finds catalog entries by fragrance name', () => {
    const results = searchCatalog('tihota');

    expect(results[0]).toMatchObject({
      brand: 'Indult',
      name: 'Tihota Eau de Parfum',
    });
  });

  it('normalizes catalog notes into accord strings', () => {
    expect(notesToAccords(['Vanilla bean', ' musks ', ''])).toEqual([
      'vanilla bean',
      'musks',
    ]);
  });

  it('normalizes scanner barcode payloads to digits only', () => {
    expect(normalizeBarcode(' UPC-A: 0 12345-67890 5 ')).toBe('012345678905');
    expect(normalizeBarcode('ean_13=3348901321129')).toBe('3348901321129');
    expect(normalizeBarcode('abc')).toBe('');
  });

  it('searches the shared Supabase catalog and normalizes notes', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: [
        {
          id: 'catalog-1',
          brand: 'Serge Lutens',
          name: 'Chergui',
          concentration: 'EDP',
          accords: ['Sweet', 'Spicy'],
          notes_top: ['Tobacco Leaf'],
          notes_middle: ['Honey'],
          notes_base: ['Amber'],
          release_year: 2001,
          perfumers: ['Christopher Sheldrake'],
          rating_value: 7.8,
          rating_count: 1242,
          image_url: 'https://images.example/chergui.jpg',
          source: 'parfumo_tidytuesday_2024_12_10',
        },
      ],
      error: null,
    });

    const results = await searchSupabaseCatalog('chergui', 5);

    expect(supabase.rpc).toHaveBeenCalledWith('search_catalog_fragrances', {
      search_text: 'chergui',
      match_limit: 5,
    });
    expect(results).toEqual([
      {
        id: 'catalog-1',
        brand: 'Serge Lutens',
        name: 'Chergui',
        concentration: 'EDP',
        description: '',
        notes: ['Sweet', 'Spicy', 'Tobacco Leaf', 'Honey', 'Amber'],
        notesTop: ['Tobacco Leaf'],
        notesMiddle: ['Honey'],
        notesBase: ['Amber'],
        releaseYear: 2001,
        perfumers: ['Christopher Sheldrake'],
        ratingValue: 7.8,
        ratingCount: 1242,
        imageUrl: 'https://images.example/chergui.jpg',
        source: 'parfumo_tidytuesday_2024_12_10',
      },
    ]);
  });

  it('does not query Supabase for very short catalog searches', async () => {
    await expect(searchSupabaseCatalog('c')).resolves.toEqual([]);

    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('looks up a shared catalog fragrance by barcode', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: [
        {
          id: 'catalog-1',
          brand: 'Dior',
          name: 'Sauvage',
          concentration: 'EDT',
          accords: ['Fresh Spicy'],
          notes_top: ['Bergamot'],
          notes_middle: ['Pepper'],
          notes_base: ['Ambroxan'],
          release_year: 2015,
          perfumers: ['François Demachy'],
          rating_value: 7.7,
          rating_count: 3050,
          image_url: 'https://images.example/sauvage.jpg',
          source: 'barcode_api',
        },
      ],
      error: null,
    });

    const result = await findSupabaseCatalogByBarcode('EAN 3348901321129');

    expect(supabase.rpc).toHaveBeenCalledWith('find_catalog_fragrance_by_barcode', {
      barcode_text: '3348901321129',
    });
    expect(result).toMatchObject({
      id: 'catalog-1',
      brand: 'Dior',
      name: 'Sauvage',
      imageUrl: 'https://images.example/sauvage.jpg',
    });
  });

  it('does not query Supabase for invalid barcode payloads', async () => {
    await expect(findSupabaseCatalogByBarcode('abc')).resolves.toBeNull();

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('submits a pending barcode-to-catalog link with normalized digits', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValueOnce({
      insert,
    });

    await submitCatalogBarcodeSubmission('EAN 3348901321129', 'catalog-1');

    expect(supabase.from).toHaveBeenCalledWith('catalog_barcode_submissions');
    expect(insert).toHaveBeenCalledWith({
      barcode: '3348901321129',
      catalog_fragrance_id: 'catalog-1',
    });
  });

  it('does not submit invalid barcode links', async () => {
    await expect(
      submitCatalogBarcodeSubmission('not a barcode', 'catalog-1'),
    ).rejects.toThrow('Valid barcode required');

    expect(supabase.from).not.toHaveBeenCalled();
  });
});
