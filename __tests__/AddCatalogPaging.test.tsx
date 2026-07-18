import { act, fireEvent, render } from '@testing-library/react-native';
import type { CatalogFragrance } from '../lib/catalog';

const mockSearchPage = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/BottleArt', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BottleArt: () => React.createElement(View) };
});

jest.mock('../lib/fragrancePhotos', () => ({
  pickPersonalFragrancePhoto: jest.fn(),
  uploadPersonalFragrancePhoto: jest.fn(),
}));

jest.mock('../lib/haptics', () => ({
  tapLight: jest.fn(),
  notifySuccess: jest.fn(),
  notifyWarning: jest.fn(),
}));

jest.mock('../hooks/useFragrances', () => ({
  useCreateFragrance: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useFragrancesQuery: () => ({ data: [], isLoading: false, error: null }),
}));

jest.mock('../lib/catalog', () => ({
  searchSupabaseCatalogPage: (...args: unknown[]) => mockSearchPage(...args),
  findSupabaseCatalogByBarcode: jest.fn().mockResolvedValue(null),
  notesToAccords: (notes: string[]) => notes,
}));

import Add from '../app/(tabs)/add';

const SEARCH_PLACEHOLDER = 'Search catalog by bottle, brand, or note';

function makeEntry(id: string, name: string): CatalogFragrance {
  return {
    id,
    brand: 'Serge Lutens',
    name,
    concentration: 'EDP',
    description: '',
    notes: ['Amber'],
    notesTop: [],
    notesMiddle: [],
    notesBase: [],
    releaseYear: 2001,
    perfumers: [],
    ratingValue: null,
    ratingCount: null,
    imageUrl: null,
    source: 'parfumo',
  };
}

async function typeQuery(input: unknown, text: string) {
  await act(async () => {
    fireEvent.changeText(input as never, text);
  });
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
  // Flush the resolved search promise + its state updates.
  await act(async () => {
    await Promise.resolve();
  });
}

describe('Add screen catalog paging', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSearchPage.mockReset();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows the "showing X of Y" count once results exist', async () => {
    mockSearchPage.mockResolvedValueOnce({
      items: [makeEntry('a', 'Chergui'), makeEntry('b', 'Ambre Sultan')],
      totalCount: 3,
    });

    const { getByPlaceholderText, getByText } = render(<Add />);
    await typeQuery(getByPlaceholderText(SEARCH_PLACEHOLDER), 'lutens');

    expect(mockSearchPage).toHaveBeenCalledWith('lutens', { limit: 25, offset: 0 });
    expect(getByText('— More results · showing 2 of 3')).toBeTruthy();
  });

  it('appends and de-dupes the next page while preserving prior rows', async () => {
    mockSearchPage.mockResolvedValueOnce({
      items: [makeEntry('a', 'Chergui'), makeEntry('b', 'Ambre Sultan')],
      totalCount: 3,
    });

    const { getByPlaceholderText, getByText, queryByText, getAllByText } = render(<Add />);
    await typeQuery(getByPlaceholderText(SEARCH_PLACEHOLDER), 'lutens');

    // Page 2 returns one duplicate (id 'b') and one new row (id 'c').
    mockSearchPage.mockResolvedValueOnce({
      items: [makeEntry('b', 'Ambre Sultan'), makeEntry('c', 'Five o Clock')],
      totalCount: 3,
    });

    await act(async () => {
      fireEvent.press(getByText('— More results · showing 2 of 3'));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSearchPage).toHaveBeenNthCalledWith(2, 'lutens', { limit: 25, offset: 2 });
    // All three unique rows present; duplicate not doubled.
    expect(getByText('Chergui')).toBeTruthy();
    expect(getAllByText('Ambre Sultan')).toHaveLength(1);
    expect(getByText('Five o Clock')).toBeTruthy();
    // All matches shown -> load-more row is gone.
    expect(queryByText(/More results/)).toBeNull();
  });

  it('resets to page 0 and replaces results on a new query', async () => {
    mockSearchPage.mockResolvedValueOnce({
      items: [makeEntry('a', 'Chergui')],
      totalCount: 5,
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<Add />);
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER);
    await typeQuery(input, 'lutens');
    expect(getByText('Chergui')).toBeTruthy();

    mockSearchPage.mockResolvedValueOnce({
      items: [makeEntry('z', 'Sauvage')],
      totalCount: 1,
    });
    await typeQuery(input, 'dior');

    expect(mockSearchPage).toHaveBeenLastCalledWith('dior', { limit: 25, offset: 0 });
    expect(getByText('Sauvage')).toBeTruthy();
    expect(queryByText('Chergui')).toBeNull();
    // total 1 == results 1 -> no load-more row.
    expect(queryByText(/More results/)).toBeNull();
  });
});
