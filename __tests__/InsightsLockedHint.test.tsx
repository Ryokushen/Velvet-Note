import { render } from '@testing-library/react-native';
import Insights from '../app/(tabs)/insights';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// A shelf with a single, price-less wear and no compliments leaves several
// sections (crowd-pleasers, shelf economics) unlockable.
jest.mock('../hooks/useFragrances', () => ({
  useFragrancesQuery: () => ({
    data: [
      {
        id: 'f1',
        user_id: 'user-1',
        brand: 'Guerlain',
        name: 'Shalimar',
        concentration: 'EDP',
        accords: ['amber'],
        rating: 8,
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
        occasion: null,
        compliment_count: 0,
        compliment_note: null,
        created_at: '2026-04-20T00:00:00Z',
        updated_at: '2026-04-20T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('Insights locked sections', () => {
  it('collapses unlockable sections into a single quiet hint', () => {
    const { getAllByText, queryByText } = render(<Insights />);

    // The old per-section repetition is gone entirely.
    expect(queryByText('Log more wears to unlock this view.')).toBeNull();
    // Exactly one summary line stands in for every collapsed section.
    expect(getAllByText('— More views unlock as you log wears')).toHaveLength(1);
    // A section with data (built from the one wear) still renders.
    expect(queryByText('Most worn')).toBeTruthy();
    // A section with no data (no compliments) is collapsed, not shown empty.
    expect(queryByText('Crowd-pleasers')).toBeNull();
  });
});
