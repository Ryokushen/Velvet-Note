import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { IconBarChart, IconBook, IconCalendar, IconPlus, IconZap } from '../../components/ui/Icon';

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
          tabBarLabel: ({ color }) => <TabLabel color={color}>Collection</TabLabel>,
          tabBarIcon: ({ color }) => <IconBook size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Wears',
          tabBarLabel: ({ color }) => <TabLabel color={color}>Wears</TabLabel>,
          tabBarIcon: ({ color }) => <IconCalendar size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarLabel: ({ color }) => <TabLabel color={color}>Today</TabLabel>,
          tabBarIcon: ({ color }) => <IconZap size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarLabel: ({ color }) => <TabLabel color={color}>Insights</TabLabel>,
          tabBarIcon: ({ color }) => <IconBarChart size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarLabel: ({ color }) => <TabLabel color={color}>Add</TabLabel>,
          tabBarIcon: ({ color }) => <IconPlus size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabLabel({ children, color }: { children: string; color: string }) {
  return (
    <Text
      adjustsFontSizeToFit
      allowFontScaling={false}
      minimumFontScale={0.82}
      numberOfLines={1}
      style={[styles.label, { color }]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginTop: 2,
    minWidth: 62,
    textAlign: 'center',
  },
});
