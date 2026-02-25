'use client';

import { useMemo, type ReactNode } from 'react';
import {
  ModuleRegistryContext,
  ModuleRegistry,
  MODULE_METADATA,
  MODULE_IDS,
  type ModuleId,
} from '@mylife/module-registry';
import { BOOKS_MODULE } from '@mylife/books';
import { FAST_MODULE } from '@mylife/fast';
import { SUBS_MODULE } from '@mylife/subs';
import { BUDGET_MODULE } from '@mylife/budget';
import { RECIPES_MODULE } from '@mylife/recipes';
import { CAR_MODULE } from '@mylife/car';
import { HABITS_MODULE } from '@mylife/habits';
import { MEDS_MODULE } from '@mylife/meds';
import { SURF_MODULE } from '@mylife/surf';
import { WORKOUTS_MODULE } from '@mylife/workouts';
import { HOMES_MODULE } from '@mylife/homes';
import { WORDS_MODULE } from '@mylife/words';

const RegistryProvider =
  ModuleRegistryContext.Provider as unknown as React.ComponentType<{
    value: ModuleRegistry | null;
    children?: unknown;
  }>;

interface ProvidersProps {
  children: ReactNode;
  initialEnabledIds: string[];
}

export function Providers({ children, initialEnabledIds }: ProvidersProps) {
  const registry = useMemo(() => {
    const reg = new ModuleRegistry();
    for (const id of MODULE_IDS) {
      reg.register(MODULE_METADATA[id]);
    }
    // Override with full module definitions (includes migrations)
    reg.register(BOOKS_MODULE);
    reg.register(FAST_MODULE);
    reg.register(SUBS_MODULE);
    reg.register(BUDGET_MODULE);
    reg.register(RECIPES_MODULE);
    reg.register(CAR_MODULE);
    reg.register(HABITS_MODULE);
    reg.register(MEDS_MODULE);
    reg.register(SURF_MODULE);
    reg.register(WORKOUTS_MODULE);
    reg.register(HOMES_MODULE);
    reg.register(WORDS_MODULE);
    // Restore enabled state from SQLite (passed from server layout)
    for (const id of initialEnabledIds) {
      reg.enable(id as ModuleId);
    }
    return reg;
  }, [initialEnabledIds]);

  return (
    <RegistryProvider value={registry}>
      {children as unknown as React.ReactNode}
    </RegistryProvider>
  );
}
