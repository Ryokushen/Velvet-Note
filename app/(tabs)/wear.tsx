import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { Caption, Serif } from '../../components/ui/text';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { useWearsQuery } from '../../hooks/useWears';
import type { Fragrance } from '../../types/fragrance';
import type { Wear } from '../../types/wear';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';

export default function WearScreen() {
  const router = useRouter();
  const wears = useWearsQuery();
  const fragrances = useFragrancesQuery();

  const fragranceById = useMemo(() => {
    const map = new Map<string, Fragrance>();
    fragrances.data?.forEach((fragrance) => {
      map.set(fragrance.id, fragrance);
    });
    return map;
  }, [fragrances.data]);

  const stats = useMemo(
    () => buildWearStats(wears.data ?? [], fragranceById),
    [wears.data, fragranceById],
  );

  const loading = wears.isLoading || fragrances.isLoading;
  const error = wears.error || fragrances.error;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Serif size={18} style={{ letterSpacing: 0.4 }}>
          Wear
        </Serif>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <EmptyState
          title="Couldn't load wear history"
          hint={error instanceof Error ? error.message : 'Unknown error'}
        />
      ) : wears.data?.length ? (
        <FlatList
          data={wears.data}
          keyExtractor={(wear) => wear.id}
          ListHeaderComponent={
            <View>
              <View style={styles.titleBlock}>
                <Serif size={28}>Wear history</Serif>
              </View>
              <View style={styles.statsBand}>
                <Stat label="This month" value={String(stats.thisMonth)} />
                <Stat label="Total wears" value={String(stats.total)} />
                <Stat label="Most worn" value={stats.mostWorn} compact />
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const fragrance = fragranceById.get(item.fragrance_id);
            return (
              <WearRow
                wear={item}
                fragrance={fragrance}
                onPress={() => router.push(`/fragrance/${item.fragrance_id}` as never)}
              />
            );
          }}
          refreshing={wears.isRefetching || fragrances.isRefetching}
          onRefresh={() => {
            wears.refetch();
            fragrances.refetch();
          }}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      ) : (
        <View style={styles.titleBlock}>
          <Serif size={28}>Wear history</Serif>
          <EmptyState
            title="Nothing logged yet."
            hint="Wear history starts with the first day a bottle leaves the shelf."
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, compact && styles.statValueCompact]} numberOfLines={2}>
        {value}
      </Text>
      <Caption style={styles.statLabel}>{label}</Caption>
    </View>
  );
}

function WearRow({
  wear,
  fragrance,
  onPress,
}: {
  wear: Wear;
  fragrance: Fragrance | undefined;
  onPress: () => void;
}) {
  const bottleName = fragrance ? `${fragrance.brand} ${fragrance.name}` : 'Unknown bottle';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
      <View style={styles.dateBlock}>
        <Text style={styles.day}>{formatDay(wear.worn_on)}</Text>
        <Caption>{formatMonth(wear.worn_on)}</Caption>
      </View>
      <View style={styles.rowMain}>
        <Serif size={17} numberOfLines={1} style={{ marginBottom: 6 }}>
          {bottleName}
        </Serif>
        {wear.notes ? (
          <Text style={styles.note} numberOfLines={2}>
            {wear.notes}
          </Text>
        ) : (
          <Text style={styles.noteDim}>No note</Text>
        )}
      </View>
    </Pressable>
  );
}

function buildWearStats(wears: Wear[], fragranceById: Map<string, Fragrance>) {
  const thisMonth = wears.filter((wear) => isCurrentMonth(wear.worn_on)).length;
  const counts = new Map<string, number>();

  wears.forEach((wear) => {
    counts.set(wear.fragrance_id, (counts.get(wear.fragrance_id) ?? 0) + 1);
  });

  const [mostWornId] =
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  const fragrance = mostWornId ? fragranceById.get(mostWornId) : undefined;

  return {
    total: wears.length,
    thisMonth,
    mostWorn: fragrance ? fragrance.name : '—',
  };
}

function formatDay(value: string): string {
  const d = parseWearDate(value);
  return d ? String(d.getDate()).padStart(2, '0') : '--';
}

function formatMonth(value: string): string {
  const d = parseWearDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short' });
}

function isCurrentMonth(value: string): boolean {
  const d = parseWearDate(value);
  if (!d) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function parseWearDate(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 52,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  statsBand: {
    marginHorizontal: 20,
    marginTop: 2,
    marginBottom: 10,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    fontFamily: typography.serif,
    fontSize: 25,
    lineHeight: 28,
    color: colors.text,
    marginBottom: 6,
  },
  statValueCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  dateBlock: {
    width: 54,
    height: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  day: {
    fontFamily: typography.serif,
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  note: {
    ...typography.bodyDim,
    fontSize: 12,
    color: colors.textDim,
  },
  noteDim: {
    ...typography.bodyDim,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
