import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottleArt } from '../components/BottleArt';
import { EmptyState } from '../components/EmptyState';
import { Caption, Serif } from '../components/ui/text';
import { IconChevronLeft, IconChevronRight } from '../components/ui/Icon';
import { useFragrancesQuery } from '../hooks/useFragrances';
import { useWearsQuery } from '../hooks/useWears';
import { buildWrapped, type WrappedStats } from '../lib/wearAnalytics';
import { formatCostPerWear } from '../lib/bottleEconomics';
import { tapLight } from '../lib/haptics';
import { durations, easeOut, useReducedMotion } from '../lib/motion';
import { SEASON_LABELS } from '../lib/journal';
import { todayLocalDate } from '../lib/todayWear';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function Wrapped() {
  const router = useRouter();
  const fragrances = useFragrancesQuery();
  const wears = useWearsQuery();
  const currentYear = Number(todayLocalDate().slice(0, 4));
  const [year, setYear] = useState(currentYear);

  const stats = useMemo(
    () => buildWrapped(wears.data ?? [], fragrances.data ?? [], year),
    [wears.data, fragrances.data, year],
  );

  const earliestYear = useMemo(() => {
    const years = (wears.data ?? []).map((wear) => Number(wear.worn_on.slice(0, 4)));
    return years.length > 0 ? Math.min(...years) : currentYear;
  }, [wears.data, currentYear]);

  const reduceMotion = useReducedMotion();
  // Staggered reveal per section so the screen lands like a wrapped story
  // rather than appearing all at once. Fully disabled under reduced motion.
  const reveal = (index: number) =>
    reduceMotion
      ? undefined
      : FadeInDown.duration(durations.base)
          .delay(index * 70)
          .easing(easeOut);

  async function handleShare() {
    if (!stats) return;
    tapLight();
    try {
      await Share.share({ message: buildShareMessage(stats, year) });
    } catch {
      // A dismissed or failed share sheet is not an error worth surfacing.
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerAction}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to insights"
        >
          <IconChevronLeft size={22} />
        </Pressable>
        <Caption tone="dim">Year in review</Caption>
        <View style={styles.headerAction} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.yearRow}>
            <Pressable
              onPress={() => setYear((y) => Math.max(earliestYear, y - 1))}
              disabled={year <= earliestYear}
              hitSlop={8}
              style={[styles.yearButton, year <= earliestYear && styles.yearButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Previous year"
            >
              <IconChevronLeft size={18} color={colors.textMuted} />
            </Pressable>
            <Serif size={56}>{String(year)}</Serif>
            <Pressable
              onPress={() => setYear((y) => Math.min(currentYear, y + 1))}
              disabled={year >= currentYear}
              hitSlop={8}
              style={[styles.yearButton, year >= currentYear && styles.yearButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Next year"
            >
              <IconChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          </View>
          <Caption>Your year in scent</Caption>
        </View>

        {!stats ? (
          <EmptyState
            title={`Nothing logged in ${year}.`}
            hint="Wears you log will shape next year's story."
          />
        ) : (
          <>
            <Animated.View key={`stat-grid-${year}`} entering={reveal(0)} style={styles.statGrid}>
              <BigStat value={String(stats.totalWears)} label={stats.totalWears === 1 ? 'wear' : 'wears'} />
              <BigStat
                value={String(stats.distinctFragranceCount)}
                label={stats.distinctFragranceCount === 1 ? 'bottle worn' : 'bottles worn'}
              />
              <BigStat value={`${Math.round(stats.estimatedMlUsed)}ml`} label="sprayed away" />
              <BigStat
                value={String(stats.totalCompliments)}
                label={stats.totalCompliments === 1 ? 'compliment' : 'compliments'}
              />
            </Animated.View>

            {stats.mostWorn ? (
              <Animated.View key={`feature-${year}`} entering={reveal(1)} style={styles.featureCard}>
                <Caption style={{ marginBottom: 12 }}>Fragrance of the year</Caption>
                <View style={styles.featureRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Caption style={{ marginBottom: 6 }}>{stats.mostWorn.fragrance.brand}</Caption>
                    <Serif size={26}>{stats.mostWorn.fragrance.name}</Serif>
                    <Text style={styles.featureMetric}>
                      {stats.mostWorn.count} {stats.mostWorn.count === 1 ? 'wear' : 'wears'}
                    </Text>
                  </View>
                  <BottleArt
                    imageUrl={stats.mostWorn.fragrance.image_url}
                    width={88}
                    height={114}
                  />
                </View>
              </Animated.View>
            ) : null}

            <Animated.View key={`detail-${year}`} entering={reveal(2)} style={styles.detailList}>
              {stats.complimentChampion ? (
                <DetailRow
                  label="Compliment champion"
                  value={stats.complimentChampion.fragrance.name}
                  metric={`${stats.complimentChampion.totalCompliments} received`}
                />
              ) : null}
              {stats.topSeason ? (
                <DetailRow
                  label="Season of the year"
                  value={SEASON_LABELS[stats.topSeason.season]}
                  metric={`${stats.topSeason.count} ${stats.topSeason.count === 1 ? 'wear' : 'wears'}`}
                />
              ) : null}
              {stats.busiestMonth ? (
                <DetailRow
                  label="Busiest month"
                  value={MONTH_NAMES[stats.busiestMonth.month - 1] ?? String(stats.busiestMonth.month)}
                  metric={`${stats.busiestMonth.count} ${stats.busiestMonth.count === 1 ? 'wear' : 'wears'}`}
                />
              ) : null}
              {stats.longestStreak > 1 ? (
                <DetailRow
                  label="Longest streak"
                  value={`${stats.longestStreak} days`}
                  metric="in a row"
                />
              ) : null}
              {stats.bestValue ? (
                <DetailRow
                  label="Best value"
                  value={stats.bestValue.fragrance.name}
                  metric={
                    formatCostPerWear(
                      stats.bestValue.costPerWear,
                      stats.bestValue.fragrance.purchase_currency ?? 'USD',
                    ) ?? ''
                  }
                />
              ) : null}
              {stats.bottlesAdded > 0 ? (
                <DetailRow
                  label="New to the shelf"
                  value={`${stats.bottlesAdded} ${stats.bottlesAdded === 1 ? 'bottle' : 'bottles'}`}
                  metric={`added in ${year}`}
                />
              ) : null}
            </Animated.View>

            <Animated.View key={`share-${year}`} entering={reveal(3)}>
              <Pressable
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share your year in scent"
                style={({ pressed }) => [styles.shareButton, pressed && { opacity: 0.75 }]}
              >
                <Text style={styles.shareButtonText}>— Share your year</Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function buildShareMessage(stats: WrappedStats, year: number): string {
  const lines: string[] = [`The Note — my ${year} in scent.`];
  lines.push(
    `${stats.totalWears} ${stats.totalWears === 1 ? 'wear' : 'wears'} across ${
      stats.distinctFragranceCount
    } ${stats.distinctFragranceCount === 1 ? 'bottle' : 'bottles'}.`,
  );
  if (stats.mostWorn) {
    lines.push(
      `Fragrance of the year — ${stats.mostWorn.fragrance.brand} ${stats.mostWorn.fragrance.name} (${
        stats.mostWorn.count
      } ${stats.mostWorn.count === 1 ? 'wear' : 'wears'}).`,
    );
  }
  if (stats.topSeason) {
    lines.push(`Worn most in ${SEASON_LABELS[stats.topSeason.season].toLowerCase()}.`);
  }
  if (stats.totalCompliments > 0) {
    lines.push(
      `${stats.totalCompliments} ${
        stats.totalCompliments === 1 ? 'compliment' : 'compliments'
      } earned along the way.`,
    );
  }
  return lines.join('\n');
}

function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.bigStat}>
      <Text style={styles.bigStatValue}>{value}</Text>
      <Caption>{label}</Caption>
    </View>
  );
}

function DetailRow({ label, value, metric }: { label: string; value: string; metric: string }) {
  return (
    <View style={styles.detailRow}>
      <Caption style={{ marginBottom: 4 }}>{label}</Caption>
      <View style={styles.detailValueRow}>
        <Text style={styles.detailValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.detailMetric}>{metric}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  headerAction: { padding: 6, minWidth: 44 },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  yearButton: {
    padding: 6,
  },
  yearButtonDisabled: {
    opacity: 0.3,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bigStat: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  bigStatValue: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 40,
    lineHeight: 46,
  },
  featureCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  featureMetric: {
    ...typography.bodyDim,
    color: colors.textDim,
    marginTop: spacing.sm,
  },
  detailList: {
    gap: spacing.sm,
  },
  detailRow: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailValue: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 19,
    flexShrink: 1,
  },
  detailMetric: {
    ...typography.bodyDim,
    color: colors.textDim,
    fontSize: 12,
  },
  shareButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    ...typography.caption,
    color: colors.text,
  },
});
