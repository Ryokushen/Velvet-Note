import { Pressable, View, Text, StyleSheet, type ViewProps } from 'react-native';
import type { Fragrance } from '../types/fragrance';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Caption, Serif } from './ui/text';
import { BottleArt } from './BottleArt';
import { formatAccordList } from '../lib/accordDisplay';
import { BOTTLE_STATUS_LABELS, formatMl } from '../lib/journal';

type FragranceRowProps = {
  fragrance: Fragrance;
  onPress: () => void;
  onLongPress?: () => void;
  withImage?: boolean;
  lastWornLabel?: string | null;
  justLogged?: boolean;
  onLayout?: ViewProps['onLayout'];
};

export function FragranceRow({
  fragrance,
  onPress,
  onLongPress,
  withImage = false,
  lastWornLabel,
  justLogged = false,
  onLayout,
}: FragranceRowProps) {
  const rating = fragrance.rating != null ? fragrance.rating.toFixed(1) : '—';
  const ratingA11y =
    fragrance.rating != null ? `, rated ${fragrance.rating.toFixed(1)}` : '';
  const accordPreview = formatAccordList(fragrance.accords.slice(0, 3));
  const bottleMeta = [
    fragrance.bottle_status ? BOTTLE_STATUS_LABELS[fragrance.bottle_status] : null,
    formatMl(fragrance.bottle_size_ml),
  ].filter(Boolean).join(' · ');
  const subline = [fragrance.concentration, bottleMeta, accordPreview].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={`Open ${fragrance.brand} ${fragrance.name}${ratingA11y}`}
      style={({ pressed }) => [
        styles.row,
        pressed && { opacity: 0.75 },
      ]}
    >
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
        {justLogged ? (
          <Text style={styles.logged} numberOfLines={1}>
            Logged today ✓
          </Text>
        ) : lastWornLabel ? (
          <Text style={styles.lastWorn} numberOfLines={1}>
            Last worn {lastWornLabel}
          </Text>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text style={styles.rating}>{rating}</Text>
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
  logged: {
    ...typography.bodyDim,
    fontSize: 12,
    color: colors.accent,
    marginTop: 4,
  },
  meta: { alignItems: 'flex-end' },
  rating: {
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.text,
    lineHeight: 22,
  },
});
