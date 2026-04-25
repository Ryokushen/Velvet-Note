import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Collection from '../app/(tabs)/index';
import { isAppAdmin } from '../lib/admin';
import type { Fragrance } from '../types/fragrance';

const mockPush = jest.fn();
const mockUseFragrancesQuery = jest.fn();
const mockUseWearsQuery = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => mockUseFragrancesQuery(),
}));

jest.mock('../hooks/useWears', () => ({
  useWearsQuery: () => mockUseWearsQuery(),
}));

jest.mock('../lib/admin', () => ({
  isAppAdmin: jest.fn(),
}));

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

const fragrance: Fragrance = {
  id: 'fragrance-1',
  user_id: 'user-1',
  brand: 'Dior',
  name: 'Sauvage',
  concentration: 'EDT',
  accords: ['fresh spicy'],
  rating: 8,
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
};

describe('Collection admin barcode review entry', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUseFragrancesQuery.mockReturnValue({
      data: [fragrance],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseWearsQuery.mockReturnValue({ data: [] });
    jest.mocked(isAppAdmin).mockReset();
  });

  it('shows a barcode review entry for admins and routes to barcode review', async () => {
    jest.mocked(isAppAdmin).mockResolvedValue(true);

    const { getByLabelText } = render(<Collection />);

    const reviewEntry = await waitFor(() => getByLabelText('Review barcode submissions'));
    fireEvent.press(reviewEntry);

    expect(mockPush).toHaveBeenCalledWith('/barcode-review');
  });

  it('hides the barcode review entry for non-admins', async () => {
    jest.mocked(isAppAdmin).mockResolvedValue(false);

    const { queryByLabelText } = render(<Collection />);

    await waitFor(() => {
      expect(isAppAdmin).toHaveBeenCalled();
    });
    expect(queryByLabelText('Review barcode submissions')).toBeNull();
  });

  it('hides the barcode review entry when the admin check fails', async () => {
    jest.mocked(isAppAdmin).mockRejectedValue(new Error('RPC unavailable'));

    const { queryByLabelText } = render(<Collection />);

    await waitFor(() => {
      expect(isAppAdmin).toHaveBeenCalled();
    });
    expect(queryByLabelText('Review barcode submissions')).toBeNull();
  });
});
