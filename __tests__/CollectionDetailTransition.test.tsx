import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render } from '@testing-library/react-native';
import Collection from '../app/(tabs)/index';
import Detail from '../app/fragrance/[id]';
import type { Fragrance } from '../types/fragrance';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockReplace = jest.fn();
let mockParams = { id: 'fragrance-1' };

const fragranceFixture = {
  id: 'fragrance-1',
  user_id: 'user-1',
  brand: 'Serge Lutens',
  name: 'Chergui',
  concentration: 'EDP',
  accords: ['Amber', 'Tobacco'],
  rating: 8.5,
  image_url: null,
  personal_image_url: null,
  catalog_id: null,
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

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: React.forwardRef(
      (
        { children, edges: _edges, ...props }: { children: React.ReactNode; edges?: string[] },
        ref: React.Ref<unknown>,
      ) => React.createElement(View, { ...props, ref }, children),
    ),
  };
});

jest.mock('../components/BottleArt', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottleArt: (props: { width?: number; height?: number }) =>
      React.createElement(View, { testID: `bottle-art-${props.width}x${props.height}` }),
  };
});

jest.mock('../components/ui/Icon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = () => React.createElement(Text);
  return {
    IconBook: MockIcon,
    IconChevronLeft: MockIcon,
    IconGrid: MockIcon,
    IconList: MockIcon,
    IconLogOut: MockIcon,
    IconSearch: MockIcon,
    IconTrash: MockIcon,
    IconX: MockIcon,
  };
});

jest.mock('../lib/admin', () => ({
  isAppAdmin: jest.fn().mockResolvedValue(false),
}));

jest.mock('../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
}));

jest.mock('../lib/haptics', () => ({
  tapLight: jest.fn(),
  tapMedium: jest.fn(),
  notifySuccess: jest.fn(),
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: [fragranceFixture],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
  }),
  useUpdateFragrance: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeleteFragrance: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('../hooks/useWears', () => ({
  useCreateWear: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useSetActiveWear: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useFragranceWearsQuery: () => ({ data: [], isLoading: false, error: null }),
  useWearsQuery: () => ({ data: [], isLoading: false, error: null }),
}));

describe('collection/detail native transition handoff', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockParams = { id: 'fragrance-1' };
    mockPush.mockReset();
    mockBack.mockReset();
    mockCanGoBack.mockReset();
    mockCanGoBack.mockReturnValue(true);
    mockReplace.mockReset();
  });

  it('pushes the detail route immediately from list view', () => {
    const { getByLabelText } = render(<Collection />);

    fireEvent.press(getByLabelText('Open Serge Lutens Chergui'));

    expect(mockPush).toHaveBeenCalledWith('/fragrance/fragrance-1');
  });

  it('uses the same direct route handoff from grid view', () => {
    const { getByLabelText } = render(<Collection />);

    fireEvent.press(getByLabelText('Switch to grid view'));
    fireEvent.press(getByLabelText('Open Serge Lutens Chergui'));

    expect(mockPush).toHaveBeenCalledWith('/fragrance/fragrance-1');
  });

  it('renders detail content immediately and delegates back to the native stack', () => {
    const { getByLabelText, getByTestId } = render(<Detail />);

    expect(getByTestId('detail-screen-body')).toBeTruthy();
    expect(getByTestId('detail-hero-image')).toBeTruthy();

    fireEvent.press(getByLabelText('Back to collection'));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('falls back to the collection route when there is no stack entry', () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByLabelText } = render(<Detail />);

    fireEvent.press(getByLabelText('Back to collection'));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
