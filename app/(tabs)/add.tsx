import { useState } from 'react';
import {
  ScrollView,
  View,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateFragrance } from '../../hooks/useFragrances';
import { AccordChips } from '../../components/AccordChips';
import { ConcentrationPicker } from '../../components/ConcentrationPicker';
import { RatingDots } from '../../components/ui/RatingDots';
import { PrimaryButton } from '../../components/ui/Button';
import { Caption, Serif } from '../../components/ui/text';
import type { Concentration } from '../../types/fragrance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';

export default function Add() {
  const router = useRouter();
  const create = useCreateFragrance();
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [concentration, setConcentration] = useState<Concentration | null>(null);
  const [accords, setAccords] = useState<string[]>([]);
  const [rating, setRating] = useState(0);

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
      });
      // Reset in case user comes back to this screen.
      setBrand('');
      setName('');
      setConcentration(null);
      setAccords([]);
      setRating(0);
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
          <ConcentrationPicker value={concentration} onChange={setConcentration} />
          <AccordChips value={accords} onChange={setAccords} />
          <View>
            <Caption style={{ marginBottom: 10 }}>Rating</Caption>
            <RatingDots value={rating} onChange={setRating} />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton loading={create.isPending} onPress={submit}>
            Save to shelf
          </PrimaryButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  footer: {
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
});
