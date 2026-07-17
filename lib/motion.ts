import { Easing } from 'react-native-reanimated';

// Shared motion contract: state-change/enter animations use these durations
// with ease-out, and every animated surface must respect useReducedMotion().
export { useReducedMotion } from 'react-native-reanimated';

export const durations = {
  fast: 150,
  base: 200,
  slow: 280,
} as const;

export const easeOut = Easing.out(Easing.cubic);
