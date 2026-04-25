import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Add from '../app/(tabs)/add';
import { findSupabaseCatalogByBarcode, type CatalogFragrance } from '../lib/catalog';

const mockMutateAsync = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    push: mockPush,
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
  findSupabaseCatalogByBarcode: jest.fn(),
  notesToAccords: (notes: string[]) => notes.map((note) => note.trim().toLowerCase()).filter(Boolean),
  searchSupabaseCatalog: jest.fn().mockResolvedValue([]),
}));

const barcodeMatch: CatalogFragrance = {
  id: 'catalog-sauvage',
  brand: 'Dior',
  name: 'Sauvage',
  concentration: 'EDT',
  description: '',
  notes: ['Fresh Spicy', 'Bergamot'],
  notesTop: ['Bergamot'],
  notesMiddle: ['Pepper'],
  notesBase: ['Ambroxan'],
  releaseYear: 2015,
  perfumers: ['François Demachy'],
  ratingValue: 7.7,
  ratingCount: 3050,
  imageUrl: 'https://images.example/sauvage.jpg',
  source: 'barcode_api',
};

describe('Add barcode scan entry', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseLocalSearchParams.mockReset();
    mockUseLocalSearchParams.mockReturnValue({});
    jest.mocked(findSupabaseCatalogByBarcode).mockReset();
  });

  it('routes to the dedicated scan screen from Add', () => {
    const { getByText } = render(<Add />);

    fireEvent.press(getByText('Scan barcode'));

    expect(mockPush).toHaveBeenCalledWith('/scan');
  });

  it('prefills the Add form from a scanned barcode match', async () => {
    mockUseLocalSearchParams.mockReturnValue({ barcode: '3348901321129' });
    jest.mocked(findSupabaseCatalogByBarcode).mockResolvedValue(barcodeMatch);
    const { getByDisplayValue, getByText } = render(<Add />);

    await waitFor(() => {
      expect(findSupabaseCatalogByBarcode).toHaveBeenCalledWith('3348901321129');
      expect(getByDisplayValue('Dior')).toBeTruthy();
      expect(getByDisplayValue('Sauvage')).toBeTruthy();
      expect(getByText('2015 · François Demachy')).toBeTruthy();
    });

    fireEvent.press(getByText('Save to shelf'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Dior',
          name: 'Sauvage',
          catalog_id: 'catalog-sauvage',
          catalog_source: 'barcode_api',
        }),
      );
    });
  });
});
