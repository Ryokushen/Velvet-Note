import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { buildYearHeatmap } from '../lib/wearAnalytics';
import { tapLight } from '../lib/haptics';
import type { Wear } from '../types/wear';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Caption } from './ui/text';

const CELL = 11;
const CELL_GAP = 3;
const COLUMN_WIDTH = CELL + CELL_GAP;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type WearHeatmapProps = {
  wears: Wear[];
  year: number;
  currentYear?: boolean;
  onSelectDate?: (date: string) => void;
};

export function WearHeatmap({ wears, year, currentYear = false, onSelectDate }: WearHeatmapProps) {
  const scrollRef = useRef<ScrollView>(null);
  const { weeks, maxCount, totalWears } = buildYearHeatmap(wears, year);

  const monthLabelForColumn = (columnIndex: number): string | null => {
    const firstDay = weeks[columnIndex]?.find((day) => day != null);
    if (!firstDay) return null;
    const month = Number(firstDay.date.slice(5, 7));
    const dayOfMonth = Number(firstDay.date.slice(8, 10));
    if (columnIndex === 0) return MONTH_LABELS[month - 1] ?? null;
    return dayOfMonth <= 7 && weekStartsMonth(weeks, columnIndex, month)
      ? MONTH_LABELS[month - 1] ?? null
      : null;
  };

  return (
    <View style={styles.wrap} testID="wear-heatmap">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => {
          if (currentYear) {
            scrollRef.current?.scrollToEnd({ animated: false });
          }
        }}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          <View style={styles.monthRow}>
            {weeks.map((_, columnIndex) => {
              const label = monthLabelForColumn(columnIndex);
              return (
                <View key={`month-${columnIndex}`} style={styles.monthSlot}>
                  {label ? <Text style={styles.monthLabel}>{label}</Text> : null}
                </View>
              );
            })}
          </View>
          <View style={styles.grid}>
            {weeks.map((week, columnIndex) => (
              <View key={`week-${columnIndex}`} style={styles.weekColumn}>
                {week.map((day, dayIndex) => {
                  const cellStyles = [
                    styles.cell,
                    day ? cellStyle(day.count, maxCount) : styles.cellPad,
                  ];
                  if (day && onSelectDate) {
                    return (
                      <Pressable
                        key={day.date}
                        onPress={() => {
                          tapLight();
                          onSelectDate(day.date);
                        }}
                        hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                        accessibilityRole="button"
                        accessibilityLabel={`${day.date} — ${day.count} ${
                          day.count === 1 ? 'wear' : 'wears'
                        }`}
                        style={cellStyles}
                      />
                    );
                  }
                  return (
                    <View
                      key={day ? day.date : `pad-${columnIndex}-${dayIndex}`}
                      style={cellStyles}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Caption>
          {totalWears} {totalWears === 1 ? 'wear' : 'wears'} in {year}
        </Caption>
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Less</Text>
          {[0, 0.33, 0.66, 1].map((intensity) => (
            <View
              key={intensity}
              style={[
                styles.cell,
                intensity === 0
                  ? styles.cellEmpty
                  : { backgroundColor: colors.accent, opacity: 0.3 + 0.7 * intensity },
              ]}
            />
          ))}
          <Text style={styles.legendLabel}>More</Text>
        </View>
      </View>
    </View>
  );
}

function weekStartsMonth(
  weeks: ReturnType<typeof buildYearHeatmap>['weeks'],
  columnIndex: number,
  month: number,
): boolean {
  const previous = weeks[columnIndex - 1]?.find((day) => day != null);
  if (!previous) return true;
  return Number(previous.date.slice(5, 7)) !== month;
}

function cellStyle(count: number, maxCount: number) {
  if (count === 0 || maxCount === 0) return styles.cellEmpty;
  const intensity = count / maxCount;
  return { backgroundColor: colors.accent, opacity: 0.3 + 0.7 * intensity };
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  monthRow: {
    flexDirection: 'row',
    height: 16,
    marginBottom: 4,
  },
  monthSlot: {
    width: COLUMN_WIDTH,
    overflow: 'visible',
  },
  monthLabel: {
    ...typography.bodyDim,
    fontSize: 10,
    color: colors.textDim,
    width: COLUMN_WIDTH * 4,
  },
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekColumn: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 2,
  },
  cellEmpty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  cellPad: {
    backgroundColor: 'transparent',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendLabel: {
    ...typography.bodyDim,
    fontSize: 11,
    color: colors.textDim,
    marginHorizontal: 4,
  },
});
