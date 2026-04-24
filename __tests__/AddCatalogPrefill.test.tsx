import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Add from '../app/(tabs)/add';

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

jest.mock('../hooks/useFragrances', () => ({
  useCreateFragrance: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('Add catalog prefill', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
    mockReplace.mockReset();
  });

  it('prefills the add form from a catalog result before saving', async () => {
    const { getByPlaceholderText, getByText } = render(<Add />);

    fireEvent.changeText(getByPlaceholderText('Search catalog by bottle, brand, or note'), 'tihota');
    fireEvent.press(getByText('Tihota Eau de Parfum'));
    fireEvent.press(getByText('Save to shelf'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        brand: 'Indult',
        name: 'Tihota Eau de Parfum',
        concentration: null,
        accords: ['vanilla bean', 'musks'],
        rating: null,
      });
    });
  });
});
