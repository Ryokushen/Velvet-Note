import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CONCENTRATIONS, type Concentration } from '../types/fragrance';
import { colors } from '../theme/colors';
import { Caption } from './ui/text';

export function ConcentrationPicker({
  value,
  onChange,
}: {
  value: Concentration | null;
  onChange: (v: Concentration) => void;
}) {
  return (
    <View>
      <Caption style={{ marginBottom: 10 }}>Concentration</Caption>
      <View style={styles.row}>
        {CONCENTRATIONS.map((c) => {
          const selected = value === c;
          return (
            <Pressable
              key={c}
              onPress={() => onChange(c)}
              style={[
                styles.pill,
                {
                  backgroundColor: selected ? colors.accentMuted : 'transparent',
                  borderColor: selected ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  { color: selected ? colors.text : colors.textDim },
                ]}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { fontSize: 12, letterSpacing: 0.6 },
});
