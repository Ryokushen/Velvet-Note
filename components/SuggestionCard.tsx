import { StyleSheet, Text, View } from 'react-native';
import { BottleArt } from './BottleArt';
import { GhostButton, PrimaryButton } from './ui/Button';
import { Caption, Serif } from './ui/text';
import { describeSuggestion, type WearSuggestion } from '../lib/suggestion';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type SuggestionCardProps = {
  suggestion: WearSuggestion;
  onWear: () => void;
  onShuffle: () => void;
  wearing?: boolean;
  canShuffle?: boolean;
};

export function SuggestionCard({
  suggestion,
  onWear,
  onShuffle,
  wearing = false,
  canShuffle = true,
}: SuggestionCardProps) {
  const { fragrance } = suggestion;
  const reasons = describeSuggestion(suggestion);

  return (
    <View style={styles.card} testID="suggestion-card">
      <Caption style={{ marginBottom: 10 }}>{"Today's pick"}</Caption>
      <View style={styles.heroRow}>
        <View style={styles.copy}>
          <Caption style={{ marginBottom: 8 }}>{fragrance.brand}</Caption>
          <Serif size={30}>{fragrance.name}</Serif>
          {reasons ? <Text style={styles.reasons}>{reasons}</Text> : null}
        </View>
        <BottleArt imageUrl={fragrance.image_url} width={104} height={136} />
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          loading={wearing}
          onPress={onWear}
          style={styles.wearButton}
          accessibilityLabel={`Wear ${fragrance.brand} ${fragrance.name} today`}
        >
          Wear it
        </PrimaryButton>
        {canShuffle ? (
          <GhostButton onPress={onShuffle} style={styles.shuffleButton}>
            Shuffle
          </GhostButton>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  reasons: {
    ...typography.bodyDim,
    color: colors.textDim,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  wearButton: {
    flex: 1,
  },
  shuffleButton: {
    flex: 1,
  },
});
