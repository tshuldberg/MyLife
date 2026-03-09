import { Tabs } from 'expo-router';
import { Text as RNText } from 'react-native';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

const JOURNAL_ACCENT = '#A78BFA';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icon}
    </RNText>
  );
}

export default function JournalLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyJournal">
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: JOURNAL_ACCENT,
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
          name="today"
          options={{
            title: 'Today',
            tabBarIcon: ({ focused }) => <TabIcon icon={'📓'} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="entries"
          options={{
            title: 'Entries',
            tabBarIcon: ({ focused }) => <TabIcon icon={'📚'} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ focused }) => <TabIcon icon={'🔎'} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused }) => <TabIcon icon={'⚙️'} focused={focused} />,
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </ModuleErrorBoundary>
  );
}
