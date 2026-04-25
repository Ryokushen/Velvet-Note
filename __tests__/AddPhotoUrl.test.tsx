import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Add from '../app/(tabs)/add';

const mockMutateAsync = jest.fn();
const mockReplace = jest.fn();

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
}));

jest.mock('../lib/catalog', () => ({
  findSupabaseCatalogByBarcode: jest.fn(),
  notesToAccords: (notes: string[]) => notes.map((note) => note.trim().toLowerCase()).filter(Boolean),
  searchSupabaseCatalog: jest.fn().mockResolvedValue([]),
}));

describe('Add photo URL', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
    mockReplace.mockReset();
  });

  it('saves a trimmed photo URL for a manually added fragrance', async () => {
    const { getByLabelText, getByText } = render(<Add />);

    fireEvent.changeText(getByLabelText('Brand'), 'Chanel');
    fireEvent.changeText(getByLabelText('Name'), 'Bleu');
    fireEvent.changeText(getByLabelText('Photo URL'), '  https://images.example/bleu.jpg  ');
    fireEvent.press(getByText('Save to shelf'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Chanel',
          name: 'Bleu',
          image_url: 'https://images.example/bleu.jpg',
        }),
      );
    });
  });
});
