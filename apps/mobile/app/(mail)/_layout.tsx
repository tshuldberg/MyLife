import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';
import { ModuleErrorBoundary } from '../../components/ModuleErrorBoundary';

export default function MailLayout() {
  return (
    <ModuleErrorBoundary moduleName="MyMail">
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
          title: 'MyMail',
          headerLeft: () => <BackToHubButton />,
        }}
      />
      <Stack.Screen
        name="message-detail"
        options={{ title: 'Message' }}
      />
      <Stack.Screen
        name="compose-message"
        options={{ title: 'Compose', presentation: 'modal' }}
      />
      <Stack.Screen
        name="server-setup"
        options={{ title: 'Server Setup' }}
      />
    </Stack>
    </ModuleErrorBoundary>
  );
}
