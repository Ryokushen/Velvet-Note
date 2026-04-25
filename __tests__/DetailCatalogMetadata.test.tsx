import { render } from '@testing-library/react-native';
import Detail from '../app/fragrance/[id]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'fragrance-1' }),
  useRouter: () => ({
    back: jest.fn(),
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
  brand: 'Serge Lutens',
  name: 'Chergui',
  concentration: 'EDP',
  accords: ['Sweet', 'Spicy'],
  rating: 9,
  catalog_id: 'catalog-1',
  image_url: null,
  catalog_description: '',
  catalog_source: 'parfumo_tidytuesday_2024_12_10',
  catalog_release_year: 2001,
  catalog_notes_top: ['Tobacco Leaf'],
  catalog_notes_middle: ['Honey'],
        catalog_notes_base: ['Amber'],
        catalog_perfumers: ['Christopher Sheldrake'],
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
};

jest.mock('../hooks/useWears', () => ({
  useCreateWear: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useSetActiveWear: () => ({
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

describe('Detail catalog metadata', () => {
  it('surfaces saved catalog year, perfumer, rating, and note pyramid', () => {
    const { getAllByText, getByText } = render(<Detail />);

    expect(getByText('Catalog profile')).toBeTruthy();
    expect(getByText('2001')).toBeTruthy();
    expect(getByText('Christopher Sheldrake')).toBeTruthy();
    expect(() => getByText('Parfumo 7.8')).toThrow();
    expect(() => getByText('1,242 ratings')).toThrow();
    expect(getAllByText('Top').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Tobacco Leaf')).toBeTruthy();
    expect(getAllByText('Heart').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Honey')).toBeTruthy();
    expect(getAllByText('Base').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Amber')).toBeTruthy();
  });
});
