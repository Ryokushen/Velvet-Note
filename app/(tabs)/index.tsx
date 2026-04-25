import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  Pressable,
  StyleSheet,
  type LayoutRectangle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { useWearsQuery } from '../../hooks/useWears';
import { FragranceRow } from '../../components/FragranceRow';
import {
  CollectionDetailMorph,
  fallbackRowRect,
  runCollectionDetailMorph,
  type MorphRect,
} from '../../components/CollectionDetailMorph';
import { EmptyState } from '../../components/EmptyState';
import { filterFragrances, sortFragrances, type SortMode } from '../../lib/filters';
import { formatLastWornShort, latestWearForFragrance } from '../../lib/lastWorn';
import { isAppAdmin } from '../../lib/admin';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Caption, Serif } from '../../components/ui/text';
import { IconSearch, IconX, IconLogOut, IconBook } from '../../components/ui/Icon';
import type { Fragrance } from '../../types/fragrance';
import { cancelAnimation, useSharedValue } from 'react-native-reanimated';

export default function Collection() {
  const { data, isLoading, error, refetch, isRefetching } = useFragrancesQuery();
  const wears = useWearsQuery();
  const [query, setQuery] = useState('');
  const [sortMode] = useState<SortMode>('rating');
  const [showBarcodeReview, setShowBarcodeReview] = useState(false);
  const [morph, setMorph] = useState<{ fragrance: Fragrance; origin: MorphRect } | null>(null);
  const morphProgress = useSharedValue(0);
  const rowLayouts = useRef<Record<string, LayoutRectangle>>({});
  const morphFrame = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    isAppAdmin()
      .then((isAdmin) => {
        if (mounted) {
          setShowBarcodeReview(isAdmin);
        }
      })
      .catch(() => {
        if (mounted) {
          setShowBarcodeReview(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (morphFrame.current != null) {
        cancelAnimationFrame(morphFrame.current);
      }
    };
  }, []);

  const visible = useMemo(() => {
    if (!data) return [];
    return sortFragrances(filterFragrances(data, query), sortMode);
  }, [data, query, sortMode]);

  const count = data?.length ?? 0;
  const favorites = data?.filter((f) => (f.rating ?? 0) >= 8).length ?? 0;
  const isEmpty = !isLoading && !error && count === 0;

  function openFragrance(fragrance: Fragrance) {
    const fallback = fallbackRowRect();
    const layout = rowLayouts.current[fragrance.id];
    startFragranceMorph(
      fragrance,
      layout
        ? {
            x: layout.x,
            y: fallback.y + layout.y,
            width: layout.width || fallback.width,
            height: layout.height || fallback.height,
          }
        : fallback,
    );
  }

  function startFragranceMorph(fragrance: Fragrance, origin: MorphRect) {
    if (morphFrame.current != null) {
      cancelAnimationFrame(morphFrame.current);
      morphFrame.current = null;
    }
    cancelAnimation(morphProgress);
    morphProgress.value = 0;
    setMorph({ fragrance, origin });
    morphFrame.current = requestAnimationFrame(() => {
      morphFrame.current = null;
      runCollectionDetailMorph(morphProgress, () => {
        router.push(`/fragrance/${fragrance.id}?fromCollection=1` as never);
        setMorph(null);
      });
    });
  }

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
              <Serif size={28}>
                {count} {count === 1 ? 'bottle' : 'bottles'}
              </Serif>
              {favorites > 0 && (
                <Caption>
                  {favorites} {favorites === 1 ? 'favorite' : 'favorites'}
                </Caption>
              )}
            </View>
            <SearchField value={query} onChange={setQuery} />
          </View>

          {visible.length === 0 ? (
            <EmptyState title="No matches" hint={`Nothing matched “${query}”.`} />
          ) : (
            <FlatList
              data={visible}
              keyExtractor={(f) => f.id}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item }) => (
                <FragranceRow
                  onLayout={(event) => {
                    rowLayouts.current[item.id] = event.nativeEvent.layout;
                  }}
                  fragrance={item}
                  onPress={() => openFragrance(item)}
                  withImage
                  lastWornLabel={lastWornLabel(wears.data, item.id)}
                  transitioning={morph?.fragrance.id === item.id}
                />
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
      {morph ? (
        <CollectionDetailMorph
          fragrance={morph.fragrance}
          origin={morph.origin}
          progress={morphProgress}
        />
      ) : null}
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
