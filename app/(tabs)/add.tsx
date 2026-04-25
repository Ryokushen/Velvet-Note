import { useEffect, useRef, useState } from 'react';
import {
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
import { useCreateFragrance } from '../../hooks/useFragrances';
import {
  findSupabaseCatalogByBarcode,
  notesToAccords,
  searchSupabaseCatalog,
  type CatalogFragrance,
} from '../../lib/catalog';
import { AccordChips } from '../../components/AccordChips';
import { ConcentrationPicker } from '../../components/ConcentrationPicker';
import { RatingDots } from '../../components/ui/RatingDots';
import { GhostButton, PrimaryButton } from '../../components/ui/Button';
import { Caption, Serif } from '../../components/ui/text';
import { BottleArt } from '../../components/BottleArt';
import { pickPersonalFragrancePhoto, uploadPersonalFragrancePhoto } from '../../lib/fragrancePhotos';
import { IconCamera } from '../../components/ui/Icon';
import type { Concentration } from '../../types/fragrance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';
import { formatAccordList } from '../../lib/accordDisplay';

export default function Add() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode?: string | string[] }>();
  const create = useCreateFragrance();
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [concentration, setConcentration] = useState<Concentration | null>(null);
  const [accords, setAccords] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploadPending, setPhotoUploadPending] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogFragrance | null>(null);
  const [catalogResults, setCatalogResults] = useState<CatalogFragrance[]>([]);
  const resolvedBarcodeRef = useRef('');
  const barcodeParam = firstParam(params.barcode);

  useEffect(() => {
    let cancelled = false;
    const query = catalogQuery.trim();
    if (query.length < 2) {
      setCatalogResults([]);
      return undefined;
    }

    searchSupabaseCatalog(query, 20)
      .then((results) => {
        if (!cancelled) {
          setCatalogResults(results);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogResults([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [catalogQuery]);

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
    setSelectedCatalog(entry);
    setBrand(entry.brand);
    setName(entry.name);
    setConcentration(entry.concentration ?? null);
    setAccords(notesToAccords(entry.notes));
    setPhotoUrl('');
    setCatalogQuery('');
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

  async function submit() {
    if (!brand.trim() || !name.trim()) {
      Alert.alert('Missing fields', 'Brand and name are required.');
      return;
    }
    try {
      await create.mutateAsync({
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
      });
      // Reset in case user comes back to this screen.
      setBrand('');
      setName('');
      setConcentration(null);
      setAccords([]);
      setRating(0);
      setPhotoUrl('');
      setSelectedCatalog(null);
      router.replace('/' as never);
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
            {catalogResults.length > 0 ? (
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={styles.catalogResults}
                contentContainerStyle={styles.catalogResultsContent}
              >
                {catalogResults.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => applyCatalogEntry(entry)}
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
              </ScrollView>
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
            onChangeText={setBrand}
            placeholder="Who made it"
            autoCapitalize="words"
          />
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="What it's called"
            autoCapitalize="words"
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
              <Field
                label="Photo URL"
                value={photoUrl}
                onChangeText={setPhotoUrl}
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

function Field({
  label,
  ...rest
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Caption style={{ marginBottom: 8 }}>{label}</Caption>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
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
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  catalogResults: {
    marginTop: 10,
    maxHeight: 430,
  },
  catalogResultsContent: {
    gap: 8,
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
  footer: {
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
});
