import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { colors, spacing } from '@mylife/ui';

/**
 * Hub tab navigator with 3 tabs: Dashboard, Discover, Settings.
 *
 * Uses Expo Router's Tabs component with file-based routing.
 * Tab bar uses dark theme with cream text and subtle border.
 */
export default function HubLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: colors.text,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji={'\u{1F3E0}'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji={'\u{1F9ED}'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji={'\u2699\uFE0F'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="onboarding-mode"
        options={{
          title: 'Mode',
          href: null,
        }}
      />
      <Tabs.Screen
        name="self-host"
        options={{
          title: 'Self-host',
          href: null,
        }}
      />
    </Tabs>
  );
}

/** Simple emoji-based tab icon with opacity tinting. */
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const isActive = color === colors.text;
  return (
    <RNText style={[styles.tabIcon, { opacity: isActive ? 1 : 0.5 }]}>
      {emoji}
    </RNText>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
  },
});
