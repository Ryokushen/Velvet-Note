import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { useWearsQuery } from '../../hooks/useWears';
import { useQuickLogWear } from '../../hooks/useQuickLogWear';
import { FragranceRow } from '../../components/FragranceRow';
import { FragranceGridCell } from '../../components/FragranceGridCell';
import { FilterChip } from '../../components/ui/FilterChip';
import { fallbackRowRect } from '../../components/CollectionDetailMorph';
import { openMorph, toMorphLocalRect, type MorphRect } from '../../lib/morphTransition';
import { EmptyState } from '../../components/EmptyState';
import {
  applyCollectionFilters,
  filterFragrances,
  segmentFragrances,
  sortFragrances,
  type CollectionFilter,
  type CollectionSegment,
  type SortMode,
} from '../../lib/filters';
import { formatLastWornShort, latestWearForFragrance } from '../../lib/lastWorn';
import { todayLocalDate } from '../../lib/todayWear';
import { tapLight, tapMedium } from '../../lib/haptics';
import { isAppAdmin } from '../../lib/admin';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Caption, Serif } from '../../components/ui/text';
import {
  IconSearch,
  IconX,
  IconLogOut,
  IconBook,
  IconGrid,
  IconList,
} from '../../components/ui/Icon';
import type { Fragrance } from '../../types/fragrance';

type ViewMode = 'list' | 'grid';

const VIEW_MODE_STORAGE_KEY = 'velvet-note-collection-view';

const SEGMENTS: { key: CollectionSegment; label: string }[] = [
  { key: 'shelf', label: 'Shelf' },
  { key: 'wants', label: 'Wants' },
  { key: 'past', label: 'Past' },
];

export default function Collection() {
  const { data, isLoading, error, refetch, isRefetching } = useFragrancesQuery();
  const wears = useWearsQuery();
  const { quickLog, pendingFragranceId } = useQuickLogWear();
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<CollectionSegment>('shelf');
  const [sortMode, setSortMode] = useState<SortMode>('rating');
  const [filters, setFilters] = useState<CollectionFilter[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showBarcodeReview, setShowBarcodeReview] = useState(false);
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  const justLoggedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRefs = useRef<Record<string, View | null>>({});
  const rowRects = useRef<Record<string, MorphRect>>({});
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    isAppAdmin()
      .then((isAdmin) => {
        if (mounted && isAdmin) {
          setShowBarcodeReview(true);
        }
      })
      .catch(() => undefined);

    AsyncStorage.getItem(VIEW_MODE_STORAGE_KEY)
      .then((stored) => {
        if (mounted && stored === 'grid') {
          setViewMode('grid');
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (justLoggedTimer.current != null) {
        clearTimeout(justLoggedTimer.current);
      }
    };
  }, []);

  const segmentCounts = useMemo(() => {
    return {
      shelf: data ? segmentFragrances(data, 'shelf').length : 0,
      wants: data ? segmentFragrances(data, 'wants').length : 0,
      past: data ? segmentFragrances(data, 'past').length : 0,
    };
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    const segmented = segmentFragrances(data, segment);
    const searched = filterFragrances(segmented, query);
    const filtered =
      segment === 'shelf'
        ? applyCollectionFilters(searched, filters, {
            todayKey: todayLocalDate(),
            wears: wears.data,
          })
        : searched;
    return sortFragrances(filtered, sortMode);
  }, [data, query, segment, filters, sortMode, wears.data]);

  const count = data?.length ?? 0;
  const favorites = data?.filter((f) => (f.rating ?? 0) >= 8).length ?? 0;
  const isEmpty = !isLoading && !error && count === 0;

  function openFragrance(fragrance: Fragrance) {
    measureRowRect(fragrance.id, (origin) => {
      // The morph overlay covers the detail screen while it mounts, so the
      // push happens immediately and the heavy mount hides behind the card.
      openMorph(fragrance, origin, viewMode === 'grid' ? 'grid' : 'row');
      router.push(`/fragrance/${fragrance.id}?fromCollection=1` as never);
    });
  }

  async function handleQuickLog(fragrance: Fragrance) {
    if (segment !== 'shelf' || pendingFragranceId) return;
    tapMedium();
    const result = await quickLog(fragrance);
    if (result === 'logged') {
      if (justLoggedTimer.current != null) {
        clearTimeout(justLoggedTimer.current);
      }
      setJustLoggedId(fragrance.id);
      justLoggedTimer.current = setTimeout(() => {
        justLoggedTimer.current = null;
        setJustLoggedId(null);
      }, 2500);
    }
  }

  function switchSegment(next: CollectionSegment) {
    if (next === segment) return;
    tapLight();
    setSegment(next);
  }

  function toggleFilter(filter: CollectionFilter) {
    tapLight();
    setFilters((current) =>
      current.includes(filter) ? current.filter((f) => f !== filter) : [...current, filter],
    );
  }

  function switchSort(next: SortMode) {
    if (next === sortMode) return;
    tapLight();
    setSortMode(next);
  }

  function toggleViewMode() {
    const next: ViewMode = viewMode === 'list' ? 'grid' : 'list';
    tapLight();
    setViewMode(next);
    AsyncStorage.setItem(VIEW_MODE_STORAGE_KEY, next).catch(() => undefined);
  }

  function measureRowRect(id: string, onMeasured?: (rect: MorphRect) => void) {
    const node = rowRefs.current[id];
    const cached = rowRects.current[id];
    const fallback = cached ?? fallbackRowRect();
    if (!node || typeof node.measureInWindow !== 'function') {
      onMeasured?.(fallback);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      const rect =
        width > 0 && height > 0
          ? toMorphLocalRect(x, y, width, height)
          : fallback;
      if (width > 0 && height > 0) {
        rowRects.current[id] = rect;
      }
      onMeasured?.(rect);
    });
  }

  const titleText =
    segment === 'shelf'
      ? `${segmentCounts.shelf} ${segmentCounts.shelf === 1 ? 'bottle' : 'bottles'}`
      : segment === 'wants'
        ? `${segmentCounts.wants} wanted`
        : `${segmentCounts.past} moved on`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={[styles.headerSide, styles.headerStart]}>
          {showBarcodeReview && (
            <Pressable
              onPress={() => router.push('/barcode-review' as never)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Review barcode submissions"
              style={styles.iconButton}
            >
              <IconBook size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Serif size={18} style={{ letterSpacing: 0.4 }}>
          Collection
        </Serif>
        <View style={styles.headerSide}>
          <Pressable
            onPress={() => supabase.auth.signOut()}
            hitSlop={8}
            style={styles.iconButton}
          >
            <IconLogOut size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <EmptyState
          title="Couldn't load your collection"
          hint={error instanceof Error ? error.message : 'Unknown error'}
        />
      ) : isEmpty ? (
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Serif size={28}>Your shelf</Serif>
          </View>
          <EmptyState
            variant="shelf"
            title="Nothing yet."
            hint="Catalog the bottles on your shelf. Start with the one you reached for this morning."
          />
        </View>
      ) : (
        <>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Serif size={28}>{titleText}</Serif>
              {segment === 'shelf' && favorites > 0 && (
                <Caption>
                  {favorites} {favorites === 1 ? 'favorite' : 'favorites'}
                </Caption>
              )}
            </View>
            <SearchField value={query} onChange={setQuery} />
            <View style={styles.segmentRow}>
              {SEGMENTS.map(({ key, label }) => (
                <FilterChip
                  key={key}
                  label={label}
                  active={segment === key}
                  onPress={() => switchSegment(key)}
                />
              ))}
              <View style={styles.controlsSpacer} />
              <Pressable
                onPress={toggleViewMode}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'
                }
                style={styles.iconButton}
              >
                {viewMode === 'list' ? (
                  <IconGrid size={18} color={colors.textMuted} />
                ) : (
                  <IconList size={18} color={colors.textMuted} />
                )}
              </Pressable>
            </View>
            <View style={styles.filterRow}>
              <FilterChip
                label="Top rated"
                active={sortMode === 'rating'}
                onPress={() => switchSort('rating')}
              />
              <FilterChip
                label="Recent"
                active={sortMode === 'recent'}
                onPress={() => switchSort('recent')}
              />
              {segment === 'shelf' && (
                <>
                  <View style={styles.filterDivider} />
                  <FilterChip
                    label="In season"
                    active={filters.includes('in-season')}
                    onPress={() => toggleFilter('in-season')}
                  />
                  <FilterChip
                    label="Neglected"
                    active={filters.includes('neglected')}
                    onPress={() => toggleFilter('neglected')}
                  />
                </>
              )}
            </View>
          </View>

          {visible.length === 0 ? (
            query.length > 0 ? (
              <EmptyState title="No matches" hint={`Nothing matched “${query}”.`} />
            ) : segment === 'wants' ? (
              <EmptyState
                title="Nothing wanted yet."
                hint="Set a bottle's status to Wishlist and it will wait for you here."
              />
            ) : segment === 'past' ? (
              <EmptyState
                title="Nothing has moved on."
                hint="Bottles marked sold or gifted are archived here."
              />
            ) : (
              <EmptyState title="No matches" hint="Clear the filters to see your shelf." />
            )
          ) : (
            <FlatList
              key={viewMode}
              data={visible}
              keyExtractor={(f) => f.id}
              numColumns={viewMode === 'grid' ? 2 : 1}
              columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
              contentContainerStyle={
                viewMode === 'grid' ? styles.gridContent : { paddingBottom: 32 }
              }
              renderItem={({ item }) => (
                <View
                  ref={(node) => {
                    if (node) rowRefs.current[item.id] = node;
                    else delete rowRefs.current[item.id];
                  }}
                  collapsable={false}
                  onLayout={() => measureRowRect(item.id)}
                  style={viewMode === 'grid' ? styles.gridCellWrap : undefined}
                >
                  {viewMode === 'grid' ? (
                    <FragranceGridCell
                      fragrance={item}
                      onPress={() => openFragrance(item)}
                      onLongPress={
                        segment === 'shelf' ? () => handleQuickLog(item) : undefined
                      }
                      lastWornLabel={
                        segment === 'shelf' ? lastWornLabel(wears.data, item.id) : null
                      }
                      justLogged={justLoggedId === item.id}
                    />
                  ) : (
                    <FragranceRow
                      fragrance={item}
                      onPress={() => openFragrance(item)}
                      onLongPress={
                        segment === 'shelf' ? () => handleQuickLog(item) : undefined
                      }
                      withImage
                      lastWornLabel={
                        segment === 'shelf' ? lastWornLabel(wears.data, item.id) : null
                      }
                      justLogged={justLoggedId === item.id}
                    />
                  )}
                </View>
              )}
              refreshing={isRefetching}
              onRefresh={refetch}
            />
          )}

          {visible.length > 0 && query.length > 0 && (
            <View style={styles.searchFooter}>
              <Caption>
                {visible.length} {visible.length === 1 ? 'result' : 'results'} for “{query}”
              </Caption>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function lastWornLabel(
  wears: ReturnType<typeof useWearsQuery>['data'],
  fragranceId: string,
): string | null {
  const latest = latestWearForFragrance(wears, fragranceId);
  return latest ? formatLastWornShort(latest.worn_on) : null;
}

function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.searchField}>
      <IconSearch size={16} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search your shelf"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.searchInput}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <IconX size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  headerSide: { width: 44, alignItems: 'flex-end' },
  headerStart: { alignItems: 'flex-start' },
  iconButton: { padding: 6 },
  titleBlock: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  controlsSpacer: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderSoft,
    marginHorizontal: 2,
  },
  gridRow: {
    gap: 12,
    paddingHorizontal: 20,
  },
  gridContent: {
    gap: 12,
    paddingBottom: 32,
    paddingTop: 4,
  },
  gridCellWrap: { flex: 1 },
  searchField: {
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    fontSize: 14,
    padding: 0,
  },
  searchFooter: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
});
