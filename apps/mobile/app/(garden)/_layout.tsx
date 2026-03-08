import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

export default function GardenLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyGarden">
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
          title: 'MyGarden',
          headerLeft: () => <BackToHubButton />,
        }}
      />
      <Stack.Screen
        name="plant-detail"
        options={{ title: 'Plant' }}
      />
      <Stack.Screen
        name="add-plant"
        options={{ title: 'Add Plant', presentation: 'modal' }}
      />
      <Stack.Screen
        name="journal"
        options={{ title: 'Garden Journal' }}
      />
      <Stack.Screen
        name="seeds"
        options={{ title: 'Seed Inventory' }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Stack>
    </ModuleErrorBoundary>
  );
}
