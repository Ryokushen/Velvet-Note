import { Pressable, View, Text, StyleSheet } from 'react-native';
import type { Fragrance } from '../types/fragrance';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Caption, Serif } from './ui/text';
import { BottleArt } from './BottleArt';

export function FragranceRow({
  fragrance,
  onPress,
  withImage = false,
  lastWornLabel,
}: {
  fragrance: Fragrance;
  onPress: () => void;
  withImage?: boolean;
  lastWornLabel?: string | null;
}) {
  const rating = fragrance.rating != null ? fragrance.rating.toFixed(1) : '—';
  const accordPreview = fragrance.accords.slice(0, 3).join(', ');
  const subline = [fragrance.concentration, accordPreview].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
      {withImage && (
        <BottleArt imageUrl={fragrance.image_url} width={56} height={72} />
      )}
      <View style={styles.main}>
        <Caption style={{ marginBottom: 4 }}>{fragrance.brand}</Caption>
        <Serif size={17} numberOfLines={1} style={{ marginBottom: 6 }}>
          {fragrance.name}
        </Serif>
        {subline ? (
          <Text style={styles.subline} numberOfLines={1}>
            {subline}
          </Text>
        ) : null}
        {lastWornLabel ? (
          <Text style={styles.lastWorn} numberOfLines={1}>
            Last worn {lastWornLabel}
          </Text>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text style={styles.rating}>{rating}</Text>
        <Caption style={styles.ratingLabel}>Rating</Caption>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  main: { flex: 1, minWidth: 0 },
  subline: {
    ...typography.bodyDim,
    fontSize: 12,
    color: colors.textDim,
    letterSpacing: 0.3,
  },
  lastWorn: {
    ...typography.bodyDim,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  meta: { alignItems: 'flex-end' },
  rating: {
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.text,
    lineHeight: 22,
  },
  ratingLabel: { fontSize: 9, marginTop: 4 },
});
