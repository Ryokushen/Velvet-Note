import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { searchCities, type SavedCity, type WeatherSnapshot } from '../lib/weather';
import { tapLight } from '../lib/haptics';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Caption } from './ui/text';

type WeatherCityRowProps = {
  city: SavedCity | null;
  snapshot: WeatherSnapshot | null;
  onSelectCity: (city: SavedCity) => void;
};

export function WeatherCityRow({ city, snapshot, onSelectCity }: WeatherCityRowProps) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SavedCity[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed || searching) return;
    setSearching(true);
    setError(null);
    try {
      const found = await searchCities(trimmed);
      setResults(found);
      if (found.length === 0) {
        setError('No matching cities found.');
      }
    } catch {
      setError('City search failed. Try again.');
    } finally {
      setSearching(false);
    }
  }

  function pickCity(next: SavedCity) {
    tapLight();
    onSelectCity(next);
    setEditing(false);
    setQuery('');
    setResults([]);
    setError(null);
  }

  if (!editing) {
    return (
      <Pressable
        onPress={() => setEditing(true)}
        accessibilityRole="button"
        accessibilityLabel={city ? 'Change weather city' : 'Add your city for weather-aware picks'}
        style={({ pressed }) => [styles.summaryRow, pressed && { opacity: 0.75 }]}
      >
        <Text style={styles.summaryText}>
          {city
            ? `${city.name}${snapshot ? ` · ${Math.round(snapshot.tempC)}°C` : ''}${
                snapshot && snapshot.precipitationMm > 0 ? ' · rain' : ''
              }`
            : 'Add your city for weather-aware picks'}
        </Text>
        <Text style={styles.summaryAction}>{city ? 'Change' : 'Set'}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.editPanel}>
      <Caption style={{ marginBottom: 8 }}>Weather city</Caption>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={runSearch}
        placeholder="Search a city"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {results.map((result) => (
        <Pressable
          key={`${result.name}-${result.latitude}-${result.longitude}`}
          onPress={() => pickCity(result)}
          accessibilityRole="button"
          accessibilityLabel={`Use ${result.name}${result.region ? `, ${result.region}` : ''}`}
          style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.resultName}>{result.name}</Text>
          {result.region ? <Text style={styles.resultRegion}>{result.region}</Text> : null}
        </Pressable>
      ))}
      <View style={styles.editActions}>
        <Pressable
          onPress={runSearch}
          disabled={searching}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionButton, (pressed || searching) && { opacity: 0.7 }]}
        >
          <Text style={styles.actionText}>{searching ? 'Searching…' : 'Search'}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setEditing(false);
            setError(null);
            setResults([]);
          }}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.actionText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  summaryText: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 12,
    flexShrink: 1,
  },
  summaryAction: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 11,
  },
  editPanel: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: spacing.md,
    ...typography.body,
    fontSize: 14,
  },
  error: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  resultName: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
  },
  resultRegion: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 11,
  },
});
