import { render } from '@testing-library/react-native';
import Insights from '../app/(tabs)/insights';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: [
      {
        id: 'f1',
        user_id: 'user-1',
        brand: 'Guerlain',
        name: 'Shalimar',
        concentration: 'EDP',
        accords: ['amber', 'vanilla'],
        rating: 9,
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
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../hooks/useWears', () => ({
  useWearsQuery: () => ({
    data: [
      {
        id: 'w1',
        user_id: 'user-1',
        fragrance_id: 'f1',
        worn_on: '2026-04-20',
        notes: null,
        season: 'spring',
        time_of_day: 'night',
        occasion: 'Dinner',
        compliment_count: 2,
        compliment_note: 'Asked what it was',
        created_at: '2026-04-20T00:00:00Z',
        updated_at: '2026-04-20T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('Insights tab', () => {
  it('renders wear intelligence and taste profile summaries', () => {
    const { getByText } = render(<Insights />);

    expect(getByText('Insights')).toBeTruthy();
    expect(getByText('Most worn')).toBeTruthy();
    expect(getByText('Compliment leaders')).toBeTruthy();
    expect(getByText('Taste profile')).toBeTruthy();
    expect(getByText('Amber')).toBeTruthy();
    expect(getByText('Spring')).toBeTruthy();
    expect(getByText('Night')).toBeTruthy();
  });
});
