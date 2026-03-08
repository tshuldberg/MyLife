import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

export default function MoodLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyMood">
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: 'Inter', fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'MyMood',
          headerLeft: () => <BackToHubButton />,
        }}
      />
      <Stack.Screen
        name="log-mood"
        options={{ title: 'Log Mood', presentation: 'modal' }}
      />
      <Stack.Screen
        name="day-detail"
        options={{ title: 'Day Detail' }}
      />
      <Stack.Screen
        name="insights"
        options={{ title: 'Insights' }}
      />
      <Stack.Screen
        name="breathing"
        options={{ title: 'Breathing', presentation: 'modal' }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Stack>
    </ModuleErrorBoundary>
  );
}
