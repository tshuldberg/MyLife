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
import { BUDGET_MODULE } from '@mylife/budget';
import { SURF_MODULE } from '@mylife/surf';
import { RECIPES_MODULE } from '@mylife/recipes';
import { WORKOUTS_MODULE } from '@mylife/workouts';
import { HOMES_MODULE } from '@mylife/homes';
import { CAR_MODULE } from '@mylife/car';
import { HABITS_MODULE } from '@mylife/habits';
import { MEDS_MODULE } from '@mylife/meds';
import { HEALTH_MODULE } from '@mylife/health';
import { WORDS_MODULE } from '@mylife/words';
import { RSVP_MODULE } from '@mylife/rsvp';
import { colors } from '@mylife/ui';
import { DatabaseProvider } from '../components/DatabaseProvider';
import { ModuleErrorBoundary } from '../components/ModuleErrorBoundary';

export const unstable_settings = {
  initialRouteName: '(hub)',
};

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
/**
 * Safely register a module definition. If the definition is malformed
 * (fails Zod validation), log and skip instead of crashing the app.
 */
function safeRegister(r: ModuleRegistry, def: Parameters<ModuleRegistry['register']>[0], label: string): void {
  try {
    r.register(def);
  } catch (err) {
    console.error(`[MyLife] Failed to register module "${label}":`, err);
  }
}

export default function RootLayout() {
  const registry = useMemo(() => {
    const r = new ModuleRegistry();
    for (const [key, def] of Object.entries(MODULE_METADATA)) {
      safeRegister(r, def, key);
    }
    // Override lightweight entries with full module definitions (includes migrations)
    safeRegister(r, BOOKS_MODULE, 'books');
    safeRegister(r, FAST_MODULE, 'fast');
    safeRegister(r, BUDGET_MODULE, 'budget');
    safeRegister(r, SURF_MODULE, 'surf');
    safeRegister(r, RECIPES_MODULE, 'recipes');
    safeRegister(r, WORKOUTS_MODULE, 'workouts');
    safeRegister(r, HOMES_MODULE, 'homes');
    safeRegister(r, CAR_MODULE, 'car');
    safeRegister(r, HABITS_MODULE, 'habits');
    safeRegister(r, MEDS_MODULE, 'meds');
    safeRegister(r, HEALTH_MODULE, 'health');
    safeRegister(r, WORDS_MODULE, 'words');
    safeRegister(r, RSVP_MODULE, 'rsvp');
    return r;
  }, []);

  return (
    <ModuleErrorBoundary moduleName="MyLife">
      <RegistryProvider value={registry}>
        <DatabaseProvider registry={registry}>
          <StatusBar style="light" />
          <Stack
            initialRouteName="(hub)"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" />
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
            <Stack.Screen name="(health)" />
            <Stack.Screen name="(words)" />
            <Stack.Screen name="(rsvp)" />
          </Stack>
        </DatabaseProvider>
      </RegistryProvider>
    </ModuleErrorBoundary>
  );
}
