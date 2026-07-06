import { fireEvent, render } from '@testing-library/react-native';
import Wrapped from '../app/wrapped';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/BottleArt', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottleArt: () => React.createElement(View),
  };
});

const mockFragranceFixture = {
  id: 'fragrance-1',
  user_id: 'user-1',
  brand: 'Serge Lutens',
  name: 'Chergui',
  concentration: 'EDP',
  accords: ['Amber'],
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
  bottle_status: 'full',
  purchase_price: 120,
  purchase_currency: 'USD',
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

const mockCurrentYear = new Date().getFullYear();

const mockWearFixtures = [
  ...['01-10', '01-11', '01-12'].map((suffix, index) => ({
    id: `wear-${index}`,
    user_id: 'user-1',
    fragrance_id: 'fragrance-1',
    worn_on: `${mockCurrentYear}-${suffix}`,
    notes: null,
    season: 'winter',
    time_of_day: null,
    occasion: null,
    compliment_count: index === 0 ? 3 : 0,
    compliment_note: null,
    created_at: `${mockCurrentYear}-01-10T00:00:00Z`,
    updated_at: `${mockCurrentYear}-01-10T00:00:00Z`,
  })),
  {
    // A wear two years back leaves last year reachable but empty.
    id: 'wear-old',
    user_id: 'user-1',
    fragrance_id: 'fragrance-1',
    worn_on: `${mockCurrentYear - 2}-06-01`,
    notes: null,
    season: 'summer',
    time_of_day: null,
    occasion: null,
    compliment_count: 0,
    compliment_note: null,
    created_at: `${mockCurrentYear - 2}-06-01T00:00:00Z`,
    updated_at: `${mockCurrentYear - 2}-06-01T00:00:00Z`,
  },
];

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: [mockFragranceFixture],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../hooks/useWears', () => ({
  useWearsQuery: () => ({
    data: mockWearFixtures,
    isLoading: false,
    error: null,
  }),
}));

describe('Wrapped screen', () => {
  beforeEach(() => {
    mockBack.mockReset();
  });

  it('renders the year stats from wear history', () => {
    const { getByText, getAllByText } = render(<Wrapped />);

    expect(getByText(String(mockCurrentYear))).toBeTruthy();
    expect(getByText('Your year in scent')).toBeTruthy();
    expect(getByText('wears')).toBeTruthy();
    expect(getByText('Fragrance of the year')).toBeTruthy();
    expect(getAllByText('Chergui').length).toBeGreaterThan(0);
    expect(getByText('Compliment champion')).toBeTruthy();
    expect(getByText('3 received')).toBeTruthy();
    expect(getByText('Longest streak')).toBeTruthy();
    expect(getByText('3 days')).toBeTruthy();
    expect(getByText('Best value')).toBeTruthy();
  });

  it('shows an empty state for a year without wears', () => {
    const { getByText, getByLabelText } = render(<Wrapped />);

    fireEvent.press(getByLabelText('Previous year'));

    expect(getByText(`Nothing logged in ${mockCurrentYear - 1}.`)).toBeTruthy();
  });

  it('navigates back from the header', () => {
    const { getByLabelText } = render(<Wrapped />);

    fireEvent.press(getByLabelText('Back to insights'));

    expect(mockBack).toHaveBeenCalled();
  });
});
