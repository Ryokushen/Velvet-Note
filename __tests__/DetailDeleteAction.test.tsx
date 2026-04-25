import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Detail from '../app/fragrance/[id]';

const mockDeleteMutateAsync = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockReplace = jest.fn();

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
    back: mockBack,
    canGoBack: mockCanGoBack,
    replace: mockReplace,
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
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useDeleteFragrance: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

describe('Detail delete action', () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockCanGoBack.mockReset();
    mockCanGoBack.mockReturnValue(false);
    mockDeleteMutateAsync.mockReset();
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    mockReplace.mockReset();
  });

  it('falls back to the collection when there is no back history', () => {
    const { getByLabelText } = render(<Detail />);

    fireEvent.press(getByLabelText('Back to collection'));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('confirms and removes a fragrance from the header delete action', async () => {
    const { getByLabelText, getByText } = render(<Detail />);

    fireEvent.press(getByLabelText('Remove Chergui from shelf'));

    expect(getByText('Remove from shelf?')).toBeTruthy();
    expect(getByText('Remove Serge Lutens Chergui?')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();

    fireEvent.press(getByText('Remove'));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith('fragrance-1');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
