import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CONCENTRATIONS, type Concentration } from '../types/fragrance';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export function ConcentrationPicker({
  value,
  onChange,
}: {
  value: Concentration | null;
  onChange: (v: Concentration) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Concentration</Text>
      <View style={styles.row}>
        {CONCENTRATIONS.map((c) => {
          const selected = value === c;
          return (
            <Pressable
              key={c}
              onPress={() => onChange(c)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.text, selected && styles.textSelected]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.md },
  label: { ...typography.caption, color: colors.textDim, marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  text: { ...typography.bodyDim, color: colors.textDim },
  textSelected: { color: colors.text },
});
