import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  findSupabaseCatalogByBarcode,
  normalizeBarcode,
  searchSupabaseCatalog,
  submitCatalogBarcodeSubmission,
  type CatalogFragrance,
} from '../lib/catalog';
import { notifySuccess, notifyWarning, tapLight } from '../lib/haptics';
import { durations, easeOut, useReducedMotion } from '../lib/motion';
import { BottleArt } from '../components/BottleArt';
import { GhostButton, PrimaryButton } from '../components/ui/Button';
import { Caption, Serif } from '../components/ui/text';
import { IconChevronLeft } from '../components/ui/Icon';
import { colors, withAlpha } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';

type ScanStatus = 'idle' | 'looking' | 'matched' | 'not-found' | 'error';
type LinkStatus = 'idle' | 'searching' | 'done' | 'error';

export default function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const reducedMotion = useReducedMotion();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [match, setMatch] = useState<CatalogFragrance | null>(null);
  const [message, setMessage] = useState('');
  const [linkQuery, setLinkQuery] = useState('');
  const [linkResults, setLinkResults] = useState<CatalogFragrance[]>([]);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('idle');
  const [linkSearchNonce, setLinkSearchNonce] = useState(0);
  const [selectedLink, setSelectedLink] = useState<CatalogFragrance | null>(null);
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkSubmitted, setLinkSubmitted] = useState(false);
  const [linkError, setLinkError] = useState('');
  // A resolved (or in-flight) barcode is locked until the user taps "Scan again",
  // so the camera re-firing every frame does not wipe in-progress linking state.
  const scanLockRef = useRef(false);
  const flash = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    const query = linkQuery.trim();
    if (status !== 'not-found' || linkSubmitted || query.length < 2) {
      setLinkResults([]);
      setLinkStatus('idle');
      return undefined;
    }

    setLinkStatus('searching');
    const handle = setTimeout(() => {
      searchSupabaseCatalog(query, 6)
        .then((results) => {
          if (!cancelled) {
            setLinkResults(results);
            setLinkStatus('done');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLinkResults([]);
            setLinkStatus('error');
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [linkQuery, linkSubmitted, status, linkSearchNonce]);

  useEffect(() => {
    if (status !== 'matched' || reducedMotion) {
      return;
    }
    flash.value = 1;
    flash.value = withTiming(0, { duration: durations.base, easing: easeOut });
  }, [status, reducedMotion, flash]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanLockRef.current || status === 'looking' || status === 'matched') {
      return;
    }
    scanLockRef.current = true;

    const barcode = normalizeBarcode(result.data);
    if (!barcode) {
      setScannedBarcode('');
      setMatch(null);
      setMessage('That code is not a supported UPC/EAN/GTIN barcode.');
      setStatus('error');
      notifyWarning();
      return;
    }

    setScannedBarcode(barcode);
    setMatch(null);
    setMessage('');
    resetLinking();
    setStatus('looking');

    try {
      const catalogMatch = await findSupabaseCatalogByBarcode(barcode);
      setMatch(catalogMatch);
      if (catalogMatch) {
        setStatus('matched');
        notifySuccess();
      } else {
        setStatus('not-found');
        notifyWarning();
      }
    } catch (error: any) {
      setMessage(error.message ?? 'Unknown error');
      setStatus('error');
      notifyWarning();
    }
  }

  function resetScan() {
    scanLockRef.current = false;
    setStatus('idle');
    setScannedBarcode('');
    setMatch(null);
    setMessage('');
    resetLinking();
  }

  function resetLinking() {
    setLinkQuery('');
    setLinkResults([]);
    setLinkStatus('idle');
    setSelectedLink(null);
    setLinkSubmitting(false);
    setLinkSubmitted(false);
    setLinkError('');
  }

  function useMatch() {
    if (!scannedBarcode) return;
    router.replace({
      pathname: '/add',
      params: { barcode: scannedBarcode },
    });
  }

  function goBackToAdd() {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/add' as never);
  }

  async function submitBarcodeLink() {
    if (!selectedLink || !scannedBarcode) {
      return;
    }

    setLinkSubmitting(true);
    setLinkError('');
    try {
      await submitCatalogBarcodeSubmission(scannedBarcode, selectedLink.id);
      setLinkSubmitted(true);
      setLinkResults([]);
      setLinkStatus('idle');
      notifySuccess();
    } catch (error: any) {
      setLinkError(error.message ?? 'Unknown error');
      notifyWarning();
    } finally {
      setLinkSubmitting(false);
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    const blocked = permission.canAskAgain === false;
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onBack={goBackToAdd} />
        <View style={styles.permissionPanel}>
          <Serif size={24} style={{ marginBottom: 10 }}>Camera access</Serif>
          <Text style={styles.bodyText}>
            {blocked
              ? 'Camera access is turned off for Velvet Note. Enable it in Settings to scan barcode labels.'
              : 'Camera access is needed to scan barcode labels.'}
          </Text>
          {blocked ? (
            <PrimaryButton onPress={() => Linking.openSettings()}>Open Settings</PrimaryButton>
          ) : (
            <PrimaryButton onPress={requestPermission}>Allow camera</PrimaryButton>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onBack={goBackToAdd} />
      <View style={styles.cameraFrame}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'itf14'],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.scrimBlock} />
            <View style={styles.scrimRow}>
              <View style={styles.scrimBlock} />
              <View style={styles.reticle}>
                <View style={styles.reticleBorder} />
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <Animated.View style={[styles.reticleFlash, flashStyle]} />
              </View>
              <View style={styles.scrimBlock} />
            </View>
            <View style={styles.scrimBlock} />
          </View>
        </CameraView>
      </View>

      <ScrollView
        style={styles.resultPanel}
        contentContainerStyle={styles.resultPanelContent}
        keyboardShouldPersistTaps="handled"
      >
        {status === 'idle' ? (
          <>
            <Caption style={{ marginBottom: 8 }}>Ready</Caption>
            <Text style={styles.bodyText}>Center the UPC or EAN on the box label.</Text>
          </>
        ) : null}

        {status === 'looking' ? (
          <View style={styles.lookupRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.bodyText}>Looking up {scannedBarcode}</Text>
          </View>
        ) : null}

        {status === 'matched' && match ? (
          <>
            <Caption style={{ marginBottom: 10 }}>Catalog match</Caption>
            <View style={styles.matchRow}>
              <BottleArt imageUrl={match.imageUrl} width={58} height={74} />
              <View style={styles.matchText}>
                <Caption style={{ marginBottom: 4 }}>{match.brand}</Caption>
                <Serif size={20}>{match.name}</Serif>
                <Text style={styles.barcodeText}>{scannedBarcode}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <GhostButton onPress={resetScan} style={styles.actionButton}>Scan again</GhostButton>
              <PrimaryButton onPress={useMatch} style={styles.actionButton}>Use this match</PrimaryButton>
            </View>
          </>
        ) : null}

        {status === 'not-found' ? (
          <>
            <Serif size={22} style={{ marginBottom: 8 }}>
              {linkSubmitted ? 'Barcode link submitted' : 'No catalog match yet'}
            </Serif>
            <Text style={styles.barcodeText}>{scannedBarcode}</Text>
            {linkSubmitted ? (
              <>
                <Text style={styles.bodyText}>
                  This code is queued for review before it becomes a shared scanner match.
                </Text>
                <View style={styles.actions}>
                  <GhostButton onPress={resetScan} style={styles.actionButton}>Scan again</GhostButton>
                  <PrimaryButton
                    onPress={() => router.replace('/add' as never)}
                    style={styles.actionButton}
                  >
                    Add manually
                  </PrimaryButton>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.bodyText}>
                  Pick the catalog row this barcode belongs to.
                </Text>
                <TextInput
                  value={linkQuery}
                  onChangeText={(value) => {
                    setLinkQuery(value);
                    setSelectedLink(null);
                    setLinkError('');
                  }}
                  placeholder="Search catalog to link this barcode"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.linkInput}
                />
                {linkStatus === 'searching' ? (
                  <View style={styles.searchStatusRow}>
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text style={styles.searchStatusText}>Searching catalog</Text>
                  </View>
                ) : null}
                {linkStatus === 'error' ? (
                  <View style={styles.searchStatusRow}>
                    <Text style={styles.searchErrorText}>— Catalog search stalled.</Text>
                    <Pressable
                      onPress={() => setLinkSearchNonce((n) => n + 1)}
                      accessibilityRole="button"
                      hitSlop={10}
                    >
                      <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
                {linkStatus === 'done' && linkResults.length === 0 ? (
                  <Text style={styles.emptyStateText}>
                    — No catalog match. Try another spelling.
                  </Text>
                ) : null}
                {linkResults.length > 0 ? (
                  <View style={styles.linkResults}>
                    {linkResults.map((entry) => {
                      const selected = selectedLink?.id === entry.id;
                      return (
                        <Pressable
                          key={entry.id}
                          onPress={() => {
                            tapLight();
                            setSelectedLink(entry);
                            setLinkError('');
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={({ pressed }) => [
                            styles.linkResult,
                            selected && styles.linkResultSelected,
                            pressed && { opacity: 0.75 },
                          ]}
                        >
                          <BottleArt imageUrl={entry.imageUrl} width={38} height={50} />
                          <View style={styles.matchText}>
                            <Caption style={{ marginBottom: 3 }}>{entry.brand}</Caption>
                            <Text style={styles.linkResultName}>{entry.name}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
                {selectedLink ? (
                  <Text style={styles.linkSelectedText}>
                    Selected: {selectedLink.brand} {selectedLink.name}
                  </Text>
                ) : null}
                {linkError ? <Text style={styles.errorText}>{linkError}</Text> : null}
                <View style={styles.actions}>
                  <GhostButton onPress={resetScan} style={styles.actionButton}>Scan again</GhostButton>
                  <PrimaryButton
                    onPress={submitBarcodeLink}
                    disabled={!selectedLink}
                    loading={linkSubmitting}
                    style={styles.actionButton}
                  >
                    Submit barcode link
                  </PrimaryButton>
                </View>
              </>
            )}
          </>
        ) : null}

        {status === 'error' ? (
          <>
            <Serif size={22} style={{ marginBottom: 8 }}>Could not scan</Serif>
            <Text style={styles.bodyText}>{message}</Text>
            <View style={styles.actions}>
              <PrimaryButton onPress={resetScan} style={styles.actionButton}>Try again</PrimaryButton>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back to Add"
        style={styles.headerAction}
        hitSlop={8}
      >
        <IconChevronLeft size={22} color={colors.text} />
      </Pressable>
      <Serif size={18}>Scan barcode</Serif>
      <View style={styles.headerAction} />
    </View>
  );
}

const RETICLE_HEIGHT = 220;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    height: 52,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionPanel: {
    padding: 24,
    gap: 14,
  },
  cameraFrame: {
    flex: 1,
    minHeight: 360,
    backgroundColor: colors.surface,
  },
  camera: {
    flex: 1,
  },
  scrimBlock: {
    flex: 1,
    backgroundColor: withAlpha(colors.background, 0.55),
  },
  scrimRow: {
    height: RETICLE_HEIGHT,
    flexDirection: 'row',
  },
  reticle: {
    width: '78%',
    maxWidth: 420,
    height: RETICLE_HEIGHT,
  },
  reticleBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.4),
    borderRadius: radius.sm,
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: colors.accent,
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3 },
  reticleFlash: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.sm,
  },
  resultPanel: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.background,
    maxHeight: 360,
  },
  resultPanelContent: {
    padding: 20,
    minHeight: 190,
  },
  bodyText: {
    ...typography.bodyDim,
    color: colors.textDim,
    lineHeight: 21,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
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
    marginTop: 12,
  },
  matchRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  matchText: {
    flex: 1,
    minWidth: 0,
  },
  barcodeText: {
    ...typography.bodyDim,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 8,
  },
  linkInput: {
    height: 46,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    fontFamily: typography.serif,
    marginTop: 12,
  },
  linkResults: {
    gap: 8,
    marginTop: 10,
    maxHeight: 180,
  },
  linkResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  linkResultSelected: {
    borderColor: colors.accent,
  },
  linkResultName: {
    fontFamily: typography.serif,
    fontSize: 15,
    color: colors.text,
  },
  linkSelectedText: {
    ...typography.bodyDim,
    color: colors.textDim,
    fontSize: 12,
    marginTop: 10,
  },
  errorText: {
    ...typography.bodyDim,
    color: colors.error,
    fontSize: 12,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    height: 46,
  },
});
