import { act, render } from '@testing-library/react-native';
import { BottleArt } from '../components/BottleArt';

describe('BottleArt loading state', () => {
  it('shows the placeholder underneath while the image is still loading', () => {
    const { getByTestId } = render(
      <BottleArt imageUrl="https://example.com/bottle.png" />
    );

    expect(getByTestId('bottle-art-placeholder')).toBeTruthy();
    expect(getByTestId('bottle-art-image')).toBeTruthy();
  });

  it('removes the placeholder once the image loads', () => {
    const { getByTestId, queryByTestId } = render(
      <BottleArt imageUrl="https://example.com/bottle.png" />
    );

    act(() => {
      getByTestId('bottle-art-image').props.onLoad({ nativeEvent: {} });
    });

    expect(queryByTestId('bottle-art-placeholder')).toBeNull();
  });

  it('keeps the placeholder when the image fails to load', () => {
    const { getByTestId, queryByTestId } = render(
      <BottleArt imageUrl="https://example.com/broken.png" />
    );

    act(() => {
      getByTestId('bottle-art-image').props.onError({ nativeEvent: {} });
    });

    expect(getByTestId('bottle-art-placeholder')).toBeTruthy();
    expect(queryByTestId('bottle-art-image')).toBeNull();
  });

  it('shows only the placeholder when there is no image url', () => {
    const { getByTestId, queryByTestId } = render(<BottleArt imageUrl={null} />);

    expect(getByTestId('bottle-art-placeholder')).toBeTruthy();
    expect(queryByTestId('bottle-art-image')).toBeNull();
  });
});
