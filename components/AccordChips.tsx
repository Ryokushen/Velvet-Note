import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export function AccordChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const a = draft.trim().toLowerCase();
    if (!a) return;
    if (value.includes(a)) {
      setDraft('');
      return;
    }
    onChange([...value, a]);
    setDraft('');
  }

  function remove(a: string) {
    onChange(value.filter((x) => x !== a));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Accords</Text>
      <View style={styles.chips}>
        {value.map((a) => (
          <Pressable key={a} onPress={() => remove(a)} style={styles.chip}>
            <Text style={styles.chipText}>{a} ×</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Add an accord (press enter)"
        placeholderTextColor={colors.textMuted}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        returnKeyType="done"
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.md },
  label: { ...typography.caption, color: colors.textDim, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.bodyDim, color: colors.text },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
