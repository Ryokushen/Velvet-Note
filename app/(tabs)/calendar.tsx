import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { Caption, Serif } from '../../components/ui/text';
import {
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconPlus,
  IconTrash,
} from '../../components/ui/Icon';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import {
  useCreateWear,
  useDeleteWear,
  useUpdateWear,
  useWearsQuery,
} from '../../hooks/useWears';
import type { Fragrance } from '../../types/fragrance';
import type { Wear } from '../../types/wear';
import { colors } from '../../theme/colors';
import { FAMILY, type Family } from '../../theme/families';
import { radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type CalendarMode = 'month' | 'bottle';
type WearBuckets = Map<string, Wear[]>;

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FAMILIES: Family[] = ['woody', 'oriental', 'fresh', 'floral', 'spicy'];

export default function CalendarScreen() {
  const router = useRouter();
  const wears = useWearsQuery();
  const fragrances = useFragrancesQuery();
  const createWear = useCreateWear();
  const updateWear = useUpdateWear();
  const deleteWear = useDeleteWear();
  const [mode, setMode] = useState<CalendarMode>('month');
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => todayLocalDate());
  const [loggingDay, setLoggingDay] = useState(false);
  const [editingWearId, setEditingWearId] = useState<string | null>(null);
  const [pendingDeleteWearId, setPendingDeleteWearId] = useState<string | null>(null);
  const [selectedFragranceId, setSelectedFragranceId] = useState('');
  const [wearNotes, setWearNotes] = useState('');

  const fragranceById = useMemo(() => {
    const map = new Map<string, Fragrance>();
    fragrances.data?.forEach((fragrance) => {
      map.set(fragrance.id, fragrance);
    });
    return map;
  }, [fragrances.data]);

  const monthWears = useMemo(
    () => (wears.data ?? []).filter((wear) => isSameMonth(parseWearDate(wear.worn_on), visibleMonth)),
    [wears.data, visibleMonth],
  );

  const wearBuckets = useMemo(() => groupWearsByDate(monthWears), [monthWears]);
  const bottleCount = useMemo(
    () => new Set(monthWears.map((wear) => wear.fragrance_id)).size,
    [monthWears],
  );
  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const selectedWears = selectedDate ? wearBuckets.get(selectedDate) ?? [] : [];
  const selectedDateObj = selectedDate ? parseWearDate(selectedDate) : null;

  const loading = wears.isLoading || fragrances.isLoading;
  const error = wears.error || fragrances.error;

  function changeMonth(delta: number) {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1);
    setVisibleMonth(next);
    setSelectedDate(isSameMonth(new Date(), next) ? todayLocalDate() : '');
    resetWearEntry();
  }

  function selectDate(dateKey: string) {
    setSelectedDate(dateKey);
    resetWearEntry();
  }

  function resetWearEntry() {
    setLoggingDay(false);
    setEditingWearId(null);
    setPendingDeleteWearId(null);
    setSelectedFragranceId('');
    setWearNotes('');
  }

  function startAddWear() {
    setEditingWearId(null);
    setPendingDeleteWearId(null);
    setSelectedFragranceId('');
    setWearNotes('');
    setLoggingDay(true);
  }

  function startEditWear(wear: Wear) {
    setPendingDeleteWearId(null);
    setEditingWearId(wear.id);
    setSelectedFragranceId(wear.fragrance_id);
    setWearNotes(wear.notes ?? '');
    setLoggingDay(true);
  }

  async function saveSelectedDayWear() {
    if (!selectedDate || !selectedFragranceId) {
      Alert.alert('Choose a bottle', 'Pick a bottle before saving this wear.');
      return;
    }
    const input = {
      fragrance_id: selectedFragranceId,
      worn_on: selectedDate,
      notes: wearNotes.trim() ? wearNotes.trim() : null,
    };
    try {
      if (editingWearId) {
        await updateWear.mutateAsync({ id: editingWearId, input });
      } else {
        await createWear.mutateAsync(input);
      }
      resetWearEntry();
    } catch (e: any) {
      Alert.alert(
        editingWearId ? 'Could not update wear' : 'Could not log wear',
        e.message ?? 'Unknown error',
      );
    }
  }

  async function deleteCalendarWear(wear: Wear) {
    try {
      await deleteWear.mutateAsync(wear.id);
      setPendingDeleteWearId(null);
      if (editingWearId === wear.id) {
        resetWearEntry();
      }
    } catch (e: any) {
      Alert.alert('Could not delete wear', e.message ?? 'Unknown error');
    }
  }

  function confirmDeleteCalendarWear(wear: Wear) {
    setLoggingDay(false);
    setEditingWearId(null);
    setPendingDeleteWearId(wear.id);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Serif size={18} style={{ letterSpacing: 0.4 }}>
          Calendar
        </Serif>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <EmptyState
          title="Couldn't load calendar"
          hint={error instanceof Error ? error.message : 'Unknown error'}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.titleBlock}>
            <View style={styles.monthRow}>
              <Pressable onPress={() => changeMonth(-1)} style={styles.monthButton} hitSlop={8}>
                <IconChevronLeft size={18} color={colors.textMuted} />
              </Pressable>
              <View style={styles.monthTitle}>
                <Serif size={28}>{formatMonthName(visibleMonth)}</Serif>
                <Caption>{String(visibleMonth.getFullYear())}</Caption>
              </View>
              <Pressable onPress={() => changeMonth(1)} style={styles.monthButton} hitSlop={8}>
                <IconChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            </View>
            <Caption style={{ color: colors.textMuted }}>
              {monthWears.length} {monthWears.length === 1 ? 'wear' : 'wears'} / {bottleCount}{' '}
              {bottleCount === 1 ? 'bottle' : 'bottles'}
            </Caption>
            <SegmentedControl value={mode} onChange={setMode} />
          </View>

          {mode === 'month' ? (
            <>
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((weekday, index) => (
                  <Text key={`${weekday}-${index}`} style={styles.weekday}>
                    {weekday}
                  </Text>
                ))}
              </View>

              <View style={styles.grid}>
                {monthCells.map((cell) => {
                  if (!cell.dateKey) {
                    return <View key={cell.key} style={styles.blankCell} />;
                  }
                  const dayWears = wearBuckets.get(cell.dateKey) ?? [];
                  const firstWear = dayWears[0];
                  const isSelected = cell.dateKey === selectedDate;
                  const isToday = cell.dateKey === todayLocalDate();
                  return (
                    <Pressable
                      key={cell.key}
                      onPress={() => selectDate(cell.dateKey)}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          dayWears.length > 0 && styles.dayTextWorn,
                          isToday && styles.dayTextToday,
                        ]}
                      >
                        {cell.day}
                      </Text>
                      {firstWear ? (
                        <View style={styles.wearIndicator}>
                          <View
                            style={[
                              styles.wearDot,
                              { backgroundColor: accentFor(firstWear.fragrance_id) },
                            ]}
                          />
                          {dayWears.length > 1 ? (
                            <Text
                              accessibilityLabel={`${dayWears.length} wears on ${formatMonthDay(parseWearDate(cell.dateKey))}`}
                              style={styles.wearCount}
                            >
                              {dayWears.length}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <View style={styles.wearDotPlaceholder} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {selectedDateObj ? (
                <DayDetail
                  date={selectedDateObj}
                  wears={selectedWears}
                  fragrances={fragrances.data ?? []}
                  fragranceById={fragranceById}
                  logging={loggingDay}
                  editing={Boolean(editingWearId)}
                  selectedFragranceId={selectedFragranceId}
                  notes={wearNotes}
                  saving={createWear.isPending || updateWear.isPending}
                  deleting={deleteWear.isPending}
                  pendingDeleteWearId={pendingDeleteWearId}
                  onAdd={startAddWear}
                  onCancelAdd={resetWearEntry}
                  onCancelDelete={() => setPendingDeleteWearId(null)}
                  onSelectFragrance={setSelectedFragranceId}
                  onChangeNotes={setWearNotes}
                  onSave={saveSelectedDayWear}
                  onEditWear={startEditWear}
                  onDeleteWear={confirmDeleteCalendarWear}
                  onConfirmDeleteWear={deleteCalendarWear}
                  onOpenFragrance={(fragranceId) => router.push(`/fragrance/${fragranceId}` as never)}
                />
              ) : null}
            </>
          ) : (
            <ByBottleView
              fragrances={fragrances.data ?? []}
              wears={monthWears}
              visibleMonth={visibleMonth}
              onOpenFragrance={(fragranceId) => router.push(`/fragrance/${fragranceId}` as never)}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: CalendarMode;
  onChange: (value: CalendarMode) => void;
}) {
  return (
    <View style={styles.segmented}>
      {(['month', 'bottle'] as CalendarMode[]).map((mode) => {
        const selected = value === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {mode === 'month' ? 'Month' : 'By bottle'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DayDetail({
  date,
  wears,
  fragrances,
  fragranceById,
  logging,
  editing,
  selectedFragranceId,
  notes,
  saving,
  deleting,
  pendingDeleteWearId,
  onAdd,
  onCancelAdd,
  onCancelDelete,
  onSelectFragrance,
  onChangeNotes,
  onSave,
  onEditWear,
  onDeleteWear,
  onConfirmDeleteWear,
  onOpenFragrance,
}: {
  date: Date;
  wears: Wear[];
  fragrances: Fragrance[];
  fragranceById: Map<string, Fragrance>;
  logging: boolean;
  editing: boolean;
  selectedFragranceId: string;
  notes: string;
  saving: boolean;
  deleting: boolean;
  pendingDeleteWearId: string | null;
  onAdd: () => void;
  onCancelAdd: () => void;
  onCancelDelete: () => void;
  onSelectFragrance: (fragranceId: string) => void;
  onChangeNotes: (notes: string) => void;
  onSave: () => void;
  onEditWear: (wear: Wear) => void;
  onDeleteWear: (wear: Wear) => void;
  onConfirmDeleteWear: (wear: Wear) => void;
  onOpenFragrance: (fragranceId: string) => void;
}) {
  return (
    <View style={styles.daySheet}>
      <View style={styles.daySheetHeader}>
        <View>
          <Caption>{formatWeekday(date)}</Caption>
          <Serif size={22} style={{ marginTop: 4 }}>
            {formatMonthDay(date)}
          </Serif>
        </View>
        <Pressable
          onPress={onAdd}
          accessibilityLabel="Log wear for selected day"
          style={styles.addDayButton}
          hitSlop={8}
        >
          <IconPlus size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.daySheetBody}>
        {wears.length > 0 ? (
          wears.map((wear) => {
            const fragrance = fragranceById.get(wear.fragrance_id);
            const labelName = fragrance?.name ?? 'Unknown bottle';
            return (
              <View key={wear.id} style={styles.dayWearRow}>
                <View
                  style={[
                    styles.dayWearAccent,
                    { backgroundColor: accentFor(wear.fragrance_id) },
                  ]}
                />
                <Pressable
                  onPress={() => onOpenFragrance(wear.fragrance_id)}
                  style={({ pressed }) => [styles.dayWearMain, pressed && { opacity: 0.75 }]}
                >
                  <Caption style={{ marginBottom: 3 }}>
                    {fragrance?.brand ?? 'Unknown'}
                  </Caption>
                  <Serif size={16} numberOfLines={1}>
                    {labelName}
                  </Serif>
                  {wear.notes ? (
                    <Text style={styles.dayWearNote} numberOfLines={2}>
                      {wear.notes}
                    </Text>
                  ) : null}
                </Pressable>
                {fragrance?.concentration ? (
                  <Caption tone="dim">{fragrance.concentration}</Caption>
                ) : null}
                <View style={styles.dayWearActions}>
                  <Pressable
                    onPress={() => onEditWear(wear)}
                    accessibilityLabel={`Edit wear for ${labelName}`}
                    style={styles.dayWearAction}
                    hitSlop={8}
                  >
                    <IconEdit size={15} color={colors.textMuted} />
                  </Pressable>
                  <Pressable
                    onPress={() => onDeleteWear(wear)}
                    accessibilityLabel={`Delete wear for ${labelName}`}
                    disabled={deleting}
                    style={[styles.dayWearAction, deleting && { opacity: 0.5 }]}
                    hitSlop={8}
                  >
                    <IconTrash size={15} color={colors.textMuted} />
                  </Pressable>
                </View>
                {pendingDeleteWearId === wear.id ? (
                  <View style={styles.deleteWearConfirm}>
                    <Text style={styles.deleteWearTitle}>Delete wear?</Text>
                    <Text style={styles.deleteWearBody}>
                      Remove {labelName} from {formatMonthDay(parseWearDate(wear.worn_on))}?
                    </Text>
                    <View style={styles.deleteWearActions}>
                      <Pressable
                        onPress={onCancelDelete}
                        disabled={deleting}
                        style={styles.deleteWearSecondary}
                      >
                        <Text style={styles.deleteWearSecondaryText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onConfirmDeleteWear(wear)}
                        disabled={deleting}
                        style={[styles.deleteWearPrimary, deleting && { opacity: 0.6 }]}
                      >
                        <Text style={styles.deleteWearPrimaryText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyDay}>Nothing worn.</Text>
        )}
      </View>

      {logging ? (
        <View style={styles.dayEntry}>
          <Caption style={{ marginBottom: 10 }}>{editing ? 'Edit wear' : 'Choose bottle'}</Caption>
          <View style={styles.dayEntryBottleList}>
            {fragrances.map((fragrance) => {
              const selected = fragrance.id === selectedFragranceId;
              return (
                <Pressable
                  key={fragrance.id}
                  onPress={() => onSelectFragrance(fragrance.id)}
                  style={[
                    styles.dayEntryBottle,
                    selected && styles.dayEntryBottleSelected,
                  ]}
                >
                  <Caption style={{ marginBottom: 3 }}>{fragrance.brand}</Caption>
                  <Text style={styles.dayEntryBottleName}>{fragrance.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={notes}
            onChangeText={onChangeNotes}
            placeholder="Optional note"
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.dayEntryNotes}
          />
          <View style={styles.dayEntryActions}>
            <Pressable onPress={onCancelAdd} style={styles.dayEntrySecondary}>
              <Text style={styles.dayEntrySecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={[styles.dayEntryPrimary, saving && { opacity: 0.6 }]}
            >
              <Text style={styles.dayEntryPrimaryText}>{editing ? 'Save changes' : 'Save wear'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ByBottleView({
  fragrances,
  wears,
  visibleMonth,
  onOpenFragrance,
}: {
  fragrances: Fragrance[];
  wears: Wear[];
  visibleMonth: Date;
  onOpenFragrance: (fragranceId: string) => void;
}) {
  const rows = useMemo(
    () => buildBottleRows(fragrances, wears, visibleMonth),
    [fragrances, wears, visibleMonth],
  );

  if (fragrances.length === 0) {
    return (
      <EmptyState
        title="No bottles yet."
        hint="Add bottles to the shelf before tracking what you wear."
      />
    );
  }

  return (
    <View style={styles.bottleList}>
      <View style={styles.bottleIntro}>
        <Serif size={22}>By bottle</Serif>
        <Caption style={{ marginTop: 4 }}>What you have reached for</Caption>
      </View>
      {rows.map((row) => (
        <Pressable
          key={row.fragrance.id}
          onPress={() => onOpenFragrance(row.fragrance.id)}
          style={({ pressed }) => [styles.bottleRow, pressed && { opacity: 0.75 }]}
        >
          <View
            style={[
              styles.bottleAccent,
              { backgroundColor: row.count > 0 ? accentFor(row.fragrance.id) : colors.border },
            ]}
          />
          <View style={styles.bottleMain}>
            <Caption style={{ marginBottom: 3 }}>{row.fragrance.brand}</Caption>
            <Serif size={16} numberOfLines={1} style={{ marginBottom: 6 }}>
              {row.fragrance.name}
            </Serif>
            <Text style={styles.bottleMeta}>
              {row.lastLabel}
              {row.count > 0 ? ` / ${row.count} ${row.count === 1 ? 'wear' : 'wears'}` : ''}
            </Text>
          </View>
          <View style={styles.sparkline}>
            {row.sparkline.map((worn, index) => (
              <View
                key={`${row.fragrance.id}-${index}`}
                style={[
                  styles.spark,
                  {
                    backgroundColor: worn ? accentFor(row.fragrance.id) : colors.border,
                    opacity: worn ? 1 : 0.5,
                  },
                ]}
              />
            ))}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function buildMonthCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDow = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: { key: string; day: number | null; dateKey: string }[] = [];

  for (let i = 0; i < firstDow; i += 1) {
    cells.push({ key: `blank-start-${i}`, day: null, dateKey: '' });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: `${year}-${monthIndex}-${day}`,
      day,
      dateKey: formatDateKey(new Date(year, monthIndex, day)),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `blank-end-${cells.length}`, day: null, dateKey: '' });
  }

  return cells;
}

function buildBottleRows(fragrances: Fragrance[], wears: Wear[], visibleMonth: Date) {
  const byBottle = new Map<string, Wear[]>();
  wears.forEach((wear) => {
    const list = byBottle.get(wear.fragrance_id) ?? [];
    list.push(wear);
    byBottle.set(wear.fragrance_id, list);
  });

  const range = lastTenDaysInMonth(visibleMonth);

  return fragrances
    .map((fragrance) => {
      const bottleWears = byBottle.get(fragrance.id) ?? [];
      const sorted = [...bottleWears].sort((a, b) => b.worn_on.localeCompare(a.worn_on));
      const last = sorted[0]?.worn_on ?? null;
      const wornDates = new Set(bottleWears.map((wear) => wear.worn_on));
      return {
        fragrance,
        count: bottleWears.length,
        last,
        lastLabel: last ? formatLastWorn(last, visibleMonth) : 'Unworn this month',
        sparkline: range.map((dateKey) => wornDates.has(dateKey)),
      };
    })
    .sort((a, b) => {
      if (a.last && b.last) return b.last.localeCompare(a.last);
      if (a.last) return -1;
      if (b.last) return 1;
      return a.fragrance.brand.localeCompare(b.fragrance.brand);
    });
}

function groupWearsByDate(wears: Wear[]): WearBuckets {
  const buckets: WearBuckets = new Map();
  wears.forEach((wear) => {
    const list = buckets.get(wear.worn_on) ?? [];
    list.push(wear);
    buckets.set(wear.worn_on, list);
  });
  buckets.forEach((list) => {
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  });
  return buckets;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function todayLocalDate(): string {
  return formatDateKey(new Date());
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseWearDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function isSameMonth(date: Date, month: Date): boolean {
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

function formatMonthName(date: Date): string {
  return date.toLocaleString('en-US', { month: 'long' });
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function formatLastWorn(dateKey: string, visibleMonth: Date): string {
  const date = parseWearDate(dateKey);
  if (isSameMonth(new Date(), visibleMonth)) {
    const today = parseWearDate(todayLocalDate());
    const diff = Math.round((today.getTime() - date.getTime()) / 86_400_000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff > 1) return `${diff} days ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function lastTenDaysInMonth(month: Date): string[] {
  const today = new Date();
  const isCurrent = isSameMonth(today, month);
  const endDay = isCurrent
    ? today.getDate()
    : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startDay = Math.max(1, endDay - 9);
  const keys: string[] = [];

  for (let day = startDay; day <= endDay; day += 1) {
    keys.push(formatDateKey(new Date(month.getFullYear(), month.getMonth(), day)));
  }

  while (keys.length < 10) {
    keys.unshift('');
  }

  return keys;
}

function accentFor(fragranceId: string): string {
  let hash = 0;
  for (let i = 0; i < fragranceId.length; i += 1) {
    hash = (hash + fragranceId.charCodeAt(i)) % FAMILIES.length;
  }
  return FAMILY[FAMILIES[hash]].dot;
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
  scroll: {
    paddingBottom: 32,
  },
  titleBlock: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  monthTitle: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  monthButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    height: 40,
    marginTop: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.surfaceElevated,
  },
  segmentText: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '500',
    color: colors.textMuted,
  },
  segmentTextSelected: {
    color: colors.text,
  },
  weekdayRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  grid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  blankCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dayCellSelected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
  },
  dayText: {
    fontFamily: typography.serif,
    fontSize: 15,
    color: colors.textMuted,
  },
  dayTextWorn: {
    color: colors.text,
  },
  dayTextToday: {
    color: colors.accent,
  },
  wearDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  wearIndicator: {
    minHeight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  wearCount: {
    fontSize: 9,
    lineHeight: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  wearDotPlaceholder: {
    width: 6,
    height: 6,
  },
  daySheet: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  daySheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addDayButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySheetBody: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 12,
    gap: 12,
  },
  dayWearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
  },
  dayWearAccent: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  dayWearMain: {
    flex: 1,
    minWidth: 0,
  },
  dayWearNote: {
    ...typography.bodyDim,
    color: colors.textDim,
    fontSize: 12,
    marginTop: 4,
  },
  dayWearActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayWearAction: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteWearConfirm: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  deleteWearTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  deleteWearBody: {
    ...typography.bodyDim,
    color: colors.textDim,
    fontSize: 13,
    marginBottom: 12,
  },
  deleteWearActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  deleteWearSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  deleteWearSecondaryText: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  deleteWearPrimary: {
    borderRadius: radius.sm,
    backgroundColor: colors.error,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  deleteWearPrimaryText: {
    fontSize: 12,
    color: colors.background,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  emptyDay: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 13,
  },
  dayEntry: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 16,
  },
  dayEntryBottleList: {
    gap: 8,
  },
  dayEntryBottle: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dayEntryBottleSelected: {
    borderColor: colors.accent,
  },
  dayEntryBottleName: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.text,
  },
  dayEntryNotes: {
    minHeight: 68,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    textAlignVertical: 'top',
  },
  dayEntryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  dayEntrySecondary: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dayEntrySecondaryText: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dayEntryPrimary: {
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dayEntryPrimaryText: {
    fontSize: 12,
    color: colors.background,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  bottleList: {
    paddingTop: 8,
  },
  bottleIntro: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  bottleRow: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bottleAccent: {
    width: 3,
    height: 44,
    borderRadius: 2,
  },
  bottleMain: {
    flex: 1,
    minWidth: 0,
  },
  bottleMeta: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  sparkline: {
    flexDirection: 'row',
    gap: 2,
  },
  spark: {
    width: 4,
    height: 16,
    borderRadius: 1,
  },
});
