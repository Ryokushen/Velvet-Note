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
import { colors, withAlpha } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';
import { Caption, Serif } from '../../components/ui/text';
import { PrimaryButton } from '../../components/ui/Button';

// Supabase surfaces raw, developer-facing strings ("Invalid login
// credentials", "AuthRetryableFetchError", …). Map the common cases to
// on-brand copy with a way forward; anything unrecognised falls back to a
// calm generic line rather than leaking internals.
export function mapAuthError(rawMessage: string, mode: 'signin' | 'signup'): string {
  const message = rawMessage.toLowerCase();

  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return 'That email and password don’t match — check them, or create an account below.';
  }
  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return 'This email hasn’t been confirmed yet — open the link we sent, then sign in.';
  }
  if (message.includes('already registered') || message.includes('already exists') || message.includes('already in use')) {
    return 'An account already exists for this email — sign in instead.';
  }
  if (message.includes('password') && (message.includes('at least') || message.includes('should be') || message.includes('weak'))) {
    return 'That password is too short — use at least six characters.';
  }
  if (message.includes('rate') || message.includes('too many')) {
    return 'Too many attempts — wait a moment, then try again.';
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('connection')) {
    return 'Couldn’t reach the server — check your connection and try again.';
  }
  return mode === 'signin'
    ? 'Something went wrong signing in — try again in a moment.'
    : 'Something went wrong creating your account — try again in a moment.';
}

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
        setErrorMsg(mapAuthError(error.message, mode));
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
      setErrorMsg(mapAuthError(e?.message ?? String(e), mode));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); if (errorMsg) setErrorMsg(null); }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            textContentType={mode === 'signin' ? 'password' : 'newPassword'}
            placeholder="••••••••"
          />
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Caption tone="dim" style={styles.errorLabel}>
              {mode === 'signin' ? '— Could not sign in' : '— Could not create account'}
            </Caption>
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
        accessibilityLabel={label}
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
    backgroundColor: withAlpha(colors.error, 0.08),
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
