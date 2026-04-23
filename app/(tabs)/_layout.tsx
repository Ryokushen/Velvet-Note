import { Tabs } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Collection',
          headerRight: () => (
            <Pressable
              onPress={() => supabase.auth.signOut()}
              style={{ paddingHorizontal: spacing.md }}
            >
              <Text style={{ ...typography.bodyDim, color: colors.textDim }}>Sign out</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="add" options={{ title: 'Add' }} />
    </Tabs>
  );
}
