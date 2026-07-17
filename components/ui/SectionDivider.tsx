import { View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function SectionDivider({ marginVertical = spacing.xl }: { marginVertical?: number }) {
  return (
    <View style={{ height: 1, backgroundColor: colors.borderSoft, marginVertical }} />
  );
}
