import { fireEvent, render, waitFor } from '@testing-library/react-native';
import CalendarScreen from '../app/(tabs)/calendar';

const mockMutateAsync = jest.fn();
const mockUpdateMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();

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
  useUpdateWear: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useDeleteWear: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useWearsQuery: () => ({
    data: [
      {
        id: 'wear-1',
        user_id: 'user-1',
        fragrance_id: 'fragrance-1',
        worn_on: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-16`,
        notes: 'Office day',
        created_at: '2026-04-16T12:00:00Z',
        updated_at: '2026-04-16T12:00:00Z',
      },
    ],
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
    mockUpdateMutateAsync.mockReset();
    mockUpdateMutateAsync.mockResolvedValue({});
    mockDeleteMutateAsync.mockReset();
    mockDeleteMutateAsync.mockResolvedValue({});
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

  it('updates an existing wear from the selected day sheet', async () => {
    const now = new Date();
    const selectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-16`;
    const { getByDisplayValue, getByLabelText, getByText } = render(<CalendarScreen />);

    fireEvent.press(getByText('16'));
    fireEvent.press(getByLabelText('Edit wear for Shalimar'));
    fireEvent.changeText(getByDisplayValue('Office day'), 'Dinner wear');
    fireEvent.press(getByText('Save changes'));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'wear-1',
        input: {
          fragrance_id: 'fragrance-1',
          worn_on: selectedDate,
          notes: 'Dinner wear',
        },
      });
    });
  });

  it('deletes an existing wear from the selected day sheet', async () => {
    const { getByLabelText, getByText } = render(<CalendarScreen />);

    fireEvent.press(getByText('16'));
    fireEvent.press(getByLabelText('Delete wear for Shalimar'));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith('wear-1');
    });
  });
});
