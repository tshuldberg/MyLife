import { Tabs } from 'expo-router';
import { Text as RNText } from 'react-native';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';

const ACCENT = colors.modules.meds;

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</RNText>;
}

export default function MedsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: 'Inter', fontWeight: '600' },
        headerShadowVisible: false,
        headerLeft: () => <BackToHubButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udd70\ufe0f'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Medications',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udc8a'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udcc6'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\u2764\ufe0f'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\u2699\ufe0f'} focused={focused} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="add-med" options={{ href: null }} />
      <Tabs.Screen name="mood-check-in" options={{ href: null }} />
    </Tabs>
  );
}
