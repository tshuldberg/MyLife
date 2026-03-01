import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';

export default function HabitsLayout() {
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
          title: 'MyHabits',
          headerLeft: () => <BackToHubButton />,
        }}
      />
      <Stack.Screen
        name="habits"
        options={{ title: 'All Habits' }}
      />
      <Stack.Screen
        name="add-habit"
        options={{ title: 'New Habit', presentation: 'modal' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Habit Detail' }}
      />
      <Stack.Screen
        name="stats"
        options={{ title: 'Statistics' }}
      />
      <Stack.Screen
        name="cycle"
        options={{ title: 'MyCycle' }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Stack>
  );
}
