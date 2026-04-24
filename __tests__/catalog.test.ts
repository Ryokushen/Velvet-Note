import { notesToAccords, searchCatalog, searchSupabaseCatalog } from '../lib/catalog';

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
        imageUrl: null,
        source: 'parfumo_tidytuesday_2024_12_10',
      },
    ]);
  });

  it('does not query Supabase for very short catalog searches', async () => {
    await expect(searchSupabaseCatalog('c')).resolves.toEqual([]);

    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
