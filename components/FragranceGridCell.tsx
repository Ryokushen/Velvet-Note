import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { Fragrance } from '../types/fragrance';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius } from '../theme/spacing';
import { durations, easeOut, useReducedMotion } from '../lib/motion';
import { Caption, Serif } from './ui/text';
import { BottleArt } from './BottleArt';

type FragranceGridCellProps = {
  fragrance: Fragrance;
  onPress: () => void;
  onLongPress?: () => void;
  lastWornLabel?: string | null;
  justLogged?: boolean;
};

export function FragranceGridCell({
  fragrance,
  onPress,
  onLongPress,
  lastWornLabel,
  justLogged = false,
}: FragranceGridCellProps) {
  const rating = fragrance.rating != null ? fragrance.rating.toFixed(1) : '—';
  const ratingA11y =
    fragrance.rating != null ? `, rated ${fragrance.rating.toFixed(1)}` : '';
  const reducedMotion = useReducedMotion();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${fragrance.brand} ${fragrance.name}${ratingA11y}`}
      style={({ pressed }) => [styles.cell, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.art}>
        <BottleArt imageUrl={fragrance.image_url} width={104} height={136} />
      </View>
      <Caption style={styles.brand} numberOfLines={1}>
        {fragrance.brand}
      </Caption>
      <Serif size={15} numberOfLines={1} style={styles.name}>
        {fragrance.name}
      </Serif>
      <View style={styles.meta}>
        <Text style={styles.rating}>{rating}</Text>
        {justLogged ? (
          <Animated.Text
            style={styles.logged}
            entering={
              reducedMotion
                ? undefined
                : FadeInUp.duration(durations.base).easing(easeOut)
            }
          >
            Logged ✓
          </Animated.Text>
        ) : lastWornLabel ? (
          <Text style={styles.lastWorn} numberOfLines={1}>
            {lastWornLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  art: {
    alignItems: 'center',
    marginBottom: 12,
  },
  brand: {
    marginBottom: 4,
  },
  name: {
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  rating: {
    fontFamily: typography.serif,
    fontSize: 17,
    color: colors.text,
  },
  lastWorn: {
    ...typography.bodyDim,
    fontSize: 11,
    color: colors.textDim,
    flexShrink: 1,
  },
  logged: {
    ...typography.bodyDim,
    fontSize: 11,
    color: colors.accent,
  },
});
