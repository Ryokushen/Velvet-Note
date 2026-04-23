import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Caption } from './text';

type Props = {
  value: number;
  onChange?: (v: number) => void;
  label?: string;
};

// 10-dot row: used as the *input* affordance in Add/Edit forms.
// Design note: dots are satisfying to tap, a numeral isn't.
// Tap dot N to set rating to N; tap again to set to N-0.5.
export function RatingDots({ value, onChange, label = 'out of ten' }: Props) {
  const readOnly = !onChange;
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.numeral}>{value > 0 ? value.toFixed(1) : '—'}</Text>
        <Caption>{value > 0 ? label : 'Tap to rate'}</Caption>
      </View>
      <View style={styles.dots}>
        {[...Array(10)].map((_, i) => {
          const pos = i + 1;
          const fillRatio = Math.max(0, Math.min(1, value - i));
          const inner = (
            <View
              style={[
                styles.dot,
                { borderColor: fillRatio > 0 ? colors.accent : colors.border },
              ]}
            >
              <View style={[styles.fill, { width: `${fillRatio * 100}%` }]} />
            </View>
          );
          if (readOnly) return <View key={i}>{inner}</View>;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(value === pos ? pos - 0.5 : pos)}
              hitSlop={6}
            >
              {inner}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 12 },
  numeral: {
    fontFamily: typography.serif,
    fontSize: 28,
    fontWeight: '400',
    color: colors.text,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent,
  },
});
