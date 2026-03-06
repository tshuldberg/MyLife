import { Tabs } from 'expo-router';
import { Text as RNText } from 'react-native';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';

const ACCENT = colors.modules.recipes;

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</RNText>;
}

export default function RecipesLayout() {
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
          title: 'Home',
          headerTitle: 'MyGarden',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\uD83C\uDFE0'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes-tab"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\uD83D\uDCD6'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Meal Plan',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\uD83D\uDCC5'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: 'Garden',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\uD83C\uDF31'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused }) => <TabIcon icon={'\uD83C\uDF89'} focused={focused} />,
        }}
      />
      {/* Hide stack screens from tab bar */}
      <Tabs.Screen
        name="settings"
        options={{ href: null, title: 'Settings' }}
      />
      <Tabs.Screen
        name="recipe/[id]"
        options={{ href: null, title: 'Recipe' }}
      />
      <Tabs.Screen
        name="add-recipe"
        options={{ href: null, title: 'Add Recipe' }}
      />
      <Tabs.Screen
        name="cooking-mode"
        options={{ href: null, title: 'Cooking Mode', headerShown: false }}
      />
      <Tabs.Screen
        name="event/[id]"
        options={{ href: null, title: 'Event' }}
      />
    </Tabs>
  );
}
