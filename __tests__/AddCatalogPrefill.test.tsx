import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Add from '../app/(tabs)/add';
import { searchSupabaseCatalog } from '../lib/catalog';

const mockMutateAsync = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/BottleArt', () => ({
  BottleArt: () => null,
}));

jest.mock('../hooks/useFragrances', () => ({
  useCreateFragrance: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

jest.mock('../lib/catalog', () => ({
  notesToAccords: (notes: string[]) => notes.map((note) => note.trim().toLowerCase()).filter(Boolean),
  searchSupabaseCatalog: jest.fn(),
}));

describe('Add catalog prefill', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
    mockReplace.mockReset();
    (searchSupabaseCatalog as jest.Mock).mockReset();
    (searchSupabaseCatalog as jest.Mock).mockResolvedValue([
      {
        id: 'catalog-1',
        brand: 'Serge Lutens',
        name: 'Chergui',
        concentration: 'EDP',
        description: '',
        notes: ['Sweet', 'Spicy', 'Tobacco Leaf'],
        imageUrl: null,
        source: 'parfumo_tidytuesday_2024_12_10',
      },
    ]);
  });

  it('prefills the add form from a Supabase catalog result before saving', async () => {
    const { getByPlaceholderText, getByText } = render(<Add />);

    fireEvent.changeText(getByPlaceholderText('Search catalog by bottle, brand, or note'), 'chergui');

    await waitFor(() => {
      expect(searchSupabaseCatalog).toHaveBeenCalledWith('chergui', 5);
      expect(getByText('Chergui')).toBeTruthy();
    });

    fireEvent.press(getByText('Chergui'));
    fireEvent.press(getByText('Save to shelf'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Serge Lutens',
          name: 'Chergui',
          concentration: 'EDP',
          accords: ['sweet', 'spicy', 'tobacco leaf'],
          rating: null,
          catalog_id: 'catalog-1',
          image_url: null,
          catalog_source: 'parfumo_tidytuesday_2024_12_10',
        }),
      );
    });
  });
});
