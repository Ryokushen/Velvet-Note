import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CalendarScreen from '../app/(tabs)/calendar';

const mockMutateAsync = jest.fn();
const mockUpdateMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();
const mockSetActiveWearMutateAsync = jest.fn();

const currentTestDate = new Date();
const currentTestWearLabel = new Date(
  currentTestDate.getFullYear(),
  currentTestDate.getMonth(),
  16,
).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/ui/Icon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = () => React.createElement(Text);
  return {
    IconChevronLeft: MockIcon,
    IconChevronRight: MockIcon,
    IconEdit: MockIcon,
    IconPlus: MockIcon,
    IconTrash: MockIcon,
  };
});

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
  useSetActiveWear: () => ({
    mutateAsync: mockSetActiveWearMutateAsync,
    isPending: false,
  }),
  useWearsQuery: () => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentWearDate = `${monthPrefix}-16`;
    const laterWearDate = `${monthPrefix}-17`;

    return {
      data: [
        {
          id: 'wear-1',
          user_id: 'user-1',
          fragrance_id: 'fragrance-1',
          worn_on: currentWearDate,
          notes: 'Office day',
          created_at: '2026-04-16T12:00:00Z',
          updated_at: '2026-04-16T12:00:00Z',
        },
        {
          id: 'wear-2',
          user_id: 'user-1',
          fragrance_id: 'fragrance-2',
          worn_on: currentWearDate,
          notes: 'Rainy commute',
          created_at: '2026-04-16T10:00:00Z',
          updated_at: '2026-04-16T10:00:00Z',
        },
        {
          id: 'wear-3',
          user_id: 'user-1',
          fragrance_id: 'fragrance-3',
          worn_on: laterWearDate,
          notes: 'Warm evening',
          created_at: '2026-04-17T18:00:00Z',
          updated_at: '2026-04-17T18:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    };
  },
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
      {
        id: 'fragrance-2',
        user_id: 'user-1',
        brand: 'Diptyque',
        name: 'Tam Dao',
        concentration: 'EDT',
        accords: ['woody'],
        rating: 8,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      },
      {
        id: 'fragrance-3',
        user_id: 'user-1',
        brand: 'Creed',
        name: 'Aventus',
        concentration: 'EDP',
        accords: ['fruity'],
        rating: 9,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      },
      {
        id: 'fragrance-4',
        user_id: 'user-1',
        brand: 'Amouage',
        name: 'Reflection',
        concentration: 'EDP',
        accords: ['floral'],
        rating: 7,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('Calendar wear entry', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
    mockUpdateMutateAsync.mockReset();
    mockUpdateMutateAsync.mockResolvedValue({});
    mockDeleteMutateAsync.mockReset();
    mockDeleteMutateAsync.mockResolvedValue({});
    mockSetActiveWearMutateAsync.mockReset();
    mockSetActiveWearMutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('shows a count badge when a day has multiple wears', () => {
    const { getByLabelText } = render(<CalendarScreen />);

    expect(getByLabelText(`2 wears on ${currentTestWearLabel}`)).toBeTruthy();
  });

  it('logs the selected calendar date for the chosen fragrance', async () => {
    const now = new Date();
    const selectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
    const { getByLabelText, getByPlaceholderText, getByText } = render(<CalendarScreen />);

    fireEvent.press(getByText('15'));
    fireEvent.press(getByLabelText('Log wear for selected day'));
    fireEvent.press(getByText('Shalimar'));
    fireEvent.press(getByText('Night'));
    fireEvent.changeText(getByPlaceholderText('Occasion'), 'Office');
    fireEvent.changeText(getByPlaceholderText('Compliment note'), 'Asked what it was');
    fireEvent.press(getByText('+'));
    fireEvent.press(getByText('Save wear'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        fragrance_id: 'fragrance-1',
        worn_on: selectedDate,
        notes: null,
        season: expect.any(String),
        time_of_day: 'night',
        occasion: 'Office',
        compliment_count: 1,
        compliment_note: 'Asked what it was',
      });
    });
  });

  it("marks today's newly logged wear active", async () => {
    const now = new Date();
    const selectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    mockMutateAsync.mockResolvedValueOnce({ id: 'wear-today' });
    const { getByLabelText, getByPlaceholderText, getByText } = render(<CalendarScreen />);

    fireEvent.press(getByLabelText('Log wear for selected day'));
    fireEvent.press(getByText('Shalimar'));
    fireEvent.press(getByText('Night'));
    fireEvent.changeText(getByPlaceholderText('Occasion'), 'Office');
    fireEvent.changeText(getByPlaceholderText('Compliment note'), 'Asked what it was');
    fireEvent.press(getByText('+'));
    fireEvent.press(getByText('Save wear'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        fragrance_id: 'fragrance-1',
        worn_on: selectedDate,
        notes: null,
        season: expect.any(String),
        time_of_day: 'night',
        occasion: 'Office',
        compliment_count: 1,
        compliment_note: 'Asked what it was',
      });
      expect(mockSetActiveWearMutateAsync).toHaveBeenCalledWith('wear-today');
    });
  });

  it('clears the create flow when today activation fails after saving wear', async () => {
    mockMutateAsync.mockResolvedValueOnce({ id: 'wear-today' });
    mockSetActiveWearMutateAsync.mockRejectedValueOnce(new Error('rpc failed'));
    const { getByLabelText, queryByText, getByText } = render(<CalendarScreen />);

    fireEvent.press(getByLabelText('Log wear for selected day'));
    fireEvent.press(getByText('Shalimar'));
    fireEvent.press(getByText('Save wear'));

    await waitFor(() => {
      expect(mockSetActiveWearMutateAsync).toHaveBeenCalledWith('wear-today');
      expect(queryByText('Choose bottle')).toBeNull();
      expect(alertSpy).toHaveBeenCalledWith(
        'Wear logged',
        'The wear was saved, but could not be made current.',
      );
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
          season: null,
          time_of_day: null,
          occasion: null,
          compliment_count: 0,
          compliment_note: null,
        },
      });
    });
  });

  it('shows an in-app confirmation before deleting an existing wear from the selected day sheet', async () => {
    const { getByLabelText, getByText } = render(<CalendarScreen />);

    fireEvent.press(getByText('16'));
    fireEvent.press(getByLabelText('Delete wear for Shalimar'));

    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    expect(getByText('Delete wear?')).toBeTruthy();
    expect(getByText(`Remove Shalimar from ${currentTestWearLabel}?`)).toBeTruthy();

    fireEvent.press(getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith('wear-1');
    });
  });

  it('narrows the bottle picker as you search your shelf', () => {
    const { getByLabelText, getByText, queryByText } = render(<CalendarScreen />);

    fireEvent.press(getByText('15'));
    fireEvent.press(getByLabelText('Log wear for selected day'));

    // Full shelf is visible before filtering.
    expect(getByText('Shalimar')).toBeTruthy();
    expect(getByText('Tam Dao')).toBeTruthy();

    fireEvent.changeText(getByLabelText('Search your shelf'), 'tam');

    expect(getByText('Tam Dao')).toBeTruthy();
    expect(queryByText('Shalimar')).toBeNull();
    expect(queryByText('Aventus')).toBeNull();
    expect(queryByText('Reflection')).toBeNull();
  });

  it('shows a quiet caption when the search matches nothing', () => {
    const { getByLabelText, getByText, queryAllByTestId } = render(<CalendarScreen />);

    fireEvent.press(getByText('15'));
    fireEvent.press(getByLabelText('Log wear for selected day'));
    fireEvent.changeText(getByLabelText('Search your shelf'), 'zzz nothing');

    expect(getByText('— Nothing on your shelf matches')).toBeTruthy();
    expect(queryAllByTestId('bottle-option')).toHaveLength(0);
  });

  it('orders the picker by most-recently-worn, with unworn bottles last', () => {
    const { getByLabelText, getByText, getAllByTestId } = render(<CalendarScreen />);

    fireEvent.press(getByText('15'));
    fireEvent.press(getByLabelText('Log wear for selected day'));

    const names = getAllByTestId('bottle-option').map((node) => node.props.children);
    // Aventus was worn on the 17th, outranking the 16th's wears; Reflection is unworn.
    expect(names[0]).toBe('Aventus');
    expect(names[names.length - 1]).toBe('Reflection');
    expect(names.indexOf('Aventus')).toBeLessThan(names.indexOf('Shalimar'));
    expect(names.indexOf('Aventus')).toBeLessThan(names.indexOf('Reflection'));
  });

  it('resets the search query when the picker is reopened', () => {
    const { getByLabelText, getByText, queryByText } = render(<CalendarScreen />);

    fireEvent.press(getByText('15'));
    fireEvent.press(getByLabelText('Log wear for selected day'));
    fireEvent.changeText(getByLabelText('Search your shelf'), 'tam');
    expect(queryByText('Shalimar')).toBeNull();

    // Close the picker, then reopen it — the query should be cleared.
    fireEvent.press(getByText('Cancel'));
    fireEvent.press(getByLabelText('Log wear for selected day'));

    expect(getByLabelText('Search your shelf').props.value).toBe('');
    expect(getByText('Shalimar')).toBeTruthy();
  });
});
