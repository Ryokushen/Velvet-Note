import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { IconBook, IconCalendar, IconPlus } from '../../components/ui/Icon';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.borderSoft,
          borderTopWidth: 1,
          height: 78,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Collection',
          tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]}>Collection</Text>,
          tabBarIcon: ({ color }) => <IconBook size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]}>Add</Text>,
          tabBarIcon: ({ color }) => <IconPlus size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wear"
        options={{
          title: 'Wear',
          tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]}>Wear</Text>,
          tabBarIcon: ({ color }) => <IconCalendar size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginTop: 2,
  },
});
