import { Tabs } from 'expo-router';
import { Text as RNText } from 'react-native';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

const ACCENT = colors.modules.nutrition;

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</RNText>;
}

export default function NutritionLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyNutrition">
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
          title: 'Diary',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83c\udf7d\ufe0f'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udd0d'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udcca'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udcc8'} focused={focused} />,
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
      <Tabs.Screen name="food/[id]" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="photo" options={{ href: null }} />
    </Tabs>
    </ModuleErrorBoundary>
  );
}
