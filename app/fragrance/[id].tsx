import { useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useFragrancesQuery,
  useUpdateFragrance,
  useDeleteFragrance,
} from '../../hooks/useFragrances';
import { RatingSlider } from '../../components/RatingSlider';
import { AccordChips } from '../../components/AccordChips';
import { ConcentrationPicker } from '../../components/ConcentrationPicker';
import type { Concentration } from '../../types/fragrance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data } = useFragrancesQuery();
  const fragrance = useMemo(() => data?.find((f) => f.id === id), [data, id]);
  const update = useUpdateFragrance();
  const del = useDeleteFragrance();

  const [editing, setEditing] = useState(false);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [concentration, setConcentration] = useState<Concentration | null>(null);
  const [accords, setAccords] = useState<string[]>([]);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (!fragrance) return;
    setBrand(fragrance.brand);
    setName(fragrance.name);
    setConcentration(fragrance.concentration);
    setAccords(fragrance.accords);
    setRating(fragrance.rating ?? 5);
  }, [fragrance?.id]);

  if (!fragrance) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  async function save() {
    if (!brand.trim() || !name.trim()) {
      Alert.alert('Missing fields', 'Brand and name are required.');
      return;
    }
    try {
      await update.mutateAsync({
        id: fragrance!.id,
        input: {
          brand: brand.trim(),
          name: name.trim(),
          concentration,
          accords,
          rating,
        },
      });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? 'Unknown error');
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete fragrance',
      `Remove ${fragrance!.brand} ${fragrance!.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await del.mutateAsync(fragrance!.id);
              router.replace('/(tabs)' as never);
            } catch (e: any) {
              Alert.alert('Could not delete', e.message ?? 'Unknown error');
            }
          },
        },
      ],
    );
  }

  if (editing) {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
        <Text style={styles.fieldLabel}>Brand</Text>
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} />
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <ConcentrationPicker value={concentration} onChange={setConcentration} />
        <AccordChips value={accords} onChange={setAccords} />
        <RatingSlider value={rating} onChange={setRating} />

        <Pressable style={styles.primary} onPress={save} disabled={update.isPending}>
          {update.isPending ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.primaryText}>Save changes</Text>
          )}
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => setEditing(false)}>
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={styles.brand}>{fragrance.brand}</Text>
      <Text style={styles.name}>{fragrance.name}</Text>
      {fragrance.concentration ? (
        <Text style={styles.conc}>{fragrance.concentration}</Text>
      ) : null}

      <View style={styles.ratingRow}>
        <Text style={styles.fieldLabel}>Rating</Text>
        <Text style={styles.rating}>
          {fragrance.rating != null ? fragrance.rating.toFixed(1) : '—'}
        </Text>
      </View>

      {fragrance.accords.length > 0 && (
        <>
          <Text style={styles.fieldLabel}>Accords</Text>
          <View style={styles.chips}>
            {fragrance.accords.map((a) => (
              <View key={a} style={styles.chip}>
                <Text style={styles.chipText}>{a}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Pressable style={styles.primary} onPress={() => setEditing(true)}>
        <Text style={styles.primaryText}>Edit</Text>
      </Pressable>
      <Pressable style={styles.danger} onPress={confirmDelete}>
        <Text style={styles.dangerText}>Delete</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  brand: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  name: { ...typography.display, color: colors.text, marginBottom: spacing.xs },
  conc: { ...typography.bodyDim, color: colors.textDim, marginBottom: spacing.lg },
  ratingRow: { marginVertical: spacing.md },
  rating: { ...typography.title, color: colors.accent },
  fieldLabel: { ...typography.caption, color: colors.textDim, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.bodyDim, color: colors.text },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  primaryText: { ...typography.body, color: colors.text, fontWeight: '500' },
  secondary: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondaryText: { ...typography.bodyDim, color: colors.textDim },
  danger: {
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  dangerText: { ...typography.body, color: colors.error },
});
