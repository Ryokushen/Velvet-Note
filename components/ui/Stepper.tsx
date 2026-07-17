import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { tapLight } from '../../lib/haptics';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

// Proper minus sign (U+2212) — visually balanced against the plus, unlike a hyphen.
const MINUS = '−';

export type StepperVariant = 'panel' | 'inline';

type StepperProps = {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Noun for accessibility, e.g. "compliment count" → "Decrease compliment count". */
  label: string;
  min?: number;
  variant?: StepperVariant;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Override the value slot between the buttons (e.g. an oversized serif numeral). */
  renderValue?: (value: number) => ReactNode;
};

/**
 * One shared −/+ stepper. Effective touch targets are ≥44pt in both variants
 * (via button size and hitSlop), every control is a labelled button, and each
 * press fires a light haptic. The value slot lives between the two buttons.
 */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  label,
  min = 0,
  variant = 'inline',
  decrementDisabled,
  incrementDisabled,
  style,
  renderValue,
}: StepperProps) {
  const isPanel = variant === 'panel';
  const minusDisabled = decrementDisabled ?? value <= min;
  const plusDisabled = incrementDisabled ?? false;

  const press = (fn: () => void, disabled: boolean) => () => {
    if (disabled) return;
    tapLight();
    fn();
  };

  return (
    <View style={[isPanel ? styles.panelRow : styles.inlineRow, style]}>
      <StepButton
        glyph={MINUS}
        variant={variant}
        disabled={minusDisabled}
        accessibilityLabel={`Decrease ${label}`}
        onPress={press(onDecrement, minusDisabled)}
      />
      {renderValue ? (
        renderValue(value)
      ) : (
        <Text style={isPanel ? styles.panelValue : styles.inlineValue}>{value}</Text>
      )}
      <StepButton
        glyph="+"
        variant={variant}
        disabled={plusDisabled}
        accessibilityLabel={`Increase ${label}`}
        onPress={press(onIncrement, plusDisabled)}
      />
    </View>
  );
}

function StepButton({
  glyph,
  variant,
  disabled,
  accessibilityLabel,
  onPress,
}: {
  glyph: string;
  variant: StepperVariant;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const isPanel = variant === 'panel';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={isPanel ? undefined : 6}
      onPress={onPress}
      style={({ pressed }) => [
        isPanel ? styles.panelButton : styles.inlineButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={isPanel ? styles.panelButtonText : styles.inlineButtonText}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  panelButton: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  panelButtonText: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
  },
  inlineButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineButtonText: {
    color: colors.text,
    fontSize: 18,
  },
  panelValue: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 54,
    lineHeight: 62,
  },
  inlineValue: {
    minWidth: 40,
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.serif,
    fontSize: 18,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.78,
  },
});
