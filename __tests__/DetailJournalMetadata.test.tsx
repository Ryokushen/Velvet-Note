import { render } from '@testing-library/react-native';
import Detail from '../app/fragrance/[id]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'fragrance-1' }),
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
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
    IconTrash: () => React.createElement(Text),
  };
});

const fragranceFixture = {
  id: 'fragrance-1',
  user_id: 'user-1',
  brand: 'Rasasi',
  name: 'Hawas for Him',
  concentration: 'EDP',
  accords: ['fresh', 'aquatic'],
  rating: 8,
  catalog_id: null,
  image_url: null,
  personal_image_url: null,
  catalog_description: null,
  catalog_source: null,
  catalog_release_year: null,
  catalog_notes_top: null,
  catalog_notes_middle: null,
  catalog_notes_base: null,
  catalog_perfumers: null,
  bottle_status: 'partial',
  bottle_size_ml: 100,
  purchase_date: '2026-04-03',
  purchase_source: 'Luckyscent',
  purchase_price: 125,
  purchase_currency: 'USD',
  preferred_seasons: ['summer'],
  preferred_time_of_day: 'night',
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
};

jest.mock('../hooks/useWears', () => ({
  useCreateWear: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useFragranceWearsQuery: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: [fragranceFixture],
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

describe('Detail journal metadata', () => {
  it('renders bottle metadata and ideal wear profile when present', () => {
    const { getAllByText, getByText } = render(<Detail />);

    expect(getByText('Bottle')).toBeTruthy();
    expect(getByText('Partial')).toBeTruthy();
    expect(getByText('100 ml')).toBeTruthy();
    expect(getByText('Luckyscent')).toBeTruthy();
    expect(getByText('$125')).toBeTruthy();
    expect(getByText('Wear profile')).toBeTruthy();
    expect(getAllByText('Summer').length).toBeGreaterThan(0);
    expect(getAllByText('Night').length).toBeGreaterThan(0);
  });
});
