import { TextStyle } from 'react-native';

// Bundled via @expo-google-fonts/fraunces and loaded in app/_layout.tsx.
// Custom fonts on Android resolve by exact family name, so serif styles must
// not also set fontWeight (it can force a fallback face).
const serif = 'Fraunces_400Regular';
const serifItalic = 'Fraunces_400Regular_Italic';

export const typography = {
  serif,
  serifItalic,
  display: {
    fontFamily: serif,
    fontSize: 32,
    letterSpacing: 0.2,
    lineHeight: 38,
  } as TextStyle,
  title: {
    fontFamily: serif,
    fontSize: 22,
    letterSpacing: 0.2,
    lineHeight: 28,
  } as TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,
  bodyDim: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
  // Editorial caption: small, tracked, uppercase.
  caption: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,
};

// Single source of truth for arbitrary-size serif text (see ui/text.tsx).
export function serifStyle(size: number): TextStyle {
  return {
    fontFamily: serif,
    fontSize: size,
    letterSpacing: 0.2,
    lineHeight: Math.round(size * 1.15),
  };
}
