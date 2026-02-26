import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';

export default function MedsLayout() {
  return (
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
          title: 'MyMeds',
          headerLeft: () => <BackToHubButton />,
        }}
      />
    </Stack>
  );
}
