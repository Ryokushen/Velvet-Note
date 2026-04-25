import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Detail from '../app/fragrance/[id]';
import { pickPersonalFragrancePhoto, uploadPersonalFragrancePhoto } from '../lib/fragrancePhotos';

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
    data: [fragranceFixture],
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

jest.mock('../lib/fragrancePhotos', () => ({
  pickPersonalFragrancePhoto: jest.fn(),
  uploadPersonalFragrancePhoto: jest.fn(),
}));

describe('Detail personal photo attachment', () => {
  beforeEach(() => {
    mockUpdateMutateAsync.mockReset();
    mockUpdateMutateAsync.mockResolvedValue(undefined);
    jest.mocked(pickPersonalFragrancePhoto).mockReset();
    jest.mocked(uploadPersonalFragrancePhoto).mockReset();
    jest.mocked(pickPersonalFragrancePhoto).mockResolvedValue({
      uri: 'file:///tmp/chergui.jpg',
      mimeType: 'image/jpeg',
    });
    jest.mocked(uploadPersonalFragrancePhoto).mockResolvedValue(
      'https://example.supabase.co/storage/v1/object/public/user-fragrance-photos/user-1/fragrance-1.jpg',
    );
  });

  it('saves an uploaded personal photo URL from the edit screen', async () => {
    const { getByText } = render(<Detail />);

    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByText('Attach photo'));

    await waitFor(() => {
      expect(uploadPersonalFragrancePhoto).toHaveBeenCalledWith(
        {
          uri: 'file:///tmp/chergui.jpg',
          mimeType: 'image/jpeg',
        },
        'fragrance-1',
      );
    });

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'fragrance-1',
        input: expect.objectContaining({
          image_url: 'https://example.supabase.co/storage/v1/object/public/user-fragrance-photos/user-1/fragrance-1.jpg',
        }),
      });
    });
  });
});
