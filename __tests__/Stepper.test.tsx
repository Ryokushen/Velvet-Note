import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Stepper } from '../components/ui/Stepper';

const mockTapLight = jest.fn();

jest.mock('../lib/haptics', () => ({
  tapLight: () => mockTapLight(),
}));

describe('Stepper', () => {
  beforeEach(() => {
    mockTapLight.mockReset();
  });

  it('renders the value and labelled increment/decrement buttons', () => {
    const { getByText, getByLabelText } = render(
      <Stepper
        value={3}
        label="compliment count"
        onDecrement={jest.fn()}
        onIncrement={jest.fn()}
      />,
    );

    expect(getByText('3')).toBeTruthy();
    expect(getByLabelText('Decrease compliment count')).toBeTruthy();
    expect(getByLabelText('Increase compliment count')).toBeTruthy();
  });

  it('uses the proper minus sign (U+2212), not a hyphen', () => {
    const { queryByText } = render(
      <Stepper value={1} label="count" onDecrement={jest.fn()} onIncrement={jest.fn()} />,
    );

    expect(queryByText('−')).toBeTruthy();
    expect(queryByText('-')).toBeNull();
  });

  it('fires callbacks and a light haptic on each press', () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    const { getByLabelText } = render(
      <Stepper value={2} label="count" onDecrement={onDecrement} onIncrement={onIncrement} />,
    );

    fireEvent.press(getByLabelText('Increase count'));
    fireEvent.press(getByLabelText('Decrease count'));

    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(mockTapLight).toHaveBeenCalledTimes(2);
  });

  it('disables decrement at the minimum and swallows the press', () => {
    const onDecrement = jest.fn();
    const { getByLabelText } = render(
      <Stepper value={0} label="count" onDecrement={onDecrement} onIncrement={jest.fn()} />,
    );

    const decrement = getByLabelText('Decrease count');
    expect(decrement.props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(decrement);
    expect(onDecrement).not.toHaveBeenCalled();
    expect(mockTapLight).not.toHaveBeenCalled();
  });

  it('honours an explicit decrementDisabled override', () => {
    const onDecrement = jest.fn();
    const { getByLabelText } = render(
      <Stepper
        value={5}
        label="count"
        decrementDisabled
        onDecrement={onDecrement}
        onIncrement={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText('Decrease count'));
    expect(onDecrement).not.toHaveBeenCalled();
  });

  it('renders a custom value slot when provided', () => {
    const { getByText } = render(
      <Stepper
        variant="panel"
        value={7}
        label="count"
        onDecrement={jest.fn()}
        onIncrement={jest.fn()}
        renderValue={(value) => <Text>{`count: ${value}`}</Text>}
      />,
    );

    expect(getByText('count: 7')).toBeTruthy();
  });
});
