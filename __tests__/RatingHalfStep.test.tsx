import { fireEvent, render } from '@testing-library/react-native';
import { RatingDots } from '../components/ui/RatingDots';

describe('RatingDots half-step controls', () => {
  it('increments and decrements ratings in half-point steps', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<RatingDots value={8} onChange={onChange} />);

    fireEvent.press(getByLabelText('Increase rating by 0.5'));
    fireEvent.press(getByLabelText('Decrease rating by 0.5'));

    expect(onChange).toHaveBeenNthCalledWith(1, 8.5);
    expect(onChange).toHaveBeenNthCalledWith(2, 7.5);
  });

  it('keeps half-step controls within the 0 to 10 rating range', () => {
    const onChange = jest.fn();
    const { getByLabelText, rerender } = render(<RatingDots value={10} onChange={onChange} />);

    fireEvent.press(getByLabelText('Increase rating by 0.5'));
    expect(onChange).toHaveBeenCalledWith(10);

    rerender(<RatingDots value={0} onChange={onChange} />);
    fireEvent.press(getByLabelText('Decrease rating by 0.5'));
    expect(onChange).toHaveBeenCalledWith(0);
  });
});
