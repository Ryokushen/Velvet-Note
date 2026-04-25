import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import Collection from '../app/(tabs)/index';
import Detail from '../app/fragrance/[id]';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockReplace = jest.fn();
let mockBeforeRemoveListener: ((event: any) => void) | null = null;
let mockParams = { id: 'fragrance-1', fromCollection: undefined as string | undefined };

function mockNavigation() {
  return (globalThis as any).__mockNavigation as {
    addListener: jest.Mock;
    dispatch: jest.Mock;
  };
}

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
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/BottleArt', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottleArt: (props: { width?: number; height?: number }) =>
      React.createElement(View, {
        testID: `bottle-art-${props.width}x${props.height}`,
      }),
  };
});

jest.mock('../components/ui/Icon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = () => React.createElement(Text);
  return {
    IconBook: MockIcon,
    IconChevronLeft: MockIcon,
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
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: [fragranceFixture],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
  }),
  useUpdateFragrance: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useDeleteFragrance: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('../hooks/useWears', () => ({
  useCreateWear: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useSetActiveWear: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useFragranceWearsQuery: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useWearsQuery: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

describe('collection/detail morph transition', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockReset();
    mockBack.mockReset();
    mockCanGoBack.mockReset();
    mockCanGoBack.mockReturnValue(true);
    mockReplace.mockReset();
    mockNavigation().dispatch.mockReset();
    mockNavigation().addListener.mockReset();
    mockNavigation().addListener.mockImplementation((_eventName: string, listener: (event: any) => void) => {
      mockBeforeRemoveListener = listener;
      return jest.fn();
    });
    mockBeforeRemoveListener = null;
    mockParams = { id: 'fragrance-1', fromCollection: undefined };
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('holds navigation until the row morph duration completes', async () => {
    const { getByLabelText, getByTestId } = render(<Collection />);

    fireEvent.press(getByLabelText('Open Serge Lutens Chergui'));
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(getByLabelText('Opening Serge Lutens Chergui')).toBeTruthy();
    expect(getByTestId('morph-hero-image')).toBeTruthy();
    expect(getByTestId('bottle-art-176x228')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(479);
    });
    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/fragrance/fragrance-1?fromCollection=1');
    });
  });

  it('delays detail content fade-in after the hero morph target appears', () => {
    mockParams = { id: 'fragrance-1', fromCollection: '1' };

    const { getByTestId } = render(<Detail />);

    expect(getByTestId('detail-delayed-content')).toBeTruthy();
  });

  it('uses the same morph duration before navigating back from detail', () => {
    mockParams = { id: 'fragrance-1', fromCollection: '1' };
    const { getByLabelText, getByTestId } = render(<Detail />);

    fireEvent.press(getByLabelText('Back to collection'));

    expect(getByLabelText('Closing Serge Lutens Chergui')).toBeTruthy();
    expect(getByTestId('morph-hero-image')).toBeTruthy();
    expect(getByTestId('detail-hero-image')).toHaveStyle({ opacity: 0 });
    expect(mockBack).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(480);
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it('uses the closing morph before dispatching gesture removals', () => {
    mockParams = { id: 'fragrance-1', fromCollection: '1' };
    const removalAction = { type: 'POP' };
    const preventDefault = jest.fn();
    const { getByLabelText } = render(<Detail />);

    act(() => {
      mockBeforeRemoveListener?.({
        preventDefault,
        data: { action: removalAction },
      });
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(getByLabelText('Closing Serge Lutens Chergui')).toBeTruthy();
    expect(mockNavigation().dispatch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(480);
    });

    expect(mockNavigation().dispatch).toHaveBeenCalledWith(removalAction);
  });
});
