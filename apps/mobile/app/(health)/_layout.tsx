import { Tabs } from 'expo-router';
import { Text as RNText } from 'react-native';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

const HEALTH_ACCENT = colors.modules.health;

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</RNText>;
}

export default function HealthLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyHealth">
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: HEALTH_ACCENT,
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
          tabBarIcon: ({ focused }) => <TabIcon icon={'\u{1FA7A}'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="fasting"
        options={{
          title: 'Fasting',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\u23F1\uFE0F'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vitals"
        options={{
          title: 'Vitals',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\u2764\uFE0F'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\uD83D\uDCC8'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\uD83D\uDEE1\uFE0F'} focused={focused} />,
        }}
      />
      {/* Hidden stack screens */}
      <Tabs.Screen name="add-med" options={{ href: null }} />
      <Tabs.Screen name="med-detail" options={{ href: null }} />
      <Tabs.Screen name="mood-check-in" options={{ href: null }} />
      <Tabs.Screen name="measurement-log" options={{ href: null }} />
      <Tabs.Screen name="emergency-info" options={{ href: null }} />
      <Tabs.Screen name="add-document" options={{ href: null }} />
      <Tabs.Screen name="document-viewer" options={{ href: null }} />
      <Tabs.Screen name="health-sync-settings" options={{ href: null }} />
      <Tabs.Screen name="export" options={{ href: null }} />
      <Tabs.Screen name="add-goal" options={{ href: null }} />
    </Tabs>
    </ModuleErrorBoundary>
  );
}
