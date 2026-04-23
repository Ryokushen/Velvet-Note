import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Caption, Serif } from './ui/text';
import { BottlePlaceholder } from './ui/BottlePlaceholder';

type Props = {
  title: string;
  hint?: string;
  variant?: 'shelf' | 'plain';
};

export function EmptyState({ title, hint, variant = 'plain' }: Props) {
  if (variant === 'shelf') {
    return (
      <View style={styles.shelf}>
        <View style={styles.vessel}>
          <BottlePlaceholder width={44} height={72} tintOpacity={0.08} />
        </View>
        <Serif size={22} style={{ textAlign: 'center' }}>
          {title}
        </Serif>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        <Caption tone="dim" style={styles.nudge}>
          — Add your first bottle ↓
        </Caption>
      </View>
    );
  }
  return (
    <View style={styles.plain}>
      <Serif size={20} style={{ textAlign: 'center' }}>
        {title}
      </Serif>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: {
    paddingTop: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 16,
  },
  vessel: {
    width: 80,
    height: 110,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  plain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  hint: {
    ...typography.bodyDim,
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
  nudge: { marginTop: 16, letterSpacing: 1.5 },
});
