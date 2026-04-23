import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export function Caption({
  children,
  style,
  tone = 'muted',
  ...rest
}: TextProps & { tone?: 'muted' | 'dim' | 'text' }) {
  const color =
    tone === 'text' ? colors.text : tone === 'dim' ? colors.textDim : colors.textMuted;
  return (
    <Text style={[typography.caption, { color }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Serif({
  children,
  size = 24,
  style,
  tone = 'text',
  ...rest
}: TextProps & { size?: number; tone?: 'text' | 'dim' | 'muted' | 'accent' } & { style?: StyleProp<TextStyle> }) {
  const color =
    tone === 'accent'
      ? colors.accent
      : tone === 'dim'
        ? colors.textDim
        : tone === 'muted'
          ? colors.textMuted
          : colors.text;
  return (
    <Text
      style={[
        {
          fontFamily: typography.serif,
          fontWeight: '400',
          fontSize: size,
          letterSpacing: 0.2,
          lineHeight: size * 1.15,
          color,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
