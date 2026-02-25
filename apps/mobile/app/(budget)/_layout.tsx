import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@mylife/ui';
import { BackToHubButton } from '../../components/BackToHubButton';

export default function BudgetLayout() {
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
          title: 'Budget',
          headerLeft: () => <BackToHubButton />,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'New Envelope',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Envelope',
        }}
      />
      <Stack.Screen
        name="accounts"
        options={{
          title: 'Accounts',
        }}
      />
      <Stack.Screen
        name="account/create"
        options={{
          title: 'New Account',
        }}
      />
      <Stack.Screen
        name="account/[id]"
        options={{
          title: 'Account',
        }}
      />
      <Stack.Screen
        name="transactions"
        options={{
          title: 'Transactions',
        }}
      />
      <Stack.Screen
        name="transaction/create"
        options={{
          title: 'New Transaction',
        }}
      />
      <Stack.Screen
        name="transaction/[id]"
        options={{
          title: 'Transaction',
        }}
      />
      <Stack.Screen
        name="goals"
        options={{
          title: 'Goals',
        }}
      />
      <Stack.Screen
        name="goal/create"
        options={{
          title: 'New Goal',
        }}
      />
      <Stack.Screen
        name="goal/[id]"
        options={{
          title: 'Goal',
        }}
      />
    </Stack>
  );
}
