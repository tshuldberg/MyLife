import { Tabs } from 'expo-router';
import { Text as RNText } from 'react-native';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

const CAR_ACCENT = colors.modules.car;

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icon}
    </RNText>
  );
}

export default function CarLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyCar">
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: CAR_ACCENT,
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
          name="garage"
          options={{
            title: 'Garage',
            tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\ude97'} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="reminders"
          options={{
            title: 'Reminders',
            tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udd14'} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Expenses',
            tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udcb0'} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused }) => <TabIcon icon={'\u2699\ufe0f'} focused={focused} />,
          }}
        />
        {/* Hide vehicle detail from tab bar */}
        <Tabs.Screen name="vehicle/[id]" options={{ href: null }} />
        {/* Hide old index from tab bar */}
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </ModuleErrorBoundary>
  );
}
