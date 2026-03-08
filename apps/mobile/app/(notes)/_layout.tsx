import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

export default function NotesLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyNotes">
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
          title: 'MyNotes',
          headerLeft: () => <BackToHubButton />,
        }}
      />
      <Stack.Screen
        name="note-editor"
        options={{ title: 'Edit Note' }}
      />
      <Stack.Screen
        name="note-preview"
        options={{ title: 'Preview' }}
      />
      <Stack.Screen
        name="folders"
        options={{ title: 'Folders' }}
      />
      <Stack.Screen
        name="search"
        options={{ title: 'Search' }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Stack>
    </ModuleErrorBoundary>
  );
}
