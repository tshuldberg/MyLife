import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

export default function CycleLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyCycle">
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
          title: 'MyCycle',
          headerLeft: () => <BackToHubButton />,
        }}
      />
      <Stack.Screen
        name="log-day"
        options={{ title: 'Log Day', presentation: 'modal' }}
      />
      <Stack.Screen
        name="cycle-detail"
        options={{ title: 'Cycle Detail' }}
      />
      <Stack.Screen
        name="insights"
        options={{ title: 'Insights' }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Stack>
    </ModuleErrorBoundary>
  );
}
