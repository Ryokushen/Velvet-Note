import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Detail from '../app/fragrance/[id]';
import type { Wear } from '../types/wear';

const mockCreateMutateAsync = jest.fn();
const mockSetActiveMutateAsync = jest.fn();
const mockNotifySuccess = jest.fn();
const mockNotifyWarning = jest.fn();
const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

let mockFragranceWears: Wear[] = [];

const fragranceFixture = {
  id: 'fragrance-1',
  user_id: 'user-1',
  brand: 'Serge Lutens',
  name: 'Chergui',
  concentration: 'EDP',
  accords: ['Sweet'],
  rating: 9,
  catalog_id: null,
  image_url: null,
  personal_image_url: null,
  catalog_description: null,
  catalog_source: null,
  catalog_release_year: null,
  catalog_notes_top: null,
  catalog_notes_middle: null,
  catalog_notes_base: null,
  catalog_perfumers: null,
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'fragrance-1' }),
  useRouter: () => ({ back: jest.fn(), canGoBack: () => false, replace: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/BottleArt', () => ({ BottleArt: () => null }));

jest.mock('../components/ui/Icon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = () => React.createElement(Text);
  return { IconChevronLeft: MockIcon, IconTrash: MockIcon };
});

jest.mock('../lib/haptics', () => ({
  notifySuccess: () => mockNotifySuccess(),
  notifyWarning: () => mockNotifyWarning(),
  tapLight: jest.fn(),
}));

jest.mock('../hooks/useWears', () => ({
  useCreateWear: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
  useSetActiveWear: () => ({ mutateAsync: mockSetActiveMutateAsync, isPending: false }),
  useFragranceWearsQuery: () => ({ data: mockFragranceWears, isLoading: false, error: null }),
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({ data: [fragranceFixture] }),
  useUpdateFragrance: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeleteFragrance: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function wear(input: Partial<Wear>): Wear {
  return {
    id: 'wear-1',
    user_id: 'user-1',
    fragrance_id: 'fragrance-1',
    worn_on: todayKey(),
    notes: null,
    season: null,
    time_of_day: null,
    occasion: null,
    compliment_count: 0,
    compliment_note: null,
    is_active: false,
    created_at: `${todayKey()}T12:00:00Z`,
    updated_at: `${todayKey()}T12:00:00Z`,
    ...input,
  };
}

describe('Detail duplicate-wear guard', () => {
  beforeEach(() => {
    mockCreateMutateAsync.mockReset();
    mockCreateMutateAsync.mockResolvedValue({ id: 'created-wear' });
    mockSetActiveMutateAsync.mockReset();
    mockSetActiveMutateAsync.mockResolvedValue({});
    mockNotifySuccess.mockReset();
    mockNotifyWarning.mockReset();
    mockAlert.mockClear();
    mockFragranceWears = [];
  });

  it('logs today with an inline confirmation and no Alert when nothing is logged yet', async () => {
    const { getByText, queryByText } = render(<Detail />);

    expect(getByText('Log today')).toBeTruthy();
    expect(queryByText('— Already logged today')).toBeNull();

    fireEvent.press(getByText('Log today'));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockNotifySuccess).toHaveBeenCalledTimes(1);
      expect(getByText('— Logged for today')).toBeTruthy();
    });
    // Success is surfaced inline, never through a blocking Alert.
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it('guards against double-logging when a wear already exists for today', () => {
    mockFragranceWears = [wear({ id: 'existing-today' })];
    const { getByText, queryByText } = render(<Detail />);

    // The primary "Log today" affordance is replaced by an already-logged notice.
    expect(queryByText('Log today')).toBeNull();
    expect(getByText('— Already logged today')).toBeTruthy();
    expect(getByText('Log again')).toBeTruthy();
  });

  it('requires the explicit "Log again" affordance to record a second same-day wear', async () => {
    mockFragranceWears = [wear({ id: 'existing-today' })];
    const { getByText } = render(<Detail />);

    fireEvent.press(getByText('Log again'));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockNotifySuccess).toHaveBeenCalledTimes(1);
    });
    expect(mockAlert).not.toHaveBeenCalled();
  });
});
