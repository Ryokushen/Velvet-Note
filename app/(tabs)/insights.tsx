import { useMemo, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { Caption, Serif } from '../../components/ui/text';
import { IconChevronRight } from '../../components/ui/Icon';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { useWearsQuery } from '../../hooks/useWears';
import { buildJournalInsights } from '../../lib/insights';
import {
  complimentLeaderboard,
  currentStreak,
  longestStreak,
  seasonalSignatures,
} from '../../lib/wearAnalytics';
import {
  costPerWear,
  formatCostPerWear,
  isOwnedStatus,
  shelfValueByCurrency,
} from '../../lib/bottleEconomics';
import { SEASON_LABELS, formatCurrency } from '../../lib/journal';
import { todayLocalDate } from '../../lib/todayWear';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MIN_WEARS_FOR_VALUE = 3;

export default function Insights() {
  const router = useRouter();
  const fragrances = useFragrancesQuery();
  const wears = useWearsQuery();
  const loading = fragrances.isLoading || wears.isLoading;
  const error = fragrances.error || wears.error;
  const hasAnyData = (fragrances.data?.length ?? 0) > 0 || (wears.data?.length ?? 0) > 0;

  const wearData = useMemo(() => wears.data ?? [], [wears.data]);
  const fragranceData = useMemo(() => fragrances.data ?? [], [fragrances.data]);
  const insights = useMemo(
    () => buildJournalInsights(fragranceData, wearData),
    [fragranceData, wearData],
  );
  const todayKey = todayLocalDate();
  const wrappedYear = Number(todayKey.slice(0, 4));

  const streakNow = useMemo(() => currentStreak(wearData, todayKey), [wearData, todayKey]);
  const streakBest = useMemo(() => longestStreak(wearData), [wearData]);
  const signatures = useMemo(
    () => seasonalSignatures(wearData, fragranceData),
    [wearData, fragranceData],
  );
  const crowdPleasers = useMemo(
    () => complimentLeaderboard(wearData, fragranceData, 5),
    [wearData, fragranceData],
  );
  const shelfValue = useMemo(() => shelfValueByCurrency(fragranceData), [fragranceData]);
  const bestValues = useMemo(() => {
    const wearCounts = new Map<string, number>();
    wearData.forEach((wear) => {
      wearCounts.set(wear.fragrance_id, (wearCounts.get(wear.fragrance_id) ?? 0) + 1);
    });
    return fragranceData
      .filter((f) => isOwnedStatus(f.bottle_status))
      .map((fragrance) => {
        const count = wearCounts.get(fragrance.id) ?? 0;
        const value = count >= MIN_WEARS_FOR_VALUE ? costPerWear(fragrance.purchase_price, count) : null;
        return value != null ? { fragrance, value } : null;
      })
      .filter((row): row is { fragrance: (typeof fragranceData)[number]; value: number } =>
        Boolean(row),
      )
      .sort((a, b) => a.value - b.value)
      .slice(0, 3);
  }, [fragranceData, wearData]);

  // Derive each unlockable section's rows once so we can both render only the
  // sections that have content and collapse the rest into a single hint line.
  const mostWornRows = insights.mostWorn.filter((row) => row.count > 0).slice(0, 5);
  const neglectedRows = insights.neglected.slice(0, 5);
  const seasonFavoriteRows = insights.favoriteSeasons.slice(0, 4);
  const timeOfDayRows = insights.timeOfDay;
  const tasteRows = insights.topAccords.slice(0, 8);
  const tasteTopScore = tasteRows[0]?.score ?? 0;
  const shelfEconomicsEmpty = shelfValue.length === 0 && bestValues.length === 0;
  const anyLockedSection =
    mostWornRows.length === 0 ||
    neglectedRows.length === 0 ||
    crowdPleasers.length === 0 ||
    signatures.length === 0 ||
    seasonFavoriteRows.length === 0 ||
    timeOfDayRows.length === 0 ||
    shelfEconomicsEmpty ||
    tasteRows.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Serif size={18} style={{ letterSpacing: 0.4 }}>
          Insights
        </Serif>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <EmptyState
          title="Couldn't load insights"
          hint={error instanceof Error ? error.message : 'Unknown error'}
        />
      ) : !hasAnyData ? (
        <EmptyState
          title="No journal data yet."
          hint="Add bottles and log wears to build personal fragrance intelligence."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.titleBlock}>
            <Serif size={30}>Wear intelligence</Serif>
            <Caption style={{ marginTop: 6 }}>
              Built from your shelf, wear history, ratings, notes, and compliments.
            </Caption>
          </View>

          <Pressable
            onPress={() => router.push('/wrapped' as never)}
            accessibilityRole="button"
            accessibilityLabel={`Open your ${wrappedYear} year in scent`}
            style={({ pressed }) => [styles.wrappedCard, pressed && { opacity: 0.8 }]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Caption style={{ marginBottom: 4 }}>Year in review</Caption>
              <Text style={styles.wrappedTitle}>{wrappedYear} — your year in scent</Text>
            </View>
            <IconChevronRight size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.twoColumn}>
            <InsightSection title="Current streak" compact>
              <StatValue value={streakNow} unit={streakNow === 1 ? 'day' : 'days'} />
            </InsightSection>
            <InsightSection title="Longest streak" compact>
              <StatValue value={streakBest} unit={streakBest === 1 ? 'day' : 'days'} />
            </InsightSection>
          </View>

          {mostWornRows.length > 0 ? (
            <InsightSection title="Most worn">
              {mostWornRows.map((row) => (
                <FragranceMetricRow
                  key={row.fragranceId}
                  brand={row.fragrance.brand}
                  name={row.fragrance.name}
                  metric={`${row.count} ${row.count === 1 ? 'wear' : 'wears'}`}
                />
              ))}
            </InsightSection>
          ) : null}

          {neglectedRows.length > 0 ? (
            <InsightSection title="Neglected bottles">
              {neglectedRows.map((row) => (
                <FragranceMetricRow
                  key={row.fragranceId}
                  brand={row.fragrance.brand}
                  name={row.fragrance.name}
                  metric={row.lastWorn ? `Last ${formatShortDate(row.lastWorn)}` : 'Unworn'}
                />
              ))}
            </InsightSection>
          ) : null}

          {crowdPleasers.length > 0 ? (
            <InsightSection title="Crowd-pleasers">
              {crowdPleasers.map((row) => (
                <FragranceMetricRow
                  key={row.fragrance.id}
                  brand={row.fragrance.brand}
                  name={row.fragrance.name}
                  metric={`${row.complimentsPerWear.toFixed(1)}/wear / ${row.totalCompliments} total`}
                />
              ))}
            </InsightSection>
          ) : null}

          {signatures.length > 0 ? (
            <InsightSection title="Seasonal signatures">
              {signatures.map((row) => (
                <FragranceMetricRow
                  key={row.season}
                  brand={SEASON_LABELS[row.season]}
                  name={row.fragrance.name}
                  metric={`${row.wearCount} ${row.wearCount === 1 ? 'wear' : 'wears'}`}
                />
              ))}
            </InsightSection>
          ) : null}

          {seasonFavoriteRows.length > 0 || timeOfDayRows.length > 0 ? (
            <View style={styles.twoColumn}>
              {seasonFavoriteRows.length > 0 ? (
                <InsightSection title="Seasonal favorites" compact>
                  {seasonFavoriteRows.map((row) => (
                    <CountRow key={row.label} label={row.label} count={row.count} />
                  ))}
                </InsightSection>
              ) : null}
              {timeOfDayRows.length > 0 ? (
                <InsightSection title="Day / night" compact>
                  {timeOfDayRows.map((row) => (
                    <CountRow key={row.label} label={row.label} count={row.count} />
                  ))}
                </InsightSection>
              ) : null}
            </View>
          ) : null}

          {!shelfEconomicsEmpty ? (
            <InsightSection title="Shelf economics">
              {[
                ...shelfValue.map((row) => (
                  <CountLabelRow
                    key={`value-${row.currency}`}
                    label={`Shelf value (${row.count} ${row.count === 1 ? 'bottle' : 'bottles'})`}
                    value={formatCurrency(row.total, row.currency) ?? String(row.total)}
                  />
                )),
                ...bestValues.map((row) => (
                  <FragranceMetricRow
                    key={`best-${row.fragrance.id}`}
                    brand={row.fragrance.brand}
                    name={row.fragrance.name}
                    metric={
                      formatCostPerWear(row.value, row.fragrance.purchase_currency ?? 'USD') ?? ''
                    }
                  />
                )),
              ]}
            </InsightSection>
          ) : null}

          {tasteRows.length > 0 ? (
            <InsightSection title="Taste profile">
              {tasteRows.map((row) => (
                <ProportionRow
                  key={row.label}
                  label={row.label}
                  ratio={tasteTopScore > 0 ? row.score / tasteTopScore : 0}
                />
              ))}
            </InsightSection>
          ) : null}

          {anyLockedSection ? (
            <Text style={styles.lockedHint}>— More views unlock as you log wears</Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InsightSection({
  title,
  compact,
  children,
}: {
  title: string;
  compact?: boolean;
  children: ReactNode;
}) {
  const childArray = Array.isArray(children) ? children.filter(Boolean) : children;
  return (
    <View style={[styles.section, compact && styles.sectionCompact]}>
      <Caption style={{ marginBottom: 12 }}>{title}</Caption>
      <View style={styles.rowStack}>{childArray}</View>
    </View>
  );
}

function ProportionRow({ label, ratio }: { label: string; ratio: number }) {
  const percent = Math.round(ratio * 100);
  return (
    <View style={styles.proportionRow}>
      <View style={styles.proportionHeader}>
        <Text style={styles.countLabel}>{label}</Text>
        <Text style={styles.proportionPercent}>{percent}%</Text>
      </View>
      <View style={styles.proportionTrack}>
        <View style={[styles.proportionFill, { width: `${Math.max(2, percent)}%` }]} />
      </View>
    </View>
  );
}

function FragranceMetricRow({
  brand,
  name,
  metric,
}: {
  brand: string;
  name: string;
  metric: string;
}) {
  return (
    <View style={styles.metricRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Caption style={{ marginBottom: 3 }}>{brand}</Caption>
        <Text style={styles.metricName} numberOfLines={1}>{name}</Text>
      </View>
      <Text style={styles.metricValue}>{metric}</Text>
    </View>
  );
}

function StatValue({ value, unit }: { value: number; unit: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function CountLabelRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.countRow}>
      <Text style={styles.countLabel}>{label}</Text>
      <Text style={styles.countValueText}>{value}</Text>
    </View>
  );
}

function CountRow({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.countRow}>
      <Text style={styles.countLabel}>{label}</Text>
      <Text style={styles.countValue}>{count}</Text>
    </View>
  );
}

function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: 52,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  titleBlock: {
    marginBottom: 4,
  },
  section: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 14,
  },
  sectionCompact: {
    flex: 1,
    minWidth: 0,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  rowStack: {
    gap: 10,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricName: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 16,
  },
  metricValue: {
    ...typography.bodyDim,
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'right',
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  countLabel: {
    ...typography.bodyDim,
    color: colors.text,
    fontSize: 13,
  },
  countValue: {
    fontFamily: typography.serif,
    color: colors.accent,
    fontSize: 17,
  },
  countValueText: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 15,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statNumber: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
  },
  statUnit: {
    ...typography.bodyDim,
    color: colors.textDim,
    fontSize: 12,
  },
  wrappedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 16,
  },
  wrappedTitle: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 18,
  },
  lockedHint: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  proportionRow: {
    gap: 6,
  },
  proportionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  proportionPercent: {
    ...typography.bodyDim,
    color: colors.textDim,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  proportionTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
    overflow: 'hidden',
  },
  proportionFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
