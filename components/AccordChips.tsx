import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius } from '../theme/spacing';
import { Caption } from './ui/text';
import { Chip } from './ui/Chip';

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
    if (!a || value.includes(a)) {
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
    <View>
      <Caption style={{ marginBottom: 10 }}>Accords</Caption>
      <View style={styles.box}>
        {value.map((a) => (
          <Chip key={a} label={a} size="sm" onRemove={() => remove(a)} />
        ))}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          placeholder={value.length === 0 ? 'Type a note and press return' : '+ add'}
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 56,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    ...typography.body,
    fontSize: 13,
    color: colors.text,
    minWidth: 120,
    flexGrow: 1,
    padding: 0,
  },
});
