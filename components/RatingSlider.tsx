import Slider from '@react-native-community/slider';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export function RatingSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Rating</Text>
        <Text style={styles.value}>{value.toFixed(1)}</Text>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={10}
        step={0.5}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  label: { ...typography.caption, color: colors.textDim },
  value: { ...typography.body, color: colors.accent },
});
