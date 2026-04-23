import { View } from 'react-native';
import { colors } from '../../theme/colors';

export function SectionDivider({ marginVertical = 32 }: { marginVertical?: number }) {
  return (
    <View style={{ height: 1, backgroundColor: colors.borderSoft, marginVertical }} />
  );
}
