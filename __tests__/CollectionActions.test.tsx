import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Collection from '../app/(tabs)/index';
import type { Fragrance } from '../types/fragrance';

const mockPush = jest.fn();
const mockSignOut = jest.fn();
const mockUseFragrancesQuery = jest.fn();
const mockUseWearsQuery = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/BottleArt', () => ({
  BottleArt: () => null,
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => mockUseFragrancesQuery(),
}));

jest.mock('../hooks/useWears', () => ({
  useWearsQuery: () => mockUseWearsQuery(),
  useCreateWear: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useSetActiveWear: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('../lib/admin', () => ({
  isAppAdmin: jest.fn().mockResolvedValue(false),
}));

jest.mock('../lib/supabase', () => ({
  supabase: { auth: { signOut: () => mockSignOut() } },
}));

const shelfFragrance: Fragrance = {
  id: 'fragrance-1',
  user_id: 'user-1',
  brand: 'Dior',
  name: 'Sauvage',
  concentration: 'EDT',
  accords: ['fresh spicy'],
  rating: 8,
  bottle_status: null,
  preferred_seasons: null,
  catalog_id: null,
  image_url: null,
  personal_image_url: null,
  catalog_image_url: null,
  catalog_description: null,
  catalog_source: null,
  catalog_release_year: null,
  catalog_notes_top: null,
  catalog_notes_middle: null,
  catalog_notes_base: null,
  catalog_perfumers: null,
  created_at: '2026-04-25T12:00:00Z',
  updated_at: '2026-04-25T12:00:00Z',
} as unknown as Fragrance;

function stubQuery(data: Fragrance[]) {
  mockUseFragrancesQuery.mockReturnValue({
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
  });
}

describe('Collection actions', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSignOut.mockReset();
    mockUseWearsQuery.mockReturnValue({ data: [] });
    jest.restoreAllMocks();
  });

  it('confirms before signing out and only signs out on confirmation', () => {
    stubQuery([shelfFragrance]);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    const { getByLabelText } = render(<Collection />);
    fireEvent.press(getByLabelText('Sign out'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(mockSignOut).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] as { text?: string; onPress?: () => void }[];
    const cancel = buttons.find((b) => b.text === 'Cancel');
    const confirm = buttons.find((b) => b.text === 'Sign out');
    expect(cancel).toBeTruthy();
    expect(confirm).toBeTruthy();

    cancel?.onPress?.();
    expect(mockSignOut).not.toHaveBeenCalled();

    confirm?.onPress?.();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('offers a clear-filters control that restores the shelf', () => {
    stubQuery([shelfFragrance]);

    const { getByText, queryByText, queryByLabelText } = render(<Collection />);

    // Bottle is visible initially.
    expect(getByText('Sauvage')).toBeTruthy();
    expect(queryByLabelText('Clear filters')).toBeNull();

    // Applying "In season" filters out a bottle with no preferred seasons.
    fireEvent.press(getByText('In season'));

    expect(queryByText('Sauvage')).toBeNull();
    const clear = queryByLabelText('Clear filters');
    expect(clear).toBeTruthy();

    // Clearing filters brings the bottle back and removes the control.
    fireEvent.press(clear!);

    expect(getByText('Sauvage')).toBeTruthy();
    expect(queryByLabelText('Clear filters')).toBeNull();
  });

  it('routes to the add screen from the empty-shelf action', () => {
    stubQuery([]);

    const { getByLabelText } = render(<Collection />);

    fireEvent.press(getByLabelText('Add your first bottle'));

    expect(mockPush).toHaveBeenCalledWith('/add');
  });
});
