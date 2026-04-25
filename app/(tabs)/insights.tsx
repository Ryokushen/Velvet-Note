import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { Caption, Serif } from '../../components/ui/text';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { useWearsQuery } from '../../hooks/useWears';
import { buildJournalInsights } from '../../lib/insights';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function Insights() {
  const fragrances = useFragrancesQuery();
  const wears = useWearsQuery();
  const loading = fragrances.isLoading || wears.isLoading;
  const error = fragrances.error || wears.error;
  const insights = buildJournalInsights(fragrances.data ?? [], wears.data ?? []);
  const hasAnyData = (fragrances.data?.length ?? 0) > 0 || (wears.data?.length ?? 0) > 0;

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

          <InsightSection title="Most worn">
            {insights.mostWorn.filter((row) => row.count > 0).slice(0, 5).map((row) => (
              <FragranceMetricRow
                key={row.fragranceId}
                brand={row.fragrance.brand}
                name={row.fragrance.name}
                metric={`${row.count} ${row.count === 1 ? 'wear' : 'wears'}`}
              />
            ))}
          </InsightSection>

          <InsightSection title="Neglected bottles">
            {insights.neglected.slice(0, 5).map((row) => (
              <FragranceMetricRow
                key={row.fragranceId}
                brand={row.fragrance.brand}
                name={row.fragrance.name}
                metric={row.lastWorn ? `Last ${formatShortDate(row.lastWorn)}` : 'Unworn'}
              />
            ))}
          </InsightSection>

          <InsightSection title="Compliment leaders">
            {insights.complimentLeaders.slice(0, 5).map((row) => (
              <FragranceMetricRow
                key={row.fragranceId}
                brand={row.fragrance.brand}
                name={row.fragrance.name}
                metric={`${row.compliments} compliment${row.compliments === 1 ? '' : 's'}`}
              />
            ))}
          </InsightSection>

          <View style={styles.twoColumn}>
            <InsightSection title="Seasonal favorites" compact>
              {insights.favoriteSeasons.slice(0, 4).map((row) => (
                <CountRow key={row.label} label={row.label} count={row.count} />
              ))}
            </InsightSection>
            <InsightSection title="Day / night" compact>
              {insights.timeOfDay.map((row) => (
                <CountRow key={row.label} label={row.label} count={row.count} />
              ))}
            </InsightSection>
          </View>

          <InsightSection title="Taste profile">
            {insights.topAccords.slice(0, 8).map((row) => (
              <CountRow key={row.label} label={row.label} count={Math.round(row.score)} />
            ))}
          </InsightSection>
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
  const isEmpty = Array.isArray(childArray) ? childArray.length === 0 : !childArray;
  return (
    <View style={[styles.section, compact && styles.sectionCompact]}>
      <Caption style={{ marginBottom: 12 }}>{title}</Caption>
      {isEmpty ? (
        <Text style={styles.emptyText}>Log more wears to unlock this view.</Text>
      ) : (
        <View style={styles.rowStack}>{childArray}</View>
      )}
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
  emptyText: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
