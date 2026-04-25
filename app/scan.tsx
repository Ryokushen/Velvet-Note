import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  findSupabaseCatalogByBarcode,
  normalizeBarcode,
  type CatalogFragrance,
} from '../lib/catalog';
import { BottleArt } from '../components/BottleArt';
import { GhostButton, PrimaryButton } from '../components/ui/Button';
import { Caption, Serif } from '../components/ui/text';
import { IconChevronLeft } from '../components/ui/Icon';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';

type ScanStatus = 'idle' | 'looking' | 'matched' | 'not-found' | 'error';

export default function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [match, setMatch] = useState<CatalogFragrance | null>(null);
  const [message, setMessage] = useState('');

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (status === 'looking' || status === 'matched') {
      return;
    }

    const barcode = normalizeBarcode(result.data);
    if (!barcode) {
      setScannedBarcode('');
      setMatch(null);
      setMessage('That code is not a supported UPC/EAN/GTIN barcode.');
      setStatus('error');
      return;
    }

    setScannedBarcode(barcode);
    setMatch(null);
    setMessage('');
    setStatus('looking');

    try {
      const catalogMatch = await findSupabaseCatalogByBarcode(barcode);
      setMatch(catalogMatch);
      setStatus(catalogMatch ? 'matched' : 'not-found');
    } catch (error: any) {
      setMessage(error.message ?? 'Unknown error');
      setStatus('error');
    }
  }

  function resetScan() {
    setStatus('idle');
    setScannedBarcode('');
    setMatch(null);
    setMessage('');
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

  if (!permission) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onBack={goBackToAdd} />
        <View style={styles.permissionPanel}>
          <Serif size={24} style={{ marginBottom: 10 }}>Camera access</Serif>
          <Text style={styles.bodyText}>
            Camera access is needed to scan barcode labels.
          </Text>
          <PrimaryButton onPress={requestPermission}>Allow camera</PrimaryButton>
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
          <View style={styles.scanOverlay}>
            <View style={styles.scanBox} />
          </View>
        </CameraView>
      </View>

      <View style={styles.resultPanel}>
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
            <Serif size={22} style={{ marginBottom: 8 }}>No catalog match yet</Serif>
            <Text style={styles.barcodeText}>{scannedBarcode}</Text>
            <Text style={styles.bodyText}>
              Search the catalog manually for now. Later this can become a barcode-linking flow.
            </Text>
            <View style={styles.actions}>
              <GhostButton onPress={resetScan} style={styles.actionButton}>Scan again</GhostButton>
              <PrimaryButton
                onPress={() => router.replace('/add' as never)}
                style={styles.actionButton}
              >
                Search catalog
              </PrimaryButton>
            </View>
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
      </View>
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
  scanOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  scanBox: {
    width: '86%',
    maxWidth: 420,
    aspectRatio: 1.55,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
  },
  resultPanel: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    padding: 20,
    backgroundColor: colors.background,
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
