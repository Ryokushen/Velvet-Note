import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Today from '../app/(tabs)/today';
import type { Fragrance } from '../types/fragrance';
import type { Wear } from '../types/wear';

const mockPush = jest.fn();
const mockUpdateMutateAsync = jest.fn();
const mockSetActiveWearMutateAsync = jest.fn();

let mockWearsData: Wear[] = [];
let mockFragrancesData: Fragrance[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/BottleArt', () => ({
  BottleArt: ({ imageUrl }: { imageUrl: string | null }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, `Bottle art ${imageUrl ?? 'none'}`);
  },
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: mockFragrancesData,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../hooks/useWears', () => ({
  useWearsQuery: () => ({
    data: mockWearsData,
    isLoading: false,
    error: null,
  }),
  useUpdateWear: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useSetActiveWear: () => ({
    mutateAsync: mockSetActiveWearMutateAsync,
    isPending: false,
  }),
}));

describe('Today tab', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUpdateMutateAsync.mockReset();
    mockUpdateMutateAsync.mockResolvedValue({});
    mockSetActiveWearMutateAsync.mockReset();
    mockSetActiveWearMutateAsync.mockResolvedValue({});
    mockFragrancesData = [
      fragrance({ id: 'fragrance-1', brand: 'Guerlain', name: 'Shalimar', image_url: 'shalimar.jpg' }),
      fragrance({ id: 'fragrance-2', brand: 'Diptyque', name: 'Tam Dao', image_url: null }),
    ];
    mockWearsData = [
      wear({
        id: 'wear-active',
        fragrance_id: 'fragrance-1',
        is_active: true,
        time_of_day: 'day',
        season: 'spring',
        occasion: 'Office',
        compliment_count: 2,
        notes: 'Warm amber trail',
        created_at: `${todayLocalDateForTest()}T20:00:00Z`,
      }),
      wear({
        id: 'wear-stack',
        fragrance_id: 'fragrance-2',
        is_active: false,
        time_of_day: 'night',
        season: 'fall',
        occasion: 'Dinner',
        compliment_count: 0,
        notes: null,
        created_at: `${todayLocalDateForTest()}T09:00:00Z`,
      }),
    ];
  });

  it('renders the active wear and today stack', () => {
    const { getAllByText, getByText } = render(<Today />);

    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Currently wearing')).toBeTruthy();
    expect(getAllByText('Guerlain').length).toBeGreaterThan(0);
    expect(getAllByText('Shalimar').length).toBeGreaterThan(0);
    expect(getByText('Bottle art shalimar.jpg')).toBeTruthy();
    expect(getAllByText('Day / Spring / Office').length).toBeGreaterThan(0);
    expect(getByText("Today's stack")).toBeTruthy();
    expect(getByText('Diptyque')).toBeTruthy();
    expect(getByText('Tam Dao')).toBeTruthy();
    expect(getByText('0 compliments')).toBeTruthy();
  });

  it('updates compliment counts with plus and minus controls', async () => {
    const { getByLabelText } = render(<Today />);

    fireEvent.press(getByLabelText('Increase compliment count'));
    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'wear-active',
        input: { compliment_count: 3 },
      });
    });

    fireEvent.press(getByLabelText('Decrease compliment count'));
    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenLastCalledWith({
        id: 'wear-active',
        input: { compliment_count: 1 },
      });
    });
  });

  it('saves trimmed journal notes', async () => {
    const { getByDisplayValue, getByText } = render(<Today />);

    fireEvent.changeText(getByDisplayValue('Warm amber trail'), '  Late drydown was smoky  ');
    fireEvent.press(getByText('Save journal'));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'wear-active',
        input: { notes: 'Late drydown was smoky' },
      });
    });
  });

  it('switches active wear from a stack row', async () => {
    const { getByLabelText } = render(<Today />);

    fireEvent.press(getByLabelText('Make Diptyque Tam Dao current'));

    await waitFor(() => {
      expect(mockSetActiveWearMutateAsync).toHaveBeenCalledWith('wear-stack');
    });
  });
});

function todayLocalDateForTest(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function wear(input: Partial<Wear>): Wear {
  return {
    id: 'wear',
    user_id: 'user-1',
    fragrance_id: 'fragrance-1',
    worn_on: todayLocalDateForTest(),
    notes: null,
    season: null,
    time_of_day: null,
    occasion: null,
    compliment_count: 0,
    compliment_note: null,
    is_active: false,
    created_at: `${todayLocalDateForTest()}T12:00:00Z`,
    updated_at: `${todayLocalDateForTest()}T12:00:00Z`,
    ...input,
  };
}

function fragrance(input: Partial<Fragrance>): Fragrance {
  return {
    id: 'fragrance',
    user_id: 'user-1',
    brand: 'Brand',
    name: 'Name',
    concentration: 'EDP',
    accords: [],
    rating: null,
    catalog_id: null,
    image_url: null,
    catalog_description: null,
    catalog_source: null,
    catalog_release_year: null,
    catalog_notes_top: null,
    catalog_notes_middle: null,
    catalog_notes_base: null,
    catalog_perfumers: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...input,
  };
}
