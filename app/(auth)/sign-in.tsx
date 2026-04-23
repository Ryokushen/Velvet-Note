import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';
import { Caption, Serif } from '../../components/ui/text';
import { PrimaryButton } from '../../components/ui/Button';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit() {
    setErrorMsg(null);
    setNotice(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
          : await supabase.auth.signUp({ email: trimmedEmail, password });

      if (error) {
        setErrorMsg(error.message);
        return;
      }
      if (mode === 'signup' && data.user && !data.session) {
        setNotice('Account created. Check your email to confirm, then sign in.');
        setMode('signin');
        return;
      }
      if (data.session) {
        router.replace('/' as never);
      }
    } catch (e: any) {
      setErrorMsg(`Unexpected: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Caption style={{ marginBottom: 12 }}>— Velvet Note</Caption>
          <Serif size={40} style={styles.heroLine}>
            A private{'\n'}catalog{'\n'}of scent.
          </Serif>
          <Text style={styles.lede}>
            For collectors who want to remember every bottle on the shelf.
          </Text>
        </View>

        <View style={styles.fields}>
          <Field
            label="Email"
            value={email}
            onChangeText={(v) => { setEmail(v); if (errorMsg) setErrorMsg(null); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); if (errorMsg) setErrorMsg(null); }}
            secureTextEntry
            placeholder="••••••••"
          />
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Caption tone="dim" style={styles.errorLabel}>— Couldn't sign in</Caption>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : notice ? (
          <View style={styles.noticeBox}>
            <Caption tone="dim" style={styles.errorLabel}>— Almost there</Caption>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.cta}>
          <PrimaryButton loading={loading} onPress={handleSubmit}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </PrimaryButton>
          <Pressable onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorMsg(null); setNotice(null); }} style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'signin' ? 'No account? ' : 'Have an account? '}
              <Text style={styles.switchAction}>
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  ...rest
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Caption style={{ marginBottom: 8 }}>{label}</Caption>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingVertical: 48,
    justifyContent: 'center',
  },
  hero: { marginBottom: 48 },
  heroLine: { lineHeight: 44, marginBottom: 16 },
  errorBox: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(196,89,79,0.08)',
  },
  noticeBox: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  errorLabel: { marginBottom: 6 },
  errorText: { ...typography.bodyDim, fontSize: 13, color: colors.error, lineHeight: 18 },
  noticeText: { ...typography.bodyDim, fontSize: 13, color: colors.textDim, lineHeight: 18 },
  lede: {
    ...typography.bodyDim,
    fontSize: 14,
    color: colors.textDim,
    lineHeight: 22,
    maxWidth: 280,
  },
  fields: { gap: 12 },
  field: {},
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  cta: { marginTop: 28 },
  switchRow: { marginTop: 20, alignItems: 'center' },
  switchText: { ...typography.bodyDim, fontSize: 13, color: colors.textDim },
  switchAction: { color: colors.text, textDecorationLine: 'underline' },
});
