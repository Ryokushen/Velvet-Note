import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontFamily: 'Georgia',
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 38,
  } as TextStyle,
  title: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 28,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,
  bodyDim: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
};
