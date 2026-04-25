import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Add from '../app/(tabs)/add';
import { pickPersonalFragrancePhoto, uploadPersonalFragrancePhoto } from '../lib/fragrancePhotos';

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
  searchSupabaseCatalog: jest.fn().mockResolvedValue([]),
}));

jest.mock('../lib/fragrancePhotos', () => ({
  pickPersonalFragrancePhoto: jest.fn(),
  uploadPersonalFragrancePhoto: jest.fn(),
}));

describe('Add personal photo attachment', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
    mockReplace.mockReset();
    jest.mocked(pickPersonalFragrancePhoto).mockReset();
    jest.mocked(uploadPersonalFragrancePhoto).mockReset();
    jest.mocked(pickPersonalFragrancePhoto).mockResolvedValue({
      uri: 'file:///tmp/bottle.jpg',
      mimeType: 'image/jpeg',
    });
    jest.mocked(uploadPersonalFragrancePhoto).mockResolvedValue(
      'https://example.supabase.co/storage/v1/object/public/user-fragrance-photos/user-1/new-fragrance-1.jpg',
    );
  });

  it('saves an uploaded personal photo URL for a new fragrance', async () => {
    const { getByLabelText, getByText } = render(<Add />);

    fireEvent.changeText(getByLabelText('Brand'), 'Chanel');
    fireEvent.changeText(getByLabelText('Name'), 'Bleu');
    fireEvent.press(getByText('Attach photo'));

    await waitFor(() => {
      expect(uploadPersonalFragrancePhoto).toHaveBeenCalledWith(
        {
          uri: 'file:///tmp/bottle.jpg',
          mimeType: 'image/jpeg',
        },
        'new-fragrance',
      );
    });

    fireEvent.press(getByText('Save to shelf'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          image_url: 'https://example.supabase.co/storage/v1/object/public/user-fragrance-photos/user-1/new-fragrance-1.jpg',
        }),
      );
    });
  });
});
