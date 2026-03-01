import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';

/**
 * Hub stack navigator.
 * Opens on the MyLife app selector and keeps navigation minimal.
 */
export default function HubLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'MyLife',
        }}
      />
      <Stack.Screen
        name="discover"
        options={{
          title: 'Discover',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="onboarding-mode"
        options={{
          title: 'Mode',
        }}
      />
      <Stack.Screen
        name="self-host"
        options={{
          title: 'Self-host',
        }}
      />
    </Stack>
  );
}
