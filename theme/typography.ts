import { TextStyle } from 'react-native';

const serif = 'Georgia';

export const typography = {
  serif,
  display: {
    fontFamily: serif,
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 38,
  } as TextStyle,
  title: {
    fontFamily: serif,
    fontSize: 22,
    fontWeight: '400',
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
