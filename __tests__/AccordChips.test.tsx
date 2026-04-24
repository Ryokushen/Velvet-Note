import { fireEvent, render } from '@testing-library/react-native';
import { AccordChips } from '../components/AccordChips';

describe('AccordChips', () => {
  it('adds a curated suggestion from the vocabulary', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <AccordChips value={[]} onChange={onChange} />,
    );

    fireEvent.changeText(getByPlaceholderText('Type a note and press return'), 'spi');
    fireEvent.press(getByText('warm spicy'));

    expect(onChange).toHaveBeenCalledWith(['warm spicy']);
  });
});
