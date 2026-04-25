import {
  createWear,
  deleteWear,
  listWears,
  listWearsForFragrance,
  setActiveWear,
  updateWear,
} from '../lib/wears';

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
      rpc: jest.fn(),
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

const wearRow = {
  id: 'w',
  user_id: 'u',
  fragrance_id: 'f',
  worn_on: '2026-04-23',
  notes: 'Office day',
  created_at: '2026-04-23T12:00:00Z',
  updated_at: '2026-04-23T12:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listWears', () => {
  it('selects all wear rows ordered by wear date and creation time', async () => {
    builder.order
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ data: [wearRow], error: null });

    const result = await listWears();

    expect(supabase.from).toHaveBeenCalledWith('wears');
    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.order).toHaveBeenNthCalledWith(1, 'worn_on', { ascending: false });
    expect(builder.order).toHaveBeenNthCalledWith(2, 'created_at', { ascending: false });
    expect(result).toEqual([wearRow]);
  });

  it('throws on Supabase error', async () => {
    builder.order
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    await expect(listWears()).rejects.toThrow('boom');
  });
});

describe('listWearsForFragrance', () => {
  it('filters by fragrance id before ordering', async () => {
    builder.order
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ data: [wearRow], error: null });

    const result = await listWearsForFragrance('f');

    expect(builder.eq).toHaveBeenCalledWith('fragrance_id', 'f');
    expect(builder.order).toHaveBeenNthCalledWith(1, 'worn_on', { ascending: false });
    expect(builder.order).toHaveBeenNthCalledWith(2, 'created_at', { ascending: false });
    expect(result).toEqual([wearRow]);
  });
});

describe('createWear', () => {
  it('inserts an authenticated user-owned wear row', async () => {
    builder.single.mockResolvedValueOnce({ data: wearRow, error: null });

    const result = await createWear({
      fragrance_id: 'f',
      worn_on: '2026-04-23',
      notes: 'Office day',
    });

    expect(builder.insert).toHaveBeenCalledWith({
      fragrance_id: 'f',
      worn_on: '2026-04-23',
      notes: 'Office day',
      user_id: 'u',
    });
    expect(result).toEqual(wearRow);
  });

  it('rejects unauthenticated inserts', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(createWear({
      fragrance_id: 'f',
      worn_on: '2026-04-23',
      notes: null,
    })).rejects.toThrow('Not authenticated');
  });
});

describe('updateWear', () => {
  it('updates by id and returns the row', async () => {
    const updated = { ...wearRow, notes: null };
    builder.single.mockResolvedValueOnce({ data: updated, error: null });

    const result = await updateWear('w', { notes: null });

    expect(builder.update).toHaveBeenCalledWith({ notes: null });
    expect(builder.eq).toHaveBeenCalledWith('id', 'w');
    expect(result).toEqual(updated);
  });
});

describe('setActiveWear', () => {
  it('marks a wear active through the Supabase RPC', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: wearRow, error: null });

    const result = await setActiveWear('w');

    expect(supabase.rpc).toHaveBeenCalledWith('set_active_wear', { wear_id: 'w' });
    expect(result).toEqual(wearRow);
  });

  it('throws on Supabase RPC error', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    await expect(setActiveWear('w')).rejects.toThrow('boom');
  });
});

describe('deleteWear', () => {
  it('deletes by id', async () => {
    builder.eq.mockResolvedValueOnce({ error: null });

    await deleteWear('w');

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'w');
  });
});
