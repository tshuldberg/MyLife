import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ModuleRegistry,
  ModuleRegistryContext,
  MODULE_METADATA,
} from '@mylife/module-registry';
import { BOOKS_MODULE } from '@mylife/books';
import { FAST_MODULE } from '@mylife/fast';
import { SUBS_MODULE } from '@mylife/subs';
import { BUDGET_MODULE } from '@mylife/budget';
import { SURF_MODULE } from '@mylife/surf';
import { RECIPES_MODULE } from '@mylife/recipes';
import { WORKOUTS_MODULE } from '@mylife/workouts';
import { HOMES_MODULE } from '@mylife/homes';
import { CAR_MODULE } from '@mylife/car';
import { HABITS_MODULE } from '@mylife/habits';
import { MEDS_MODULE } from '@mylife/meds';
import { WORDS_MODULE } from '@mylife/words';
import { colors } from '@mylife/ui';
import { DatabaseProvider } from '../components/DatabaseProvider';

const RegistryProvider =
  ModuleRegistryContext.Provider as unknown as React.ComponentType<{
    value: ModuleRegistry | null;
    children?: React.ReactNode;
  }>;

/**
 * Root layout for the MyLife app.
 *
 * Wraps the entire tree with:
 * 1. ModuleRegistryContext — provides the module registry to all screens
 * 2. DatabaseProvider — opens hub SQLite, syncs enabled state, runs migrations
 * 3. Stack navigator — renders (hub) group and per-module groups
 *
 * Registry wraps outside DatabaseProvider so DatabaseProvider can read
 * the registry to sync enabled modules from SQLite on init.
 */
export default function RootLayout() {
  const registry = useMemo(() => {
    const r = new ModuleRegistry();
    for (const def of Object.values(MODULE_METADATA)) {
      r.register(def);
    }
    // Override lightweight entries with full module definitions (includes migrations)
    r.register(BOOKS_MODULE);
    r.register(FAST_MODULE);
    r.register(SUBS_MODULE);
    r.register(BUDGET_MODULE);
    r.register(SURF_MODULE);
    r.register(RECIPES_MODULE);
    r.register(WORKOUTS_MODULE);
    r.register(HOMES_MODULE);
    r.register(CAR_MODULE);
    r.register(HABITS_MODULE);
    r.register(MEDS_MODULE);
    r.register(WORDS_MODULE);
    return r;
  }, []);

  return (
    <RegistryProvider value={registry}>
      <DatabaseProvider registry={registry}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(hub)" />
          <Stack.Screen name="(books)" />
          <Stack.Screen name="(budget)" />
          <Stack.Screen name="(surf)" />
          <Stack.Screen name="(fast)" />
          <Stack.Screen name="(recipes)" />
          <Stack.Screen name="(workouts)" />
          <Stack.Screen name="(homes)" />
          <Stack.Screen name="(car)" />
          <Stack.Screen name="(habits)" />
          <Stack.Screen name="(meds)" />
          <Stack.Screen name="(subs)" />
          <Stack.Screen name="(words)" />
        </Stack>
      </DatabaseProvider>
    </RegistryProvider>
  );
}
