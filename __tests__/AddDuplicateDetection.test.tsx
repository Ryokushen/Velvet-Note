import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Add from '../app/(tabs)/add';
import type { Fragrance } from '../types/fragrance';

const mockMutateAsync = jest.fn();
const mockReplace = jest.fn();
let mockShelfData: Fragrance[] = [];

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
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
  useFragrancesQuery: () => ({ data: mockShelfData }),
}));

jest.mock('../lib/catalog', () => ({
  findSupabaseCatalogByBarcode: jest.fn(),
  notesToAccords: (notes: string[]) => notes.map((note) => note.trim().toLowerCase()).filter(Boolean),
  searchSupabaseCatalog: jest.fn().mockResolvedValue([]),
}));

const existing = {
  id: 'existing-1',
  user_id: 'user-1',
  brand: 'Chanel',
  name: 'Bleu',
  concentration: 'EDP',
  accords: [],
  rating: null,
  catalog_id: null,
  image_url: null,
  catalog_description: null,
  catalog_source: null,
  catalog_release_year: null,
  catalog_notes_top: null,
  catalog_notes_middle: null,
  catalog_notes_base: null,
  catalog_perfumers: null,
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
} as unknown as Fragrance;

describe('Add duplicate detection', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({ id: 'new-1' });
    mockReplace.mockReset();
    mockShelfData = [];
    jest.restoreAllMocks();
  });

  it('warns before adding a case-insensitive brand+name duplicate and can proceed', async () => {
    mockShelfData = [existing];
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    const { getByLabelText, getByText } = render(<Add />);

    fireEvent.changeText(getByLabelText('Brand'), 'chanel');
    fireEvent.changeText(getByLabelText('Name'), 'BLEU');
    fireEvent.press(getByText('Save to shelf'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).not.toHaveBeenCalled();

    // Invoke the "Add anyway" action button supplied to the Alert.
    const buttons = alertSpy.mock.calls[0][2] as { text?: string; onPress?: () => void }[];
    const addAnyway = buttons.find((button) => button.text === 'Add anyway');
    addAnyway?.onPress?.();

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ brand: 'chanel', name: 'BLEU' }),
      );
    });
  });

  it('does not prompt when the shelf has no matching entry', async () => {
    mockShelfData = [];
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    const { getByLabelText, getByText } = render(<Add />);

    fireEvent.changeText(getByLabelText('Brand'), 'Dior');
    fireEvent.changeText(getByLabelText('Name'), 'Sauvage');
    fireEvent.press(getByText('Save to shelf'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ brand: 'Dior', name: 'Sauvage' }),
      );
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
