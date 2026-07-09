import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';
import { View } from 'react-native';
import Collection from '../app/(tabs)/index';
import Detail from '../app/fragrance/[id]';
import { MORPH_TARGETS_WAIT_MS, MorphOverlayHost } from '../components/MorphOverlayHost';
import {
  COLLECTION_DETAIL_MORPH_DURATION_MS,
  COLLECTION_DETAIL_SETTLE_FADE_MS,
  finishMorph,
  getMorphState,
  markMorphOpen,
  openMorph,
  releaseMorph,
  setMorphHostWindowOrigin,
  setMorphTargets,
  type MorphTargets,
} from '../lib/morphTransition';
import type { Fragrance } from '../types/fragrance';

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

type MeasureInWindowCallback = (x: number, y: number, width: number, height: number) => void;
type MeasurableViewPrototype = {
  measureInWindow: (callback: MeasureInWindowCallback) => void;
};

function viewPrototype() {
  return (View as unknown as { prototype: MeasurableViewPrototype }).prototype;
}

function measureInWindowMock() {
  return viewPrototype().measureInWindow as jest.MockedFunction<
    MeasurableViewPrototype['measureInWindow']
  >;
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
} as unknown as Fragrance;

const rowRect = { x: 16, y: 156, width: 320, height: 96 };

const detailTargets: MorphTargets = {
  card: { x: 0, y: 0, width: 390, height: 844 },
  heading: { x: 24, y: 128, width: 320, height: 96 },
  hero: { x: 24, y: 236, width: 342, height: 228 },
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
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

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

function resetMorphState() {
  finishMorph();
  releaseMorph();
}

describe('collection/detail morph transition', () => {
  beforeEach(async () => {
    // The grid-view test persists the view mode; clear it so later renders of
    // Collection don't asynchronously flip to grid outside act().
    await AsyncStorage.clear();
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
    act(() => {
      resetMorphState();
    });
    jest.spyOn(viewPrototype(), 'measureInWindow').mockImplementation((callback) => {
      callback(rowRect.x, rowRect.y, rowRect.width, rowRect.height);
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
      resetMorphState();
    });
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('converts measured window rects into overlay-local coordinates', () => {
    setMorphHostWindowOrigin(0, 42);
    try {
      const { getByLabelText } = render(<Collection />);

      fireEvent.press(getByLabelText('Open Serge Lutens Chergui'));

      // The global measureInWindow mock reports rowRect in window space; the
      // stored origin must be shifted by the host's own window position.
      expect(getMorphState().origin).toEqual({ ...rowRect, y: rowRect.y - 42 });
    } finally {
      setMorphHostWindowOrigin(0, 0);
    }
  });

  it('starts the morph and pushes the detail route immediately', () => {
    const { getByLabelText } = render(<Collection />);

    fireEvent.press(getByLabelText('Open Serge Lutens Chergui'));

    expect(getMorphState().phase).toBe('opening');
    expect(getMorphState().origin).toEqual(rowRect);
    expect(getMorphState().originKind).toBe('row');
    expect(mockPush).toHaveBeenCalledWith('/fragrance/fragrance-1?fromCollection=1');
  });

  it('tags the morph origin as a grid cell when grid view is active', () => {
    const { getByLabelText } = render(<Collection />);

    fireEvent.press(getByLabelText('Switch to grid view'));
    fireEvent.press(getByLabelText('Open Serge Lutens Chergui'));

    expect(getMorphState().phase).toBe('opening');
    expect(getMorphState().originKind).toBe('grid');
    expect(mockPush).toHaveBeenCalledWith('/fragrance/fragrance-1?fromCollection=1');
  });

  it('waits for a fresh row window measurement before starting the opening morph', () => {
    const freshRect = { x: 33, y: 222, width: 321, height: 98 };
    measureInWindowMock().mockImplementationOnce((callback) => {
      setTimeout(() => callback(freshRect.x, freshRect.y, freshRect.width, freshRect.height), 0);
    });

    const { getByLabelText } = render(<Collection />);

    fireEvent.press(getByLabelText('Open Serge Lutens Chergui'));

    expect(getMorphState().phase).toBe('idle');
    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(getMorphState().phase).toBe('opening');
    expect(getMorphState().origin).toEqual(freshRect);
    expect(mockPush).toHaveBeenCalledWith('/fragrance/fragrance-1?fromCollection=1');
  });

  it('plays the opening morph in the overlay host, then settles and fades out', () => {
    const { getByLabelText, getByTestId, queryByLabelText } = render(<MorphOverlayHost />);

    act(() => {
      openMorph(fragranceFixture, rowRect);
      setMorphTargets(detailTargets);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(getByLabelText('Opening Serge Lutens Chergui')).toBeTruthy();
    expect(getByTestId('morph-hero-image')).toBeTruthy();
    expect(getByTestId('bottle-art-176x228')).toBeTruthy();
    expect(getMorphState().phase).toBe('opening');

    act(() => {
      jest.advanceTimersByTime(COLLECTION_DETAIL_MORPH_DURATION_MS);
    });

    expect(getMorphState().phase).toBe('open');

    act(() => {
      jest.advanceTimersByTime(COLLECTION_DETAIL_SETTLE_FADE_MS);
    });

    expect(queryByLabelText('Opening Serge Lutens Chergui')).toBeNull();
    expect(getMorphState().phase).toBe('open');
  });

  it('renders a grid-cell-styled fade copy when the origin is a grid cell', () => {
    const { getByLabelText, getByTestId } = render(<MorphOverlayHost />);

    act(() => {
      openMorph(fragranceFixture, rowRect, 'grid');
      setMorphTargets(detailTargets);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(getByLabelText('Opening Serge Lutens Chergui')).toBeTruthy();
    expect(getByTestId('morph-grid-copy')).toBeTruthy();
    // The copy shows the cell's own bottle art (104x136), not just row text.
    expect(getByTestId('bottle-art-104x136')).toBeTruthy();
  });

  it('renders the list-row fade copy for row origins', () => {
    const { queryByTestId } = render(<MorphOverlayHost />);

    act(() => {
      openMorph(fragranceFixture, rowRect);
      setMorphTargets(detailTargets);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(queryByTestId('morph-grid-copy')).toBeNull();
  });

  it('holds the opening morph on its first frame until detail targets arrive', () => {
    const { getByLabelText } = render(<MorphOverlayHost />);

    act(() => {
      openMorph(fragranceFixture, rowRect);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    // The frozen first frame is visible over the tapped row while waiting.
    expect(getByLabelText('Opening Serge Lutens Chergui')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(getMorphState().phase).toBe('opening');

    act(() => {
      setMorphTargets(detailTargets);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });
    act(() => {
      jest.advanceTimersByTime(COLLECTION_DETAIL_MORPH_DURATION_MS + 50);
    });

    expect(getMorphState().phase).toBe('open');
  });

  it('starts the opening morph with fallback geometry when targets never arrive', () => {
    render(<MorphOverlayHost />);

    act(() => {
      openMorph(fragranceFixture, rowRect);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });
    act(() => {
      jest.advanceTimersByTime(MORPH_TARGETS_WAIT_MS);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });
    act(() => {
      jest.advanceTimersByTime(COLLECTION_DETAIL_MORPH_DURATION_MS + 50);
    });

    expect(getMorphState().phase).toBe('open');
  });

  it('keeps the detail screen hidden until the opening morph settles', () => {
    mockParams = { id: 'fragrance-1', fromCollection: '1' };
    act(() => {
      openMorph(fragranceFixture, rowRect);
    });

    const { getByTestId } = render(<Detail />);

    expect(getByTestId('detail-screen-body')).toHaveStyle({ opacity: 0 });

    act(() => {
      markMorphOpen();
    });

    expect(getByTestId('detail-screen-body')).not.toHaveStyle({ opacity: 0 });
  });

  it('shows the detail screen immediately when opened without a morph', () => {
    mockParams = { id: 'fragrance-1', fromCollection: undefined };

    const { getByTestId } = render(<Detail />);

    expect(getByTestId('detail-screen-body')).not.toHaveStyle({ opacity: 0 });
  });

  it('starts the closing morph, then pops the route on the next frame', () => {
    mockParams = { id: 'fragrance-1', fromCollection: '1' };
    act(() => {
      openMorph(fragranceFixture, rowRect);
      markMorphOpen();
    });

    const { getByLabelText } = render(<Detail />);

    fireEvent.press(getByLabelText('Back to collection'));

    expect(getMorphState().phase).toBe('closing');
    expect(mockBack).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it('re-measures detail targets before the closing morph starts', () => {
    mockParams = { id: 'fragrance-1', fromCollection: '1' };
    act(() => {
      openMorph(fragranceFixture, rowRect);
      markMorphOpen();
    });

    const { getByLabelText } = render(<Detail />);

    expect(getMorphState().targets).toBeNull();

    fireEvent.press(getByLabelText('Back to collection'));

    expect(getMorphState().phase).toBe('closing');
    // The global measureInWindow mock reports rowRect for every view, so the
    // freshly measured card/heading/hero targets all carry that rect.
    expect(getMorphState().targets).toEqual({
      card: rowRect,
      heading: rowRect,
      hero: rowRect,
    });
  });

  it('uses the closing morph before dispatching gesture removals', () => {
    mockParams = { id: 'fragrance-1', fromCollection: '1' };
    act(() => {
      openMorph(fragranceFixture, rowRect);
      markMorphOpen();
    });
    const removalAction = { type: 'POP' };
    const preventDefault = jest.fn();
    render(<Detail />);

    act(() => {
      mockBeforeRemoveListener?.({
        preventDefault,
        data: { action: removalAction },
      });
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(getMorphState().phase).toBe('closing');
    expect(mockNavigation().dispatch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(mockNavigation().dispatch).toHaveBeenCalledWith(removalAction);
  });

  it('releases a settled morph when the detail screen unmounts without closing', () => {
    mockParams = { id: 'fragrance-1', fromCollection: '1' };
    act(() => {
      openMorph(fragranceFixture, rowRect);
      markMorphOpen();
    });

    const { unmount } = render(<Detail />);
    unmount();

    expect(getMorphState().phase).toBe('idle');
  });
});
