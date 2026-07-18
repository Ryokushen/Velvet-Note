import { forwardRef, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateFragrance, useFragrancesQuery } from '../../hooks/useFragrances';
import {
  findSupabaseCatalogByBarcode,
  notesToAccords,
  searchSupabaseCatalogPage,
  type CatalogFragrance,
} from '../../lib/catalog';
import { notifySuccess, notifyWarning, tapLight } from '../../lib/haptics';
import { AccordChips } from '../../components/AccordChips';
import { ConcentrationPicker } from '../../components/ConcentrationPicker';
import { RatingDots } from '../../components/ui/RatingDots';
import { GhostButton, PrimaryButton } from '../../components/ui/Button';
import { Caption, Serif } from '../../components/ui/text';
import { BottleArt } from '../../components/BottleArt';
import { pickPersonalFragrancePhoto, uploadPersonalFragrancePhoto } from '../../lib/fragrancePhotos';
import { IconCamera } from '../../components/ui/Icon';
import {
  BOTTLE_STATUSES,
  PREFERRED_TIMES_OF_DAY,
  SEASONS,
  type BottleStatus,
  type Concentration,
  type Fragrance,
  type PreferredTimeOfDay,
  type Season,
} from '../../types/fragrance';
import {
  BOTTLE_STATUS_LABELS,
  PREFERRED_TIME_LABELS,
  SEASON_LABELS,
} from '../../lib/journal';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';
import { formatAccordList } from '../../lib/accordDisplay';

type SearchStatus = 'idle' | 'searching' | 'done' | 'error';

const CATALOG_PAGE_SIZE = 25;

type FieldErrors = {
  brand?: string;
  name?: string;
  bottleSizeMl?: string;
  purchasePrice?: string;
  purchaseDate?: string;
};

export default function Add() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode?: string | string[] }>();
  const create = useCreateFragrance();
  const shelf = useFragrancesQuery();
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [concentration, setConcentration] = useState<Concentration | null>(null);
  const [accords, setAccords] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPhotoUrl, setShowPhotoUrl] = useState(false);
  const [bottleStatus, setBottleStatus] = useState<BottleStatus | null>(null);
  const [bottleSizeMl, setBottleSizeMl] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseSource, setPurchaseSource] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseCurrency, setPurchaseCurrency] = useState('USD');
  const [preferredSeasons, setPreferredSeasons] = useState<Season[]>([]);
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<PreferredTimeOfDay | null>(null);
  const [photoUploadPending, setPhotoUploadPending] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogFragrance | null>(null);
  const [catalogResults, setCatalogResults] = useState<CatalogFragrance[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchNonce, setSearchNonce] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const resolvedBarcodeRef = useRef('');
  const barcodeParam = firstParam(params.barcode);

  const nameRef = useRef<TextInput>(null);
  const bottleSizeRef = useRef<TextInput>(null);
  const purchaseDateRef = useRef<TextInput>(null);
  const purchaseSourceRef = useRef<TextInput>(null);
  const purchasePriceRef = useRef<TextInput>(null);
  const currencyRef = useRef<TextInput>(null);

  useEffect(() => {
    let cancelled = false;
    const query = catalogQuery.trim();
    if (query.length < 2) {
      setCatalogResults([]);
      setCatalogTotal(0);
      setLoadingMore(false);
      setSearchStatus('idle');
      return undefined;
    }

    setSearchStatus('searching');
    const handle = setTimeout(() => {
      searchSupabaseCatalogPage(query, { limit: CATALOG_PAGE_SIZE, offset: 0 })
        .then(({ items, totalCount }) => {
          if (!cancelled) {
            // New query resets to page 0 and replaces prior results.
            setCatalogResults(items);
            setCatalogTotal(totalCount);
            setLoadingMore(false);
            setSearchStatus('done');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCatalogResults([]);
            setCatalogTotal(0);
            setLoadingMore(false);
            setSearchStatus('error');
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [catalogQuery, searchNonce]);

  useEffect(() => {
    let cancelled = false;
    if (!barcodeParam || barcodeParam === resolvedBarcodeRef.current) {
      return undefined;
    }

    resolvedBarcodeRef.current = barcodeParam;
    findSupabaseCatalogByBarcode(barcodeParam)
      .then((entry) => {
        if (!cancelled && entry) {
          applyCatalogEntry(entry);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [barcodeParam]);

  function applyCatalogEntry(entry: CatalogFragrance) {
    tapLight();
    setSelectedCatalog(entry);
    setBrand(entry.brand);
    setName(entry.name);
    setConcentration(entry.concentration ?? null);
    setAccords(notesToAccords(entry.notes));
    setPhotoUrl('');
    setCatalogQuery('');
    setCatalogResults([]);
    setCatalogTotal(0);
    setLoadingMore(false);
    setSearchStatus('idle');
    clearError('brand');
    clearError('name');
  }

  async function loadMoreCatalog() {
    if (loadingMore || searchStatus !== 'done') {
      return;
    }
    const query = catalogQuery.trim();
    if (query.length < 2 || catalogResults.length >= catalogTotal) {
      return;
    }

    tapLight();
    setLoadingMore(true);
    try {
      const { items, totalCount } = await searchSupabaseCatalogPage(query, {
        limit: CATALOG_PAGE_SIZE,
        offset: catalogResults.length,
      });
      // Append de-duped by id; server ordering is deterministic but be safe.
      setCatalogResults((current) => {
        const seen = new Set(current.map((entry) => entry.id));
        const next = items.filter((entry) => !seen.has(entry.id));
        return next.length > 0 ? [...current, ...next] : current;
      });
      setCatalogTotal(totalCount);
    } catch {
      // Leave existing results in place; a stalled page keeps the shelf usable.
    } finally {
      setLoadingMore(false);
    }
  }

  function clearError(key: keyof FieldErrors) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function attachPhoto() {
    setPhotoUploadPending(true);
    try {
      const selectedPhoto = await pickPersonalFragrancePhoto();
      if (!selectedPhoto) {
        return;
      }
      const uploadedUrl = await uploadPersonalFragrancePhoto(selectedPhoto, 'new-fragrance');
      setPhotoUrl(uploadedUrl);
    } catch (e: any) {
      Alert.alert('Could not attach photo', e.message ?? 'Unknown error');
    } finally {
      setPhotoUploadPending(false);
    }
  }

  function findDuplicate(): Fragrance | undefined {
    const shelfList = shelf.data ?? [];
    const b = brand.trim().toLowerCase();
    const n = name.trim().toLowerCase();
    return shelfList.find((entry) => {
      if (selectedCatalog?.id && entry.catalog_id === selectedCatalog.id) {
        return true;
      }
      return (
        entry.brand.trim().toLowerCase() === b && entry.name.trim().toLowerCase() === n
      );
    });
  }

  async function submit() {
    const nextErrors: FieldErrors = {};
    if (!brand.trim()) nextErrors.brand = 'Brand is required.';
    if (!name.trim()) nextErrors.name = 'Name is required.';

    const parsedBottleSize = parseOptionalNumber(bottleSizeMl);
    const parsedPurchasePrice = parseOptionalNumber(purchasePrice);
    if (parsedBottleSize === undefined) nextErrors.bottleSizeMl = 'Enter a valid number.';
    if (parsedPurchasePrice === undefined) nextErrors.purchasePrice = 'Enter a valid number.';

    const trimmedDate = purchaseDate.trim();
    if (trimmedDate && !isValidIsoDate(trimmedDate)) {
      nextErrors.purchaseDate = 'Use a real date, YYYY-MM-DD.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      notifyWarning();
      return;
    }
    setErrors({});

    const duplicate = findDuplicate();
    if (duplicate) {
      Alert.alert(
        'Already on your shelf',
        `${duplicate.brand} — ${duplicate.name} is already saved. Add it again anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add anyway',
            style: 'destructive',
            onPress: () => {
              void performCreate(parsedBottleSize as number | null, parsedPurchasePrice as number | null);
            },
          },
        ],
      );
      return;
    }

    await performCreate(parsedBottleSize as number | null, parsedPurchasePrice as number | null);
  }

  async function performCreate(
    parsedBottleSize: number | null,
    parsedPurchasePrice: number | null,
  ) {
    try {
      const created = await create.mutateAsync({
        brand: brand.trim(),
        name: name.trim(),
        concentration,
        accords,
        rating: rating > 0 ? rating : null,
        catalog_id: selectedCatalog?.id ?? null,
        image_url: photoUrl.trim() ? photoUrl.trim() : null,
        catalog_description: selectedCatalog?.description ?? null,
        catalog_source: selectedCatalog?.source ?? null,
        catalog_release_year: selectedCatalog?.releaseYear ?? null,
        catalog_notes_top: selectedCatalog?.notesTop ?? null,
        catalog_notes_middle: selectedCatalog?.notesMiddle ?? null,
        catalog_notes_base: selectedCatalog?.notesBase ?? null,
        catalog_perfumers: selectedCatalog?.perfumers ?? null,
        bottle_status: bottleStatus,
        bottle_size_ml: parsedBottleSize,
        purchase_date: purchaseDate.trim() ? purchaseDate.trim() : null,
        purchase_source: purchaseSource.trim() ? purchaseSource.trim() : null,
        purchase_price: parsedPurchasePrice,
        purchase_currency: purchaseCurrency.trim() || 'USD',
        preferred_seasons: preferredSeasons.length > 0 ? preferredSeasons : null,
        preferred_time_of_day: preferredTimeOfDay,
      });
      notifySuccess();
      const newId = (created as Fragrance | undefined)?.id;
      // Reset in case user comes back to this screen.
      setBrand('');
      setName('');
      setConcentration(null);
      setAccords([]);
      setRating(0);
      setPhotoUrl('');
      setShowPhotoUrl(false);
      setSelectedCatalog(null);
      setBottleStatus(null);
      setBottleSizeMl('');
      setPurchaseDate('');
      setPurchaseSource('');
      setPurchasePrice('');
      setPurchaseCurrency('USD');
      setPreferredSeasons([]);
      setPreferredTimeOfDay(null);
      setErrors({});
      router.replace((newId ? `/fragrance/${newId}` : '/') as never);
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? 'Unknown error');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Serif size={18} style={{ letterSpacing: 0.4 }}>
          Add to shelf
        </Serif>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Caption style={{ marginBottom: 8 }}>Catalog lookup</Caption>
            <Pressable
              onPress={() => router.push('/scan' as never)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.scanButton,
                pressed && { opacity: 0.78 },
              ]}
            >
              <IconCamera size={17} color={colors.text} />
              <Text style={styles.scanButtonText}>Scan barcode</Text>
            </Pressable>
            <TextInput
              value={catalogQuery}
              onChangeText={setCatalogQuery}
              placeholder="Search catalog by bottle, brand, or note"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
            />
            {searchStatus === 'searching' ? (
              <View style={styles.searchStatusRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.searchStatusText}>Searching catalog</Text>
              </View>
            ) : null}
            {searchStatus === 'error' ? (
              <View style={styles.searchStatusRow}>
                <Text style={styles.searchErrorText}>— Catalog search stalled.</Text>
                <Pressable
                  onPress={() => setSearchNonce((n) => n + 1)}
                  accessibilityRole="button"
                  hitSlop={10}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {searchStatus === 'done' && catalogResults.length === 0 ? (
              <Text style={styles.emptyStateText}>
                — No catalog match. Add it by hand below.
              </Text>
            ) : null}
            {catalogResults.length > 0 ? (
              <View style={styles.catalogResultsContent}>
                {catalogResults.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => applyCatalogEntry(entry)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.catalogResult,
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <BottleArt imageUrl={entry.imageUrl} width={44} height={56} />
                    <View style={styles.catalogResultText}>
                      <Caption style={{ marginBottom: 4 }}>{entry.brand}</Caption>
                      <Text style={styles.catalogResultName}>{entry.name}</Text>
                      <CatalogMetaLine entry={entry} />
                      {entry.notes.length > 0 ? (
                        <Text style={styles.catalogResultNotes} numberOfLines={1}>
                          {formatAccordList(entry.notes.slice(0, 4))}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {catalogResults.length > 0 && catalogResults.length < catalogTotal ? (
              <Pressable
                onPress={loadMoreCatalog}
                disabled={loadingMore}
                accessibilityRole="button"
                accessibilityState={{ disabled: loadingMore, busy: loadingMore }}
                hitSlop={8}
                style={styles.loadMoreRow}
              >
                <Text style={styles.loadMoreText}>
                  {`— More results · showing ${catalogResults.length} of ${catalogTotal}`}
                </Text>
                {loadingMore ? (
                  <ActivityIndicator size="small" color={colors.textDim} />
                ) : null}
              </Pressable>
            ) : null}
            {selectedCatalog ? (
              <View style={styles.selectedCatalog}>
                <BottleArt imageUrl={selectedCatalog.imageUrl} width={54} height={70} />
                <View style={styles.catalogResultText}>
                  <Caption style={{ marginBottom: 4 }}>Catalog match</Caption>
                  <Text style={styles.catalogResultName}>{selectedCatalog.name}</Text>
                  <CatalogMetaLine entry={selectedCatalog} />
                  <Text style={styles.catalogResultNotes} numberOfLines={2}>
                    Catalog metadata will be saved with this shelf entry.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
          <Field
            label="Brand"
            value={brand}
            onChangeText={(text) => {
              setBrand(text);
              clearError('brand');
            }}
            placeholder="Who made it"
            autoCapitalize="words"
            error={errors.brand}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => nameRef.current?.focus()}
          />
          <Field
            ref={nameRef}
            label="Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError('name');
            }}
            placeholder="What it's called"
            autoCapitalize="words"
            error={errors.name}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => bottleSizeRef.current?.focus()}
          />
          <View style={styles.photoEditRow}>
            <BottleArt imageUrl={photoUrl.trim() || null} width={64} height={82} />
            <View style={styles.photoEditField}>
              <GhostButton
                onPress={attachPhoto}
                loading={photoUploadPending}
                style={styles.photoAttachButton}
              >
                Attach photo
              </GhostButton>
              {showPhotoUrl ? (
                <Field
                  label="Photo URL"
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  placeholder="Paste an image link"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              ) : (
                <Pressable
                  onPress={() => setShowPhotoUrl(true)}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.disclosure}
                >
                  <Text style={styles.disclosureText}>— Add image by URL</Text>
                </Pressable>
              )}
            </View>
          </View>
          <ConcentrationPicker value={concentration} onChange={setConcentration} />
          <AccordChips value={accords} onChange={setAccords} />
          <View>
            <Caption style={{ marginBottom: 10 }}>Rating</Caption>
            <RatingDots value={rating} onChange={setRating} />
          </View>
          <View style={styles.fieldGroup}>
            <Caption style={{ marginBottom: 10 }}>Bottle</Caption>
            <OptionPills
              values={BOTTLE_STATUSES}
              labels={BOTTLE_STATUS_LABELS}
              selected={bottleStatus}
              onSelect={(value) => setBottleStatus(value === bottleStatus ? null : value)}
            />
            <Field
              ref={bottleSizeRef}
              label="Bottle size (ml)"
              value={bottleSizeMl}
              onChangeText={(text) => {
                setBottleSizeMl(text);
                clearError('bottleSizeMl');
              }}
              placeholder="100"
              keyboardType="decimal-pad"
              error={errors.bottleSizeMl}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => purchaseDateRef.current?.focus()}
            />
            <Field
              ref={purchaseDateRef}
              label="Purchase date"
              value={purchaseDate}
              onChangeText={(text) => {
                setPurchaseDate(text);
                clearError('purchaseDate');
              }}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              error={errors.purchaseDate}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => purchaseSourceRef.current?.focus()}
            />
            <Field
              ref={purchaseSourceRef}
              label="Purchase source"
              value={purchaseSource}
              onChangeText={setPurchaseSource}
              placeholder="Store, seller, or gift"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => purchasePriceRef.current?.focus()}
            />
            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                <Field
                  ref={purchasePriceRef}
                  label="Purchase price"
                  value={purchasePrice}
                  onChangeText={(text) => {
                    setPurchasePrice(text);
                    clearError('purchasePrice');
                  }}
                  placeholder="125"
                  keyboardType="decimal-pad"
                  error={errors.purchasePrice}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => currencyRef.current?.focus()}
                />
              </View>
              <View style={styles.currencyField}>
                <Field
                  ref={currencyRef}
                  label="Currency"
                  value={purchaseCurrency}
                  onChangeText={setPurchaseCurrency}
                  autoCapitalize="characters"
                  maxLength={3}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>
          <View style={styles.fieldGroup}>
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
        <View style={styles.footer}>
          <PrimaryButton loading={create.isPending} disabled={photoUploadPending} onPress={submit}>
            Save to shelf
          </PrimaryButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CatalogMetaLine({ entry }: { entry: CatalogFragrance }) {
  const parts = [
    entry.releaseYear ? String(entry.releaseYear) : null,
    entry.perfumers.length > 0 ? entry.perfumers.slice(0, 2).join(', ') : null,
  ].filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return <Text style={styles.catalogMetaLine}>{parts.join(' · ')}</Text>;
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

const Field = forwardRef<
  TextInput,
  { label: string; error?: string } & React.ComponentProps<typeof TextInput>
>(function Field({ label, error, ...rest }, ref) {
  return (
    <View>
      <Caption style={{ marginBottom: 8 }}>{label}</Caption>
      <TextInput
        ref={ref}
        {...rest}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
});

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
            onPress={() => {
              tapLight();
              onSelect(value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            hitSlop={10}
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
            onPress={() => {
              tapLight();
              onToggle(value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            hitSlop={10}
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

function parseOptionalNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 52,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    fontFamily: typography.serif,
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    ...typography.bodyDim,
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
  },
  scanButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: 10,
  },
  scanButtonText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  searchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  searchStatusText: {
    ...typography.bodyDim,
    color: colors.textDim,
    fontSize: 13,
  },
  searchErrorText: {
    ...typography.bodyDim,
    color: colors.error,
    fontSize: 13,
  },
  retryText: {
    ...typography.caption,
    color: colors.text,
  },
  emptyStateText: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  catalogResultsContent: {
    marginTop: 10,
    gap: 8,
  },
  loadMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    marginTop: 10,
  },
  loadMoreText: {
    ...typography.caption,
    color: colors.textDim,
  },
  catalogResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  catalogResultText: {
    flex: 1,
    minWidth: 0,
  },
  catalogResultName: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.text,
  },
  catalogResultNotes: {
    ...typography.bodyDim,
    color: colors.textDim,
    fontSize: 12,
    marginTop: 4,
  },
  catalogMetaLine: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  selectedCatalog: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    padding: 12,
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
  disclosure: {
    minHeight: 44,
    justifyContent: 'center',
  },
  disclosureText: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 13,
  },
  fieldGroup: {
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
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  optionPillTextActive: {
    color: colors.text,
  },
  footer: {
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
});
