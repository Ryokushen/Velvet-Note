import { render, waitFor } from '@testing-library/react-native';
import Collection from '../app/(tabs)/index';
import Detail from '../app/fragrance/[id]';

const fragranceFixture = {
  id: 'fragrance-1',
  user_id: 'user-1',
  brand: 'Serge Lutens',
  name: 'Chergui',
  concentration: 'EDP',
  accords: ['Amber'],
  rating: 9,
  image_url: null,
  personal_image_url: null,
  catalog_id: null,
  catalog_description: null,
  catalog_source: null,
  catalog_release_year: null,
  catalog_notes_top: null,
  catalog_notes_middle: null,
  catalog_notes_base: null,
  catalog_perfumers: null,
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
};

const wearFixture = {
  id: 'wear-1',
  user_id: 'user-1',
  fragrance_id: 'fragrance-1',
  worn_on: '2026-04-24',
  notes: null,
  created_at: '2026-04-24T12:00:00Z',
  updated_at: '2026-04-24T12:00:00Z',
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'fragrance-1' }),
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/BottleArt', () => ({
  BottleArt: () => null,
}));

jest.mock('../components/ui/Icon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    IconChevronLeft: () => React.createElement(Text),
    IconLogOut: () => React.createElement(Text),
    IconSearch: () => React.createElement(Text),
    IconTrash: () => React.createElement(Text),
    IconX: () => React.createElement(Text),
  };
});

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: [fragranceFixture],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
  }),
  useUpdateFragrance: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useDeleteFragrance: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('../hooks/useWears', () => ({
  useCreateWear: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useFragranceWearsQuery: () => ({
    data: [wearFixture],
    isLoading: false,
    error: null,
  }),
  useWearsQuery: () => ({
    data: [wearFixture],
    isLoading: false,
    error: null,
  }),
}));

describe('last worn summary', () => {
  it('surfaces last worn information on collection rows', async () => {
    const { getByText } = render(<Collection />);

    await waitFor(() => {
      expect(getByText('Last worn Apr 24')).toBeTruthy();
    });
  });

  it('surfaces last worn information near the top of detail', () => {
    const { getAllByText, getByText } = render(<Detail />);

    expect(getByText('Last worn')).toBeTruthy();
    expect(getAllByText('Apr 24, 2026').length).toBeGreaterThanOrEqual(1);
  });
});
