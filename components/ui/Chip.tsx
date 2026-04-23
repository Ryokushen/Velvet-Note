import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { FAMILY, familyFor, type Family } from '../../theme/families';
import { IconX } from './Icon';

type ChipProps = {
  label: string;
  family?: Family;
  size?: 'sm' | 'md';
  onRemove?: () => void;
};

// Family-tinted chip. The colored dot reads as structure, not decoration.
export function Chip({ label, family, size = 'md', onRemove }: ChipProps) {
  const fam = family ?? familyFor(label);
  const f = FAMILY[fam];
  const Wrapper: any = onRemove ? Pressable : View;
  return (
    <Wrapper
      onPress={onRemove}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: f.tint, borderColor: f.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: f.dot }]} />
      <Text style={[styles.label, size === 'sm' ? styles.labelSm : styles.labelMd]}>{label}</Text>
      {onRemove && <IconX size={size === 'sm' ? 12 : 14} color={colors.textDim} />}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    gap: 6,
  },
  sm: { paddingVertical: 5, paddingHorizontal: 10 },
  md: { paddingVertical: 7, paddingHorizontal: 12 },
  dot: { width: 5, height: 5, borderRadius: 999, opacity: 0.9 },
  label: {
    ...typography.body,
    color: colors.text,
    letterSpacing: 0.4,
  },
  labelSm: { fontSize: 11 },
  labelMd: { fontSize: 12 },
});
