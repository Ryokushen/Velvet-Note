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

jest.mock('../components/BottleArt', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottleArt: (props: { width?: number; height?: number }) =>
      React.createElement(View, {
        testID: `bottle-art-${props.width}x${props.height}`,
      }),
  };
});

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
  image_url: 'https://example.com/hawas.png',
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

describe('Detail hero image layout', () => {
  it('centers the bottle art as its own detail hero instead of a side thumbnail', () => {
    const { getByTestId } = render(<Detail />);

    expect(getByTestId('detail-hero-image')).toHaveStyle({
      alignItems: 'center',
      justifyContent: 'center',
    });
    expect(getByTestId('bottle-art-176x228')).toBeTruthy();
  });
});
