import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

export default function StarsLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyStars">
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
          title: 'MyStars',
          headerLeft: () => <BackToHubButton />,
        }}
      />
      <Stack.Screen
        name="birth-chart"
        options={{ title: 'Birth Chart' }}
      />
      <Stack.Screen
        name="add-profile"
        options={{ title: 'Add Profile', presentation: 'modal' }}
      />
      <Stack.Screen
        name="transit-detail"
        options={{ title: 'Transit Detail' }}
      />
    </Stack>
    </ModuleErrorBoundary>
  );
}
