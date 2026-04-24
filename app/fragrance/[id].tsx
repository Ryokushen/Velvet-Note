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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFragrancesQuery,
  useUpdateFragrance,
  useDeleteFragrance,
} from '../../hooks/useFragrances';
import { useCreateWear, useFragranceWearsQuery } from '../../hooks/useWears';
import { AccordChips } from '../../components/AccordChips';
import { ConcentrationPicker } from '../../components/ConcentrationPicker';
import { RatingDots } from '../../components/ui/RatingDots';
import { RatingNumeral } from '../../components/ui/RatingNumeral';
import { NotesRows } from '../../components/ui/NotesRows';
import { GhostButton, PrimaryButton } from '../../components/ui/Button';
import { Caption, Serif } from '../../components/ui/text';
import { SectionDivider } from '../../components/ui/SectionDivider';
import { IconChevronLeft } from '../../components/ui/Icon';
import { BottleArt } from '../../components/BottleArt';
import type { Concentration } from '../../types/fragrance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data } = useFragrancesQuery();
  const fragrance = useMemo(() => data?.find((f) => f.id === id), [data, id]);
  const fragranceId = fragrance?.id;
  const fragranceBrand = fragrance?.brand;
  const fragranceName = fragrance?.name;
  const fragranceConcentration = fragrance?.concentration;
  const fragranceAccords = fragrance?.accords;
  const fragranceRating = fragrance?.rating;
  const update = useUpdateFragrance();
  const del = useDeleteFragrance();
  const wears = useFragranceWearsQuery(fragranceId);
  const createWear = useCreateWear();

  const [editing, setEditing] = useState(false);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [concentration, setConcentration] = useState<Concentration | null>(null);
  const [accords, setAccords] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [wearNotes, setWearNotes] = useState('');

  useEffect(() => {
    if (!fragranceId) return;
    setBrand(fragranceBrand ?? '');
    setName(fragranceName ?? '');
    setConcentration(fragranceConcentration ?? null);
    setAccords(fragranceAccords ?? []);
    setRating(fragranceRating ?? 0);
  }, [
    fragranceId,
    fragranceBrand,
    fragranceName,
    fragranceConcentration,
    fragranceAccords,
    fragranceRating,
  ]);

  if (!fragrance) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
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
          rating: rating > 0 ? rating : null,
        },
      });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? 'Unknown error');
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Remove from shelf',
      `Remove ${fragrance!.brand} ${fragrance!.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await del.mutateAsync(fragrance!.id);
              router.replace('/' as never);
            } catch (e: any) {
              Alert.alert('Could not delete', e.message ?? 'Unknown error');
            }
          },
        },
      ],
    );
  }

  async function logWearToday() {
    if (!fragranceId) return;
    try {
      await createWear.mutateAsync({
        fragrance_id: fragranceId,
        worn_on: todayLocalDate(),
        notes: wearNotes.trim() ? wearNotes.trim() : null,
      });
      setWearNotes('');
      Alert.alert('Wear logged', `${fragrance!.brand} ${fragrance!.name} was added to today's wear history.`);
    } catch (e: any) {
      Alert.alert('Could not log wear', e.message ?? 'Unknown error');
    }
  }

  if (editing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setEditing(false)} style={styles.headerAction}>
            <Text style={styles.headerText}>Cancel</Text>
          </Pressable>
          <Caption tone="dim">Editing</Caption>
          <Pressable onPress={save} style={styles.headerAction} disabled={update.isPending}>
            <Text style={[styles.headerText, styles.headerSave]}>Save</Text>
          </Pressable>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.editScroll}
            keyboardShouldPersistTaps="handled"
          >
            <EditField label="Brand" value={brand} onChangeText={setBrand} />
            <EditField label="Name" value={name} onChangeText={setName} serif />
            <ConcentrationPicker value={concentration} onChange={setConcentration} />
            <AccordChips value={accords} onChange={setAccords} />
            <View>
              <Caption style={{ marginBottom: 10 }}>Rating</Caption>
              <RatingDots value={rating} onChange={setRating} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const since = fragrance.created_at ? formatMonthYear(fragrance.created_at) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerAction} hitSlop={8}>
          <IconChevronLeft size={22} />
        </Pressable>
        <View />
        <Pressable onPress={() => setEditing(true)} style={styles.headerAction}>
          <Text style={styles.headerText}>Edit</Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.readScroll}
          keyboardShouldPersistTaps="handled"
        >
          <Caption style={{ marginBottom: 10 }}>{fragrance.brand}</Caption>
          <View style={styles.heroRow}>
            <View style={styles.heroText}>
              <Serif size={34} style={{ marginBottom: 14, lineHeight: 40 }}>
                {fragrance.name}
              </Serif>
            </View>
            <BottleArt imageUrl={fragrance.image_url} width={96} height={124} />
          </View>
          {fragrance.concentration ? (
            <View style={styles.metaRow}>
              <Caption>{fragrance.concentration}</Caption>
            </View>
          ) : null}

          <View style={{ marginBottom: 40 }}>
            <RatingNumeral value={fragrance.rating} />
          </View>

          <SectionDivider />

          <Caption style={{ marginBottom: 20 }}>Notes</Caption>
          <View style={{ marginBottom: 40 }}>
            <NotesRows accords={fragrance.accords} />
          </View>

          {fragrance.catalog_description ? (
            <>
              <SectionDivider marginVertical={24} />
              <Caption style={{ marginBottom: 12 }}>Catalog notes</Caption>
              <Text style={styles.catalogDescription}>{fragrance.catalog_description}</Text>
            </>
          ) : null}

          <SectionDivider marginVertical={24} />

          <View style={styles.wearHeader}>
            <View>
              <Caption style={{ marginBottom: 8 }}>Wear history</Caption>
              <Text style={styles.wearSummary}>{wearSummary(wears.data?.length ?? 0)}</Text>
            </View>
          </View>

          <TextInput
            value={wearNotes}
            onChangeText={setWearNotes}
            placeholder="Optional note for today's wear"
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.notesInput}
          />
          <PrimaryButton loading={createWear.isPending} onPress={logWearToday}>
            Log today
          </PrimaryButton>

          <WearHistory
            loading={wears.isLoading}
            error={wears.error}
            wears={wears.data ?? []}
          />

          {since ? (
            <>
              <SectionDivider marginVertical={24} />
              <Caption style={{ marginBottom: 12 }}>On the shelf since</Caption>
              <Text style={styles.sinceValue}>{since}</Text>
            </>
          ) : null}

          <View style={{ paddingBottom: 48, marginTop: 32 }}>
            <GhostButton danger onPress={confirmDelete} loading={del.isPending}>
              Remove from shelf
            </GhostButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function WearHistory({
  loading,
  error,
  wears,
}: {
  loading: boolean;
  error: unknown;
  wears: { id: string; worn_on: string; notes: string | null }[];
}) {
  if (loading) {
    return (
      <View style={styles.wearState}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.wearEmpty}>Wear history could not be loaded.</Text>;
  }

  if (wears.length === 0) {
    return <Text style={styles.wearEmpty}>No wears logged yet.</Text>;
  }

  return (
    <View style={styles.wearList}>
      {wears.slice(0, 3).map((wear) => (
        <View key={wear.id} style={styles.wearRow}>
          <View>
            <Text style={styles.wearDate}>{formatWearDate(wear.worn_on)}</Text>
            {wear.notes ? <Text style={styles.wearNote}>{wear.notes}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function EditField({
  label,
  serif,
  ...rest
}: { label: string; serif?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Caption style={{ marginBottom: 8 }}>{label}</Caption>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, serif && { fontFamily: typography.serif, fontSize: 17 }]}
      />
    </View>
  );
}

function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function todayLocalDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatWearDate(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function wearSummary(count: number): string {
  if (count === 0) return 'Start tracking when this bottle gets worn.';
  if (count === 1) return '1 wear logged';
  return `${count} wears logged`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
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
  headerText: {
    color: colors.textDim,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  headerSave: { color: colors.accent, textAlign: 'right' },
  readScroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  editScroll: { padding: 20, paddingBottom: 40, gap: 20 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    marginBottom: 14,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 16, marginBottom: 32 },
  catalogDescription: {
    ...typography.body,
    color: colors.textDim,
    lineHeight: 22,
  },
  wearHeader: {
    marginBottom: 14,
  },
  wearSummary: {
    ...typography.bodyDim,
    color: colors.textDim,
  },
  notesInput: {
    minHeight: 76,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  wearState: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wearEmpty: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 18,
  },
  wearList: {
    marginTop: 20,
    gap: 10,
  },
  wearRow: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  wearDate: {
    fontFamily: typography.serif,
    fontSize: 17,
    color: colors.text,
    marginBottom: 4,
  },
  wearNote: {
    ...typography.bodyDim,
    color: colors.textDim,
  },
  sinceValue: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.text,
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
});
