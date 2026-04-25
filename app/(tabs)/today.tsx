import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottleArt } from '../../components/BottleArt';
import { EmptyState } from '../../components/EmptyState';
import { GhostButton, PrimaryButton } from '../../components/ui/Button';
import { Caption, Serif } from '../../components/ui/text';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { useSetActiveWear, useUpdateWear, useWearsQuery } from '../../hooks/useWears';
import {
  clampComplimentCount,
  selectTodayWearState,
  todayLocalDate,
  type TodayWearRow,
} from '../../lib/todayWear';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function Today() {
  const router = useRouter();
  const wears = useWearsQuery();
  const fragrances = useFragrancesQuery();
  const updateWear = useUpdateWear();
  const setActiveWear = useSetActiveWear();
  const today = todayLocalDate();
  const todayState = useMemo(
    () => selectTodayWearState(wears.data ?? [], fragrances.data ?? [], today),
    [wears.data, fragrances.data, today],
  );
  const [journal, setJournal] = useState(todayState.active?.wear.notes ?? '');

  useEffect(() => {
    setJournal(todayState.active?.wear.notes ?? '');
  }, [todayState.active?.wear.id, todayState.active?.wear.notes]);

  const loading = wears.isLoading || fragrances.isLoading;
  const error = wears.error || fragrances.error;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Serif size={18} style={{ letterSpacing: 0.4 }}>
          Today
        </Serif>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <EmptyState
          title="Couldn't load today"
          hint={error instanceof Error ? error.message : 'Unknown error'}
        />
      ) : !todayState.active ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            title="Nothing logged today."
            hint="Log a wear from your calendar or choose a bottle from your collection."
          />
          <View style={styles.emptyActions}>
            <PrimaryButton onPress={() => router.push('/calendar')}>Open Wears</PrimaryButton>
            <GhostButton onPress={() => router.push('/')}>Open Collection</GhostButton>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ActiveWearCard
            row={todayState.active}
            journal={journal}
            onJournalChange={setJournal}
            onDecrease={() => {
              const next = clampComplimentCount((todayState.active?.wear.compliment_count ?? 0) - 1);
              return updateWear.mutateAsync({
                id: todayState.active!.wear.id,
                input: { compliment_count: next },
              });
            }}
            onIncrease={() => {
              const next = clampComplimentCount((todayState.active?.wear.compliment_count ?? 0) + 1);
              return updateWear.mutateAsync({
                id: todayState.active!.wear.id,
                input: { compliment_count: next },
              });
            }}
            onSaveJournal={() => {
              const notes = journal.trim();
              return updateWear.mutateAsync({
                id: todayState.active!.wear.id,
                input: { notes: notes.length > 0 ? notes : null },
              });
            }}
            saving={updateWear.isPending}
          />

          <View style={styles.section}>
            <Caption style={{ marginBottom: 12 }}>Today's stack</Caption>
            <View style={styles.stack}>
              {todayState.stack.map((row) => (
                <StackRow
                  key={row.wear.id}
                  row={row}
                  active={row.wear.id === todayState.active?.wear.id}
                  onPress={() => setActiveWear.mutateAsync(row.wear.id)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ActiveWearCard({
  row,
  journal,
  onJournalChange,
  onDecrease,
  onIncrease,
  onSaveJournal,
  saving,
}: {
  row: TodayWearRow;
  journal: string;
  onJournalChange: (value: string) => void;
  onDecrease: () => Promise<unknown>;
  onIncrease: () => Promise<unknown>;
  onSaveJournal: () => Promise<unknown>;
  saving?: boolean;
}) {
  const complimentCount = clampComplimentCount(row.wear.compliment_count ?? 0);
  const label = fragranceLabel(row);
  const context = formatContext(row);

  return (
    <View style={styles.activeCard}>
      <Caption style={{ marginBottom: 10 }}>Currently wearing</Caption>
      <View style={styles.heroRow}>
        <View style={styles.activeCopy}>
          <Caption style={{ marginBottom: 8 }}>{row.fragrance?.brand ?? 'Unknown'}</Caption>
          <Serif size={30}>{row.fragrance?.name ?? 'Unknown fragrance'}</Serif>
          {context ? <Text style={styles.context}>{context}</Text> : null}
        </View>
        <BottleArt imageUrl={row.fragrance?.image_url ?? null} width={104} height={136} />
      </View>

      <View style={styles.complimentPanel}>
        <Caption>Compliments</Caption>
        <View style={styles.counterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease compliment count"
            disabled={complimentCount === 0}
            onPress={onDecrease}
            style={({ pressed }) => [
              styles.counterButton,
              complimentCount === 0 && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.counterButtonText}>-</Text>
          </Pressable>
          <Text style={styles.count}>{complimentCount}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase compliment count"
            onPress={onIncrease}
            style={({ pressed }) => [styles.counterButton, pressed && styles.pressed]}
          >
            <Text style={styles.counterButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.journalPanel}>
        <Caption style={{ marginBottom: 10 }}>Journal</Caption>
        <TextInput
          value={journal}
          onChangeText={onJournalChange}
          placeholder={`Notes on ${label}`}
          placeholderTextColor={colors.textMuted}
          multiline
          style={styles.journalInput}
        />
        <PrimaryButton loading={saving} onPress={onSaveJournal} style={styles.saveButton}>
          Save journal
        </PrimaryButton>
      </View>
    </View>
  );
}

function StackRow({
  row,
  active,
  onPress,
}: {
  row: TodayWearRow;
  active: boolean;
  onPress: () => Promise<unknown>;
}) {
  const label = fragranceLabel(row);
  const context = formatContext(row);
  const compliments = clampComplimentCount(row.wear.compliment_count ?? 0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Make ${label} current`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stackRow,
        active && styles.stackRowActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.stackCopy}>
        <Caption style={{ marginBottom: 4 }}>{row.fragrance?.brand ?? 'Unknown'}</Caption>
        <Text style={styles.stackName}>{row.fragrance?.name ?? 'Unknown fragrance'}</Text>
        {context ? <Text style={styles.stackContext}>{context}</Text> : null}
      </View>
      <Text style={styles.stackMetric}>
        {compliments} compliment{compliments === 1 ? '' : 's'}
      </Text>
    </Pressable>
  );
}

function fragranceLabel(row: TodayWearRow): string {
  return row.fragrance ? `${row.fragrance.brand} ${row.fragrance.name}` : 'Unknown fragrance';
}

function formatContext(row: TodayWearRow): string | null {
  const pieces = [row.wear.time_of_day, row.wear.season, row.wear.occasion]
    .filter((piece): piece is string => Boolean(piece))
    .map(titleCase);

  return pieces.length > 0 ? pieces.join(' / ') : null;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
  },
  emptyActions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  activeCard: {
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
  activeCopy: {
    flex: 1,
    minWidth: 0,
  },
  context: {
    ...typography.bodyDim,
    color: colors.textDim,
    marginTop: spacing.sm,
  },
  complimentPanel: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  counterRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterButton: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  counterButtonText: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
  },
  count: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 54,
    lineHeight: 62,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.78,
  },
  journalPanel: {
    marginTop: spacing.lg,
  },
  journalInput: {
    minHeight: 104,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    padding: spacing.md,
    textAlignVertical: 'top',
    ...typography.body,
  },
  saveButton: {
    marginTop: spacing.md,
  },
  section: {
    paddingTop: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  stackRow: {
    minHeight: 78,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stackRowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
  },
  stackCopy: {
    flex: 1,
    minWidth: 0,
  },
  stackName: {
    ...typography.body,
    color: colors.text,
  },
  stackContext: {
    ...typography.bodyDim,
    color: colors.textDim,
    marginTop: 2,
  },
  stackMetric: {
    ...typography.bodyDim,
    color: colors.textDim,
    textAlign: 'right',
  },
});
