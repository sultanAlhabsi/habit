import { TextStyle } from 'react-native';

export const TYPOGRAPHY = {
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  subMedium: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
};
