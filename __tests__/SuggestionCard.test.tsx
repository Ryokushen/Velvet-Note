import { fireEvent, render } from '@testing-library/react-native';
import { SuggestionCard } from '../components/SuggestionCard';
import type { WearSuggestion } from '../lib/suggestion';
import type { Fragrance } from '../types/fragrance';

jest.mock('../components/BottleArt', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottleArt: () => React.createElement(View),
  };
});

const fragrance = {
  id: 'fragrance-1',
  user_id: 'user-1',
  brand: 'Serge Lutens',
  name: 'Chergui',
  concentration: 'EDP',
  accords: ['Amber'],
  rating: 8.5,
  image_url: null,
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

const suggestion: WearSuggestion = {
  fragrance,
  score: 72,
  reasons: ['In season', 'Resting for 8 weeks'],
};

describe('SuggestionCard', () => {
  it('renders the pick with its reasons', () => {
    const { getByText } = render(
      <SuggestionCard suggestion={suggestion} onWear={jest.fn()} onShuffle={jest.fn()} />,
    );

    expect(getByText('Serge Lutens')).toBeTruthy();
    expect(getByText('Chergui')).toBeTruthy();
    expect(getByText('In season · Resting for 8 weeks')).toBeTruthy();
  });

  it('fires the wear and shuffle callbacks', () => {
    const onWear = jest.fn();
    const onShuffle = jest.fn();
    const { getByText } = render(
      <SuggestionCard suggestion={suggestion} onWear={onWear} onShuffle={onShuffle} />,
    );

    fireEvent.press(getByText('Wear it'));
    fireEvent.press(getByText('Shuffle'));

    expect(onWear).toHaveBeenCalledTimes(1);
    expect(onShuffle).toHaveBeenCalledTimes(1);
  });

  it('hides shuffle when there is nothing to cycle to', () => {
    const { queryByText } = render(
      <SuggestionCard
        suggestion={suggestion}
        onWear={jest.fn()}
        onShuffle={jest.fn()}
        canShuffle={false}
      />,
    );

    expect(queryByText('Shuffle')).toBeNull();
  });
});
