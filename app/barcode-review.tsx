import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  approveCatalogBarcodeSubmission,
  listPendingCatalogBarcodeSubmissions,
  rejectCatalogBarcodeSubmission,
  type CatalogBarcodeSubmission,
} from '../lib/catalog';
import { GhostButton, PrimaryButton } from '../components/ui/Button';
import { Caption, Serif } from '../components/ui/text';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function BarcodeReview() {
  const [submissions, setSubmissions] = useState<CatalogBarcodeSubmission[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setLoading(true);
    setError('');
    try {
      const next = await listPendingCatalogBarcodeSubmissions(50);
      setSubmissions(next);
    } catch (e: any) {
      setError(e.message ?? 'Unknown error');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }

  async function reviewSubmission(
    submission: CatalogBarcodeSubmission,
    action: 'approve' | 'reject',
  ) {
    setBusyId(submission.id);
    setError('');
    const note = notes[submission.id]?.trim();
    try {
      if (action === 'approve') {
        await approveCatalogBarcodeSubmission(submission.id, note);
      } else {
        await rejectCatalogBarcodeSubmission(submission.id, note);
      }
      await loadSubmissions();
    } catch (e: any) {
      setError(e.message ?? 'Unknown error');
    } finally {
      setBusyId('');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Caption style={{ marginBottom: 6 }}>Admin</Caption>
          <Serif size={22}>Barcode review</Serif>
        </View>
        <Pressable
          onPress={loadSubmissions}
          accessibilityRole="button"
          style={({ pressed }) => [styles.refreshButton, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.centerPanel}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.bodyText}>Loading pending submissions</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.messagePanel}>
            <Serif size={20} style={{ marginBottom: 8 }}>Review unavailable</Serif>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && submissions.length === 0 ? (
          <View style={styles.messagePanel}>
            <Serif size={20} style={{ marginBottom: 8 }}>No pending links</Serif>
            <Text style={styles.bodyText}>
              New unknown-barcode submissions will appear here after scanner users link a code.
            </Text>
          </View>
        ) : null}

        {!error
          ? submissions.map((submission) => {
              const busy = busyId === submission.id;
              return (
                <View key={submission.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Caption style={{ marginBottom: 6 }}>Barcode</Caption>
                      <Text style={styles.barcode}>{submission.barcode}</Text>
                    </View>
                    <Text style={styles.source}>{submission.source}</Text>
                  </View>

                  <View style={styles.catalogBlock}>
                    <Caption style={{ marginBottom: 6 }}>Proposed catalog match</Caption>
                    <Text style={styles.brand}>{submission.catalogBrand}</Text>
                    <Serif size={21}>{submission.catalogName}</Serif>
                  </View>

                  <TextInput
                    value={notes[submission.id] ?? ''}
                    onChangeText={(value) =>
                      setNotes((current) => ({ ...current, [submission.id]: value }))
                    }
                    placeholder="Review note"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="sentences"
                    style={styles.noteInput}
                  />

                  <View style={styles.actions}>
                    <GhostButton
                      danger
                      disabled={busy}
                      loading={busy}
                      onPress={() => reviewSubmission(submission, 'reject')}
                      style={styles.actionButton}
                    >
                      Reject
                    </GhostButton>
                    <PrimaryButton
                      disabled={busy}
                      loading={busy}
                      onPress={() => reviewSubmission(submission, 'approve')}
                      style={styles.actionButton}
                    >
                      Approve
                    </PrimaryButton>
                  </View>
                </View>
              );
            })
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  refreshButton: {
    height: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 11,
    color: colors.text,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  scroll: {
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  centerPanel: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  messagePanel: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    padding: 14,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  barcode: {
    fontFamily: typography.serif,
    fontSize: 19,
    color: colors.text,
  },
  source: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 12,
  },
  catalogBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 12,
  },
  brand: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  noteInput: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    fontFamily: typography.serif,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 44,
  },
  bodyText: {
    ...typography.bodyDim,
    color: colors.textDim,
    lineHeight: 21,
  },
  errorText: {
    ...typography.bodyDim,
    color: colors.error,
    lineHeight: 21,
  },
});
