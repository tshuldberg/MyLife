import { Tabs } from 'expo-router';
import { Text as RNText } from 'react-native';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';

const BOOKS_ACCENT = colors.modules.books;

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icon}
    </RNText>
  );
}

export default function BooksLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: BOOKS_ACCENT,
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
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udcd6'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udcda'} focused={focused} />,
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
        name="reader/index"
        options={{
          title: 'Reader',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udcd4'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\ud83d\udcca'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\u2699\ufe0f'} focused={focused} />,
        }}
      />
      {/* Hide non-tab screens from the tab bar */}
      <Tabs.Screen name="book/[id]" options={{ href: null }} />
      <Tabs.Screen name="book/add" options={{ href: null }} />
      <Tabs.Screen name="reader/[id]" options={{ href: null }} />
      <Tabs.Screen name="shelf/[id]" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="year-review" options={{ href: null }} />
    </Tabs>
  );
}
