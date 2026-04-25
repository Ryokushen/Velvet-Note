import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Detail from '../app/fragrance/[id]';

const mockUpdateMutateAsync = jest.fn();

const fragranceFixture = {
  id: 'fragrance-1',
  user_id: 'user-1',
  brand: 'Serge Lutens',
  name: 'Chergui',
  concentration: 'EDP',
  accords: ['Sweet', 'Spicy'],
  rating: 9,
  catalog_id: 'catalog-1',
  image_url: 'https://images.example/old-bottle.jpg',
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

const mockCatalogFallbackFixture = {
  ...fragranceFixture,
  id: 'fragrance-2',
  image_url: 'https://images.example/catalog-fallback.jpg',
  personal_image_url: null,
  catalog_image_url: 'https://images.example/catalog-fallback.jpg',
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'fragrance-1' })),
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
  const MockIcon = () => React.createElement(Text);
  return {
    IconChevronLeft: MockIcon,
    IconTrash: MockIcon,
    IconX: MockIcon,
  };
});

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
    data: [fragranceFixture, mockCatalogFallbackFixture],
  }),
  useUpdateFragrance: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useDeleteFragrance: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

describe('Detail photo URL editing', () => {
  beforeEach(() => {
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockReturnValue({ id: 'fragrance-1' });
    mockUpdateMutateAsync.mockReset();
    mockUpdateMutateAsync.mockResolvedValue(undefined);
  });

  it('saves a trimmed photo URL from the edit screen', async () => {
    const { getByLabelText, getByText } = render(<Detail />);

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByLabelText('Photo URL'), '  https://images.example/new-bottle.jpg  ');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'fragrance-1',
        input: expect.objectContaining({
          image_url: 'https://images.example/new-bottle.jpg',
        }),
      });
    });
  });

  it('removes the photo URL when the field is cleared', async () => {
    const { getByLabelText, getByText } = render(<Detail />);

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByLabelText('Photo URL'), '');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'fragrance-1',
        input: expect.objectContaining({
          image_url: null,
        }),
      });
    });
  });

  it('does not copy a catalog fallback image into the personal photo field on save', async () => {
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockReturnValue({ id: 'fragrance-2' });
    const { getByText } = render(<Detail />);

    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'fragrance-2',
        input: expect.objectContaining({
          image_url: null,
        }),
      });
    });
  });
});
