import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Caption } from './text';

type Props = {
  value: number | null;
  size?: number;
  showLabel?: boolean;
};

// Giant Georgia numeral. Oxblood decimal. "/10" in textMuted.
// This is the hero on the detail screen — type doing all the work.
export function RatingNumeral({ value, size = 108, showLabel = true }: Props) {
  if (value == null) {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.numeral, { fontSize: size, lineHeight: size * 0.9, color: colors.textMuted }]}>—</Text>
        {showLabel && <Caption style={{ marginTop: 8 }}>— Not yet rated</Caption>}
      </View>
    );
  }
  const [whole, frac] = value.toFixed(1).split('.');
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.numeral, { fontSize: size, lineHeight: size * 0.9 }]}>{whole}</Text>
        <Text
          style={[
            styles.fraction,
            { fontSize: size * 0.5, lineHeight: size * 0.9, color: colors.accent },
          ]}
        >
          .{frac}
        </Text>
        <Text
          style={[
            styles.suffix,
            { fontSize: size * 0.28, lineHeight: size * 0.9, color: colors.textMuted },
          ]}
        >
          /10
        </Text>
      </View>
      {showLabel && <Caption style={{ marginTop: 8 }}>— Your rating</Caption>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  numeral: {
    fontFamily: typography.serif,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -2,
  },
  fraction: {
    fontFamily: typography.serif,
    fontWeight: '400',
    marginLeft: 2,
  },
  suffix: {
    fontFamily: typography.serif,
    fontWeight: '400',
    marginLeft: 10,
    letterSpacing: 2,
  },
});
