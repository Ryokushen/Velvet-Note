import { View } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  width?: number;
  height?: number;
  tintOpacity?: number;
  accent?: boolean;
};

// Quiet vessel illustration — faceted rectangle with a cap. No brand logos.
// Tint hints at concentration via a subtle fill.
export function BottlePlaceholder({
  width = 120,
  height = 180,
  tintOpacity = 0.22,
  accent = false,
}: Props) {
  const strokeCol = accent ? colors.accent : colors.textMuted;
  const tintCol = accent
    ? `rgba(139,58,58,${tintOpacity})`
    : `rgba(237,230,218,${tintOpacity * 0.4})`;
  const capWidth = width * 0.23;
  const capHeight = height * 0.12;
  const neckWidth = width * 0.17;
  const neckHeight = height * 0.045;
  const bodyWidth = width * 0.6;
  const bodyHeight = height * 0.66;
  const borderRadius = Math.max(width * 0.025, 2);
  const lineTop = bodyHeight * 0.38;

  return (
    <View
      style={{
        width,
        height,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: capWidth,
          height: capHeight,
          borderWidth: 1,
          borderColor: strokeCol,
          borderRadius,
          opacity: 0.7,
          backgroundColor: 'transparent',
        }}
      />
      <View
        style={{
          width: neckWidth,
          height: neckHeight,
          marginTop: 2,
          borderWidth: 1,
          borderColor: strokeCol,
          borderRadius,
          opacity: 0.6,
          backgroundColor: 'transparent',
        }}
      />
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          marginTop: 2,
          borderWidth: 1,
          borderColor: strokeCol,
          borderRadius,
          opacity: 0.9,
          backgroundColor: tintCol,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: lineTop,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: strokeCol,
            opacity: 0.25,
          }}
        />
      </View>
    </View>
  );
}
