import { useState, useMemo } from 'react';
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
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { FragranceRow } from '../../components/FragranceRow';
import { EmptyState } from '../../components/EmptyState';
import { filterFragrances, sortFragrances, type SortMode } from '../../lib/filters';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Caption, Serif } from '../../components/ui/text';
import { IconSearch, IconX, IconLogOut } from '../../components/ui/Icon';

export default function Collection() {
  const { data, isLoading, error, refetch, isRefetching } = useFragrancesQuery();
  const [query, setQuery] = useState('');
  const [sortMode] = useState<SortMode>('rating');
  const router = useRouter();

  const visible = useMemo(() => {
    if (!data) return [];
    return sortFragrances(filterFragrances(data, query), sortMode);
  }, [data, query, sortMode]);

  const count = data?.length ?? 0;
  const favorites = data?.filter((f) => (f.rating ?? 0) >= 8).length ?? 0;
  const isEmpty = !isLoading && !error && count === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerSide} />
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
                  fragrance={item}
                  onPress={() => router.push(`/fragrance/${item.id}` as never)}
                  withImage
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
    </SafeAreaView>
  );
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
