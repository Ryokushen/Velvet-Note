import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';

type Props = {
  children: string;
  loading?: boolean;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
} & Omit<PressableProps, 'children' | 'style'>;

export function PrimaryButton({ children, loading, style, disabled, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles.primary,
        (disabled || loading) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={styles.primaryText}>{children}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton({ children, loading, danger, style, disabled, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles.ghost,
        { borderColor: danger ? colors.error : colors.border },
        (disabled || loading) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={danger ? colors.error : colors.text} />
      ) : (
        <Text style={[styles.ghostText, { color: danger ? colors.error : colors.text }]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  primaryText: {
    ...typography.body,
    color: colors.text,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  ghost: { backgroundColor: 'transparent', borderWidth: 1 },
  ghostText: {
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});
