import { useState, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFragrancesQuery } from '../../hooks/useFragrances';
import { FragranceRow } from '../../components/FragranceRow';
import { EmptyState } from '../../components/EmptyState';
import { filterFragrances, sortFragrances, type SortMode } from '../../lib/filters';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function Collection() {
  const { data, isLoading, error, refetch, isRefetching } = useFragrancesQuery();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- setQuery used in Task 17
  const [query, setQuery] = useState('');
  const [sortMode] = useState<SortMode>('rating');
  const router = useRouter();

  const visible = useMemo(() => {
    if (!data) return [];
    return sortFragrances(filterFragrances(data, query), sortMode);
  }, [data, query, sortMode]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Couldn't load your collection"
        hint={error instanceof Error ? error.message : 'Unknown error'}
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No fragrances yet" hint="Tap Add to save your first." />;
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={(f) => f.id}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
      renderItem={({ item }) => (
        <FragranceRow
          fragrance={item}
          onPress={() => router.push(`/fragrance/${item.id}` as never)}
        />
      )}
      refreshing={isRefetching}
      onRefresh={refetch}
      style={{ backgroundColor: colors.background }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
