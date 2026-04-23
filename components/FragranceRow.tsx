import { Pressable, View, Text, StyleSheet } from 'react-native';
import type { Fragrance } from '../types/fragrance';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export function FragranceRow({
  fragrance,
  onPress,
}: {
  fragrance: Fragrance;
  onPress: () => void;
}) {
  const rating = fragrance.rating != null ? fragrance.rating.toFixed(1) : '—';
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.main}>
        <Text style={styles.brand}>{fragrance.brand}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {fragrance.name}
        </Text>
      </View>
      <View style={styles.meta}>
        {fragrance.concentration ? (
          <Text style={styles.conc}>{fragrance.concentration}</Text>
        ) : null}
        <Text style={styles.rating}>{rating}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  main: { flex: 1, paddingRight: spacing.md },
  brand: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  name: { ...typography.title, color: colors.text },
  meta: { alignItems: 'flex-end' },
  conc: { ...typography.caption, color: colors.textDim, marginBottom: 2 },
  rating: { ...typography.title, color: colors.accent },
});
