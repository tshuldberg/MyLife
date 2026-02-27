import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';

export default function WorkoutsLayout() {
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
          title: 'MyWorkouts',
          headerLeft: () => <BackToHubButton />,
        }}
      />
      <Stack.Screen name="explore" options={{ title: 'Explore Exercises' }} />
      <Stack.Screen name="builder" options={{ title: 'Workout Builder' }} />
      <Stack.Screen name="workouts" options={{ title: 'All Workouts' }} />
      <Stack.Screen name="progress" options={{ title: 'Progress' }} />
      <Stack.Screen name="recordings" options={{ title: 'Form Recordings' }} />
      <Stack.Screen name="exercise/[id]" options={{ title: 'Exercise Detail' }} />
    </Stack>
  );
}
