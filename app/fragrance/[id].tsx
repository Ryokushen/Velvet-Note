import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
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
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFragrancesQuery,
  useUpdateFragrance,
  useDeleteFragrance,
} from '../../hooks/useFragrances';
import { useCreateWear, useFragranceWearsQuery, useSetActiveWear } from '../../hooks/useWears';
import { AccordChips } from '../../components/AccordChips';
import { ConcentrationPicker } from '../../components/ConcentrationPicker';
import { RatingDots } from '../../components/ui/RatingDots';
import { RatingNumeral } from '../../components/ui/RatingNumeral';
import { NotesRows } from '../../components/ui/NotesRows';
import { GhostButton, PrimaryButton } from '../../components/ui/Button';
import { Caption, Serif } from '../../components/ui/text';
import { SectionDivider } from '../../components/ui/SectionDivider';
import { IconChevronLeft, IconTrash } from '../../components/ui/Icon';
import { BottleArt } from '../../components/BottleArt';
import {
  CollectionDetailMorph,
  fallbackRowRect,
  runCollectionDetailMorph,
} from '../../components/CollectionDetailMorph';
import { pickPersonalFragrancePhoto, uploadPersonalFragrancePhoto } from '../../lib/fragrancePhotos';
import { formatLastWornLong, latestWearForFragrance } from '../../lib/lastWorn';
import {
  COLLECTION_DETAIL_EASING,
  COLLECTION_DETAIL_MORPH_DURATION_MS,
  DETAIL_CONTENT_FADE_DELAY_MS,
} from '../../lib/morphTransition';
import type { Concentration } from '../../types/fragrance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';
import { cancelAnimation, useSharedValue } from 'react-native-reanimated';
import { formatAccordList } from '../../lib/accordDisplay';
import {
  BOTTLE_STATUSES,
  PREFERRED_TIMES_OF_DAY,
  SEASONS,
  type BottleStatus,
  type PreferredTimeOfDay,
  type Season,
} from '../../types/fragrance';
import type { WearTimeOfDay } from '../../types/wear';
import {
  BOTTLE_STATUS_LABELS,
  PREFERRED_TIME_LABELS,
  SEASON_LABELS,
  WEAR_TIME_LABELS,
  formatCurrency,
  formatMl,
  seasonForDate,
} from '../../lib/journal';

export default function Detail() {
  const { id, fromCollection } = useLocalSearchParams<{ id: string; fromCollection?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { data } = useFragrancesQuery();
  const fragrance = useMemo(() => data?.find((f) => f.id === id), [data, id]);
  const fragranceId = fragrance?.id;
  const fragranceBrand = fragrance?.brand;
  const fragranceName = fragrance?.name;
  const fragranceConcentration = fragrance?.concentration;
  const fragranceAccords = fragrance?.accords;
  const fragranceRating = fragrance?.rating;
  const fragrancePersonalImageUrl =
    fragrance?.personal_image_url === undefined
      ? fragrance?.image_url
      : fragrance.personal_image_url;
  const update = useUpdateFragrance();
  const del = useDeleteFragrance();
  const wears = useFragranceWearsQuery(fragranceId);
  const createWear = useCreateWear();
  const setActiveWear = useSetActiveWear();

  const [editing, setEditing] = useState(false);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [concentration, setConcentration] = useState<Concentration | null>(null);
  const [accords, setAccords] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [bottleStatus, setBottleStatus] = useState<BottleStatus | null>(null);
  const [bottleSizeMl, setBottleSizeMl] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseSource, setPurchaseSource] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseCurrency, setPurchaseCurrency] = useState('USD');
  const [preferredSeasons, setPreferredSeasons] = useState<Season[]>([]);
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<PreferredTimeOfDay | null>(null);
  const [photoUploadPending, setPhotoUploadPending] = useState(false);
  const [wearNotes, setWearNotes] = useState('');
  const [wearSeason, setWearSeason] = useState<Season | null>(() => seasonForDate(todayLocalDate()));
  const [wearTimeOfDay, setWearTimeOfDay] = useState<WearTimeOfDay | null>(null);
  const [wearOccasion, setWearOccasion] = useState('');
  const [complimentCount, setComplimentCount] = useState(0);
  const [complimentNote, setComplimentNote] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [closingToCollection, setClosingToCollection] = useState(false);
  const cameFromCollection = fromCollection === '1';
  const contentOpacity = useRef(new Animated.Value(cameFromCollection ? 0 : 1)).current;
  const closeProgress = useSharedValue(0);
  const closeFrame = useRef<number | null>(null);
  const allowRouteRemoval = useRef(false);

  const startClosingMorph = useCallback((onComplete: () => void) => {
    if (closeFrame.current != null) {
      cancelAnimationFrame(closeFrame.current);
      closeFrame.current = null;
    }
    setClosingToCollection(true);
    contentOpacity.setValue(0);
    cancelAnimation(closeProgress);
    closeProgress.value = 0;
    closeFrame.current = requestAnimationFrame(() => {
      closeFrame.current = null;
      runCollectionDetailMorph(closeProgress, onComplete);
    });
  }, [closeProgress, contentOpacity]);

  useEffect(() => {
    if (!fragranceId) return;
    setBrand(fragranceBrand ?? '');
    setName(fragranceName ?? '');
    setConcentration(fragranceConcentration ?? null);
    setAccords(fragranceAccords ?? []);
    setRating(fragranceRating ?? 0);
    setImageUrl(fragrancePersonalImageUrl ?? '');
    setBottleStatus(fragrance.bottle_status ?? null);
    setBottleSizeMl(fragrance.bottle_size_ml != null ? String(fragrance.bottle_size_ml) : '');
    setPurchaseDate(fragrance.purchase_date ?? '');
    setPurchaseSource(fragrance.purchase_source ?? '');
    setPurchasePrice(fragrance.purchase_price != null ? String(fragrance.purchase_price) : '');
    setPurchaseCurrency(fragrance.purchase_currency ?? 'USD');
    setPreferredSeasons(fragrance.preferred_seasons ?? []);
    setPreferredTimeOfDay(fragrance.preferred_time_of_day ?? null);
  }, [
    fragranceId,
    fragranceBrand,
    fragranceName,
    fragranceConcentration,
    fragranceAccords,
    fragranceRating,
    fragrancePersonalImageUrl,
    fragrance,
  ]);

  useEffect(() => {
    return () => {
      if (closeFrame.current != null) {
        cancelAnimationFrame(closeFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!fragranceId || editing) return;
    contentOpacity.setValue(cameFromCollection ? 0 : 1);
    if (cameFromCollection) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        delay: DETAIL_CONTENT_FADE_DELAY_MS,
        duration: COLLECTION_DETAIL_MORPH_DURATION_MS - DETAIL_CONTENT_FADE_DELAY_MS,
        easing: Easing.bezier(...COLLECTION_DETAIL_EASING),
        useNativeDriver: true,
      }).start();
    }
  }, [cameFromCollection, contentOpacity, editing, fragranceId]);

  useEffect(() => {
    if (!cameFromCollection) return undefined;

    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowRouteRemoval.current || editing || closingToCollection) {
        return;
      }

      event.preventDefault();
      startClosingMorph(() => {
        allowRouteRemoval.current = true;
        navigation.dispatch(event.data.action);
      });
    });

    return unsubscribe;
  }, [cameFromCollection, closingToCollection, editing, navigation, startClosingMorph]);

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
    const parsedBottleSize = parseOptionalNumber(bottleSizeMl);
    const parsedPurchasePrice = parseOptionalNumber(purchasePrice);
    if (parsedBottleSize === undefined || parsedPurchasePrice === undefined) {
      Alert.alert('Check numbers', 'Bottle size and purchase price must be valid numbers.');
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
          image_url: imageUrl.trim() ? imageUrl.trim() : null,
          bottle_status: bottleStatus,
          bottle_size_ml: parsedBottleSize,
          purchase_date: purchaseDate.trim() ? purchaseDate.trim() : null,
          purchase_source: purchaseSource.trim() ? purchaseSource.trim() : null,
          purchase_price: parsedPurchasePrice,
          purchase_currency: purchaseCurrency.trim() || 'USD',
          preferred_seasons: preferredSeasons.length > 0 ? preferredSeasons : null,
          preferred_time_of_day: preferredTimeOfDay,
        },
      });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? 'Unknown error');
    }
  }

  async function attachPhoto() {
    if (!fragranceId) return;
    setPhotoUploadPending(true);
    try {
      const selectedPhoto = await pickPersonalFragrancePhoto();
      if (!selectedPhoto) {
        return;
      }
      const uploadedUrl = await uploadPersonalFragrancePhoto(selectedPhoto, fragranceId);
      setImageUrl(uploadedUrl);
    } catch (e: any) {
      Alert.alert('Could not attach photo', e.message ?? 'Unknown error');
    } finally {
      setPhotoUploadPending(false);
    }
  }

  function goBackToCollection() {
    if (cameFromCollection && !closingToCollection) {
      startClosingMorph(() => {
        allowRouteRemoval.current = true;
        finishBackToCollection();
      });
      return;
    }
    finishBackToCollection();
  }

  function finishBackToCollection() {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/' as never);
  }

  function confirmDelete() {
    setConfirmingDelete(true);
  }

  async function removeFromShelf() {
    try {
      await del.mutateAsync(fragrance!.id);
      setConfirmingDelete(false);
      router.replace('/' as never);
    } catch (e: any) {
      Alert.alert('Could not delete', e.message ?? 'Unknown error');
    }
  }

  function resetWearLogForm() {
    setWearNotes('');
    setWearSeason(seasonForDate(todayLocalDate()));
    setWearTimeOfDay(null);
    setWearOccasion('');
    setComplimentCount(0);
    setComplimentNote('');
  }

  async function logWearToday() {
    if (!fragranceId) return;
    let createdWear: { id: string };
    try {
      createdWear = await createWear.mutateAsync({
        fragrance_id: fragranceId,
        worn_on: todayLocalDate(),
        notes: wearNotes.trim() ? wearNotes.trim() : null,
        season: wearSeason,
        time_of_day: wearTimeOfDay,
        occasion: wearOccasion.trim() ? wearOccasion.trim() : null,
        compliment_count: complimentCount,
        compliment_note: complimentNote.trim() ? complimentNote.trim() : null,
      });
    } catch (e: any) {
      Alert.alert('Could not log wear', e.message ?? 'Unknown error');
      return;
    }

    try {
      await setActiveWear.mutateAsync(createdWear.id);
    } catch {
      resetWearLogForm();
      Alert.alert('Wear logged', 'The wear was saved, but could not be made current.');
      return;
    }

    resetWearLogForm();
    Alert.alert('Wear logged', `${fragrance!.brand} ${fragrance!.name} was added to today's wear history.`);
  }

  if (editing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setEditing(false)} style={styles.headerAction}>
            <Text style={styles.headerText}>Cancel</Text>
          </Pressable>
          <Caption tone="dim">Editing</Caption>
          <Pressable
            onPress={save}
            style={styles.headerAction}
            disabled={update.isPending || photoUploadPending}
          >
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
            <View style={styles.photoEditRow}>
              <BottleArt imageUrl={imageUrl.trim() || null} width={64} height={82} />
              <View style={styles.photoEditField}>
                <GhostButton
                  onPress={attachPhoto}
                  loading={photoUploadPending}
                  style={styles.photoAttachButton}
                >
                  Attach photo
                </GhostButton>
                <EditField
                  label="Photo URL"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="Paste an image link"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>
            <ConcentrationPicker value={concentration} onChange={setConcentration} />
            <AccordChips value={accords} onChange={setAccords} />
            <View>
              <Caption style={{ marginBottom: 10 }}>Rating</Caption>
              <RatingDots value={rating} onChange={setRating} />
            </View>
            <View style={styles.editGroup}>
              <Caption style={{ marginBottom: 10 }}>Bottle</Caption>
              <OptionPills
                values={BOTTLE_STATUSES}
                labels={BOTTLE_STATUS_LABELS}
                selected={bottleStatus}
                onSelect={(value) => setBottleStatus(value === bottleStatus ? null : value)}
              />
              <EditField
                label="Bottle size (ml)"
                value={bottleSizeMl}
                onChangeText={setBottleSizeMl}
                keyboardType="decimal-pad"
                placeholder="100"
              />
              <EditField
                label="Purchase date"
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
              />
              <EditField
                label="Purchase source"
                value={purchaseSource}
                onChangeText={setPurchaseSource}
                placeholder="Store, seller, or gift"
              />
              <View style={styles.priceRow}>
                <View style={{ flex: 1 }}>
                  <EditField
                    label="Purchase price"
                    value={purchasePrice}
                    onChangeText={setPurchasePrice}
                    keyboardType="decimal-pad"
                    placeholder="125"
                  />
                </View>
                <View style={styles.currencyField}>
                  <EditField
                    label="Currency"
                    value={purchaseCurrency}
                    onChangeText={setPurchaseCurrency}
                    autoCapitalize="characters"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>
            <View style={styles.editGroup}>
              <Caption style={{ marginBottom: 10 }}>Wear profile</Caption>
              <MultiOptionPills
                values={SEASONS}
                labels={SEASON_LABELS}
                selected={preferredSeasons}
                onToggle={(value) => {
                  setPreferredSeasons((current) =>
                    current.includes(value)
                      ? current.filter((season) => season !== value)
                      : [...current, value],
                  );
                }}
              />
              <OptionPills
                values={PREFERRED_TIMES_OF_DAY}
                labels={PREFERRED_TIME_LABELS}
                selected={preferredTimeOfDay}
                onSelect={(value) =>
                  setPreferredTimeOfDay(value === preferredTimeOfDay ? null : value)
                }
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const since = fragrance.created_at ? formatMonthYear(fragrance.created_at) : null;
  const lastWear = latestWearForFragrance(wears.data, fragrance.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={goBackToCollection}
          style={styles.headerAction}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to collection"
        >
          <IconChevronLeft size={22} />
        </Pressable>
        <View />
        <View style={styles.headerActions}>
          <Pressable
            onPress={confirmDelete}
            style={styles.iconHeaderAction}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${fragrance.name} from shelf`}
          >
            <IconTrash size={18} color={colors.error} />
          </Pressable>
          <Pressable onPress={() => setEditing(true)} style={styles.headerAction}>
            <Text style={styles.headerText}>Edit</Text>
          </Pressable>
        </View>
      </View>
      {confirmingDelete ? (
        <View style={styles.deleteConfirm}>
          <Text style={styles.deleteConfirmTitle}>Remove from shelf?</Text>
          <Text style={styles.deleteConfirmBody}>
            Remove {fragrance.brand} {fragrance.name}?
          </Text>
          <View style={styles.deleteConfirmActions}>
            <GhostButton
              onPress={() => setConfirmingDelete(false)}
              disabled={del.isPending}
              style={styles.deleteConfirmButton}
            >
              Cancel
            </GhostButton>
            <GhostButton
              danger
              onPress={removeFromShelf}
              loading={del.isPending}
              style={styles.deleteConfirmButton}
            >
              Remove
            </GhostButton>
          </View>
        </View>
      ) : null}
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
          </View>
          <View
            testID="detail-hero-image"
            style={[styles.heroImage, closingToCollection && styles.heroImageClosing]}
          >
            <BottleArt imageUrl={fragrance.image_url} width={176} height={228} />
          </View>
          {fragrance.concentration ? (
            <View style={styles.metaRow}>
              <Caption>{fragrance.concentration}</Caption>
            </View>
          ) : null}

          <Animated.View
            testID="detail-delayed-content"
            style={{ opacity: contentOpacity }}
          >
          {lastWear ? (
            <View style={styles.lastWornPanel}>
              <Caption style={{ marginBottom: 6 }}>Last worn</Caption>
              <Text style={styles.lastWornValue}>{formatLastWornLong(lastWear.worn_on)}</Text>
            </View>
          ) : null}

          <View style={{ marginBottom: 40 }}>
            <RatingNumeral value={fragrance.rating} />
          </View>

          <SectionDivider />

          {hasBottleMetadata(fragrance) ? (
            <>
              <JournalMetadataSection
                title="Bottle"
                rows={buildBottleRows(fragrance)}
              />
              <SectionDivider marginVertical={24} />
            </>
          ) : null}

          {hasWearProfile(fragrance) ? (
            <>
              <JournalMetadataSection
                title="Wear profile"
                rows={buildWearProfileRows(fragrance)}
              />
              <SectionDivider marginVertical={24} />
            </>
          ) : null}

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

          {hasCatalogMetadata(fragrance) ? (
            <>
              <SectionDivider marginVertical={24} />
              <CatalogProfile
                releaseYear={fragrance.catalog_release_year}
                perfumers={fragrance.catalog_perfumers ?? []}
                notesTop={fragrance.catalog_notes_top ?? []}
                notesMiddle={fragrance.catalog_notes_middle ?? []}
                notesBase={fragrance.catalog_notes_base ?? []}
              />
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
          <Caption style={{ marginBottom: 10 }}>Season</Caption>
          <OptionPills
            values={SEASONS}
            labels={SEASON_LABELS}
            selected={wearSeason}
            onSelect={(value) => setWearSeason(value === wearSeason ? null : value)}
          />
          <Caption style={{ marginBottom: 10, marginTop: 14 }}>Time</Caption>
          <OptionPills
            values={['day', 'night'] as WearTimeOfDay[]}
            labels={WEAR_TIME_LABELS}
            selected={wearTimeOfDay}
            onSelect={(value) => setWearTimeOfDay(value === wearTimeOfDay ? null : value)}
          />
          <TextInput
            value={wearOccasion}
            onChangeText={setWearOccasion}
            placeholder="Occasion"
            placeholderTextColor={colors.textMuted}
            style={styles.singleLineInput}
          />
          <View style={styles.complimentRow}>
            <Caption>Compliments</Caption>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setComplimentCount((value) => Math.max(0, value - 1))}
                style={styles.stepperButton}
                accessibilityLabel="Decrease compliment count"
              >
                <Text style={styles.stepperText}>-</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{complimentCount}</Text>
              <Pressable
                onPress={() => setComplimentCount((value) => value + 1)}
                style={styles.stepperButton}
                accessibilityLabel="Increase compliment count"
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>
          </View>
          <TextInput
            value={complimentNote}
            onChangeText={setComplimentNote}
            placeholder="Compliment note"
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.notesInput}
          />
          <PrimaryButton loading={createWear.isPending || setActiveWear.isPending} onPress={logWearToday}>
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
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      {closingToCollection ? (
        <CollectionDetailMorph
          closing
          fragrance={fragrance}
          origin={fallbackRowRect()}
          progress={closeProgress}
        />
      ) : null}
    </SafeAreaView>
  );
}

function CatalogProfile({
  releaseYear,
  perfumers,
  notesTop,
  notesMiddle,
  notesBase,
}: {
  releaseYear: number | null;
  perfumers: string[];
  notesTop: string[];
  notesMiddle: string[];
  notesBase: string[];
}) {
  const metaItems = [
    releaseYear ? { label: 'Year', value: String(releaseYear) } : null,
    perfumers.length > 0 ? { label: 'Perfumer', value: perfumers.join(', ') } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <View>
      <Caption style={{ marginBottom: 14 }}>Catalog profile</Caption>
      {metaItems.length > 0 ? (
        <View style={styles.catalogStats}>
          {metaItems.map((item) => (
            <View key={item.label} style={styles.catalogStat}>
              <Caption tone="muted">{item.label}</Caption>
              <Text style={styles.catalogStatValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {notesTop.length || notesMiddle.length || notesBase.length ? (
        <View style={styles.catalogPyramid}>
          <CatalogNoteRow label="Top" notes={notesTop} />
          <CatalogNoteRow label="Heart" notes={notesMiddle} />
          <CatalogNoteRow label="Base" notes={notesBase} />
        </View>
      ) : null}
    </View>
  );
}

function CatalogNoteRow({ label, notes }: { label: string; notes: string[] }) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <View style={styles.catalogNoteRow}>
      <Caption tone="muted" style={styles.catalogNoteLabel}>{label}</Caption>
      <Text style={styles.catalogNoteText}>{formatAccordList(notes)}</Text>
    </View>
  );
}

function hasCatalogMetadata(fragrance: {
  catalog_release_year: number | null;
  catalog_perfumers: string[] | null;
  catalog_notes_top: string[] | null;
  catalog_notes_middle: string[] | null;
  catalog_notes_base: string[] | null;
}): boolean {
  return Boolean(
    fragrance.catalog_release_year ||
    (fragrance.catalog_perfumers?.length ?? 0) > 0 ||
    (fragrance.catalog_notes_top?.length ?? 0) > 0 ||
    (fragrance.catalog_notes_middle?.length ?? 0) > 0 ||
    (fragrance.catalog_notes_base?.length ?? 0) > 0,
  );
}

function hasBottleMetadata(fragrance: {
  bottle_status?: BottleStatus | null;
  bottle_size_ml?: number | null;
  purchase_date?: string | null;
  purchase_source?: string | null;
  purchase_price?: number | null;
}): boolean {
  return Boolean(
    fragrance.bottle_status ||
    fragrance.bottle_size_ml ||
    fragrance.purchase_date ||
    fragrance.purchase_source ||
    fragrance.purchase_price != null,
  );
}

function hasWearProfile(fragrance: {
  preferred_seasons?: Season[] | null;
  preferred_time_of_day?: PreferredTimeOfDay | null;
}): boolean {
  return Boolean(
    (fragrance.preferred_seasons?.length ?? 0) > 0 ||
    fragrance.preferred_time_of_day,
  );
}

function buildBottleRows(fragrance: {
  bottle_status?: BottleStatus | null;
  bottle_size_ml?: number | null;
  purchase_date?: string | null;
  purchase_source?: string | null;
  purchase_price?: number | null;
  purchase_currency?: string | null;
}) {
  const price = formatCurrency(fragrance.purchase_price, fragrance.purchase_currency ?? 'USD');
  return [
    fragrance.bottle_status
      ? { label: 'Status', value: BOTTLE_STATUS_LABELS[fragrance.bottle_status] }
      : null,
    fragrance.bottle_size_ml
      ? { label: 'Size', value: formatMl(fragrance.bottle_size_ml)! }
      : null,
    fragrance.purchase_date
      ? { label: 'Purchased', value: formatReadableDate(fragrance.purchase_date) }
      : null,
    fragrance.purchase_source
      ? { label: 'Source', value: fragrance.purchase_source }
      : null,
    price ? { label: 'Price', value: price } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));
}

function buildWearProfileRows(fragrance: {
  preferred_seasons?: Season[] | null;
  preferred_time_of_day?: PreferredTimeOfDay | null;
}) {
  return [
    fragrance.preferred_seasons?.length
      ? {
          label: 'Seasons',
          value: fragrance.preferred_seasons.map((season) => SEASON_LABELS[season]).join(', '),
        }
      : null,
    fragrance.preferred_time_of_day
      ? {
          label: 'Best time',
          value: PREFERRED_TIME_LABELS[fragrance.preferred_time_of_day],
        }
      : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));
}

function parseOptionalNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatReadableDate(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWearContext(wear: {
  season?: Season | null;
  time_of_day?: WearTimeOfDay | null;
  occasion?: string | null;
  compliment_count?: number | null;
}): string {
  const parts = [
    wear.season ? SEASON_LABELS[wear.season] : null,
    wear.time_of_day ? WEAR_TIME_LABELS[wear.time_of_day] : null,
    wear.occasion,
    wear.compliment_count ? `${wear.compliment_count} compliment${wear.compliment_count === 1 ? '' : 's'}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'No context';
}

function WearHistory({
  loading,
  error,
  wears,
}: {
  loading: boolean;
  error: unknown;
  wears: {
    id: string;
    worn_on: string;
    notes: string | null;
    season?: Season | null;
    time_of_day?: WearTimeOfDay | null;
    occasion?: string | null;
    compliment_count?: number | null;
  }[];
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
            <Text style={styles.wearContext}>
              {formatWearContext(wear)}
            </Text>
            {wear.notes ? <Text style={styles.wearNote}>{wear.notes}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function JournalMetadataSection({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.journalSection}>
      <Caption style={{ marginBottom: 14 }}>{title}</Caption>
      <View style={styles.journalGrid}>
        {rows.map((row) => (
          <View key={row.label} style={styles.journalCell}>
            <Caption tone="muted">{row.label}</Caption>
            <Text style={styles.journalValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function OptionPills<T extends string>({
  values,
  labels,
  selected,
  onSelect,
}: {
  values: readonly T[];
  labels: Record<T, string>;
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.pillWrap}>
      {values.map((value) => {
        const active = selected === value;
        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={[styles.optionPill, active && styles.optionPillActive]}
          >
            <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>
              {labels[value]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MultiOptionPills<T extends string>({
  values,
  labels,
  selected,
  onToggle,
}: {
  values: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <View style={styles.pillWrap}>
      {values.map((value) => {
        const active = selected.includes(value);
        return (
          <Pressable
            key={value}
            onPress={() => onToggle(value)}
            style={[styles.optionPill, active && styles.optionPillActive]}
          >
            <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>
              {labels[value]}
            </Text>
          </Pressable>
        );
      })}
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
        accessibilityLabel={label}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconHeaderAction: {
    padding: 8,
  },
  deleteConfirm: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  deleteConfirmTitle: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.text,
    marginBottom: 6,
  },
  deleteConfirmBody: {
    ...typography.bodyDim,
    color: colors.textDim,
    marginBottom: 14,
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteConfirmButton: {
    flex: 1,
    height: 44,
  },
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
    marginBottom: 16,
  },
  heroText: {
    minWidth: 0,
  },
  heroImage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 28,
  },
  heroImageClosing: {
    opacity: 0,
  },
  photoEditRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  photoEditField: {
    flex: 1,
    minWidth: 0,
  },
  photoAttachButton: {
    height: 44,
    marginBottom: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 16, marginBottom: 32 },
  lastWornPanel: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 30,
  },
  lastWornValue: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.text,
  },
  catalogDescription: {
    ...typography.body,
    color: colors.textDim,
    lineHeight: 22,
  },
  journalSection: {
    marginBottom: 4,
  },
  journalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  journalCell: {
    minWidth: '46%',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  journalValue: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
  },
  catalogStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  catalogStat: {
    minWidth: '46%',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  catalogStatValue: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
  },
  catalogPyramid: {
    gap: 12,
  },
  catalogNoteRow: {
    flexDirection: 'row',
    gap: 14,
  },
  catalogNoteLabel: {
    width: 54,
    paddingTop: 1,
  },
  catalogNoteText: {
    flex: 1,
    ...typography.body,
    color: colors.textDim,
    lineHeight: 21,
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
  wearContext: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
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
  singleLineInput: {
    height: 46,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
    marginTop: 14,
    marginBottom: 12,
  },
  editGroup: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  currencyField: {
    width: 92,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  optionPillActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
  },
  optionPillText: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  optionPillTextActive: {
    color: colors.text,
  },
  complimentRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  stepperButton: {
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    color: colors.text,
    fontSize: 18,
  },
  stepperValue: {
    minWidth: 32,
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.serif,
    fontSize: 18,
  },
});
