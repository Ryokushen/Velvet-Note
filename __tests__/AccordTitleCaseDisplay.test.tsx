import { render } from '@testing-library/react-native';
import { NotesRows } from '../components/ui/NotesRows';

describe('accord and note display casing', () => {
  it('renders lowercase accord values in Title Case', () => {
    const { getAllByText, getByText, queryByText } = render(
      <NotesRows accords={['fresh spicy', 'orange blossom', 'ambroxan']} />,
    );

    expect(getAllByText('Fresh Spicy').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Orange Blossom')).toBeTruthy();
    expect(getByText('Ambroxan')).toBeTruthy();
    expect(queryByText('fresh spicy')).toBeNull();
  });
});
