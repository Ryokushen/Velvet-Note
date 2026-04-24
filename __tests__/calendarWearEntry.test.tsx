import { fireEvent, render, waitFor } from '@testing-library/react-native';
import CalendarScreen from '../app/(tabs)/calendar';

const mockMutateAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../hooks/useWears', () => ({
  useCreateWear: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useWearsQuery: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: [
      {
        id: 'fragrance-1',
        user_id: 'user-1',
        brand: 'Guerlain',
        name: 'Shalimar',
        concentration: 'EDP',
        accords: ['amber'],
        rating: 9,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('Calendar wear entry', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
  });

  it('logs the selected calendar date for the chosen fragrance', async () => {
    const now = new Date();
    const selectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
    const { getByLabelText, getByText } = render(<CalendarScreen />);

    fireEvent.press(getByText('15'));
    fireEvent.press(getByLabelText('Log wear for selected day'));
    fireEvent.press(getByText('Shalimar'));
    fireEvent.press(getByText('Save wear'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        fragrance_id: 'fragrance-1',
        worn_on: selectedDate,
        notes: null,
      });
    });
  });
});
