import {
  listFragrances,
  createFragrance,
  updateFragrance,
  deleteFragrance,
} from '../lib/fragrances';

jest.mock('../lib/supabase', () => {
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn(),
    then: undefined,
  };
  return {
    supabase: {
      from: jest.fn(() => builder),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'u' } },
          error: null,
        }),
      },
      __builder: builder,
    },
  };
});

const { supabase } = require('../lib/supabase');
const builder = (supabase as any).__builder;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listFragrances', () => {
  it('selects all columns and orders by created_at desc', async () => {
    builder.order.mockResolvedValueOnce({ data: [], error: null });
    const result = await listFragrances();
    expect(supabase.from).toHaveBeenCalledWith('fragrances');
    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual([]);
  });

  it('throws on Supabase error', async () => {
    builder.order.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    await expect(listFragrances()).rejects.toThrow('boom');
  });
});

describe('createFragrance', () => {
  it('inserts and returns the new row', async () => {
    const row = {
      id: 'new',
      user_id: 'u',
      brand: 'Chanel',
      name: 'Bleu',
      concentration: 'EDP',
      accords: [],
      rating: 8,
      created_at: '2026-04-20T00:00:00Z',
      updated_at: '2026-04-20T00:00:00Z',
    };
    builder.single.mockResolvedValueOnce({ data: row, error: null });
    const result = await createFragrance({
      brand: 'Chanel',
      name: 'Bleu',
      concentration: 'EDP',
      accords: [],
      rating: 8,
    });
    expect(builder.insert).toHaveBeenCalled();
    expect(result).toEqual(row);
  });
});

describe('updateFragrance', () => {
  it('updates by id and returns the row', async () => {
    const row = { id: 'x', rating: 9 };
    builder.single.mockResolvedValueOnce({ data: row, error: null });
    const result = await updateFragrance('x', { rating: 9 });
    expect(builder.update).toHaveBeenCalledWith({ rating: 9 });
    expect(builder.eq).toHaveBeenCalledWith('id', 'x');
    expect(result).toEqual(row);
  });
});

describe('deleteFragrance', () => {
  it('deletes by id', async () => {
    builder.eq.mockResolvedValueOnce({ error: null });
    await deleteFragrance('x');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'x');
  });
});
