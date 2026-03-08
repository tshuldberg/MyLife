import { Tabs } from 'expo-router';
import { Text as RNText } from 'react-native';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

const FLASH_ACCENT = '#FBBF24';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icon}
    </RNText>
  );
}

export default function FlashLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyFlash">
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: FLASH_ACCENT,
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
          name="study"
          options={{
            title: 'Study',
            tabBarIcon: ({ focused }) => <TabIcon icon={'⚡'} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="decks"
          options={{
            title: 'Decks',
            tabBarIcon: ({ focused }) => <TabIcon icon={'🗂️'} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: ({ focused }) => <TabIcon icon={'📊'} focused={focused} />,
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
