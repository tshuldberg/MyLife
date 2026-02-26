import { Tabs } from 'expo-router';
import { Text as RNText } from 'react-native';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';

const SURF_ACCENT = colors.modules.surf;

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icon}
    </RNText>
  );
}

export default function SurfLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: SURF_ACCENT,
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
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon={'🏄'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon icon={'🗺️'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ focused }) => <TabIcon icon={'📝'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => <TabIcon icon={'⭐'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon icon={'👤'} focused={focused} />,
        }}
      />
      <Tabs.Screen name="spot/[id]" options={{ href: null }} />
    </Tabs>
  );
}
