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
import { FLASH_MODULE } from '@mylife/flash';
import { BUDGET_MODULE } from '@mylife/budget';
import { RECIPES_MODULE } from '@mylife/recipes';
import { CAR_MODULE } from '@mylife/car';
import { CLOSET_MODULE } from '@mylife/closet';
import { HABITS_MODULE } from '@mylife/habits';
import { MEDS_MODULE } from '@mylife/meds';
import { SURF_MODULE } from '@mylife/surf';
import { WORKOUTS_MODULE } from '@mylife/workouts';
import { HOMES_MODULE } from '@mylife/homes';
import { WORDS_MODULE } from '@mylife/words';
import { JOURNAL_MODULE } from '@mylife/journal';
import { PETS_MODULE } from '@mylife/pets';
import { RSVP_MODULE } from '@mylife/rsvp';
import { createPaymentService } from '@mylife/subscription';
import type { PaymentService } from '@mylife/subscription';
import { EntitlementsProvider } from './EntitlementsProvider';

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
    reg.register(FLASH_MODULE);
    reg.register(BUDGET_MODULE);
    reg.register(RECIPES_MODULE);
    reg.register(CAR_MODULE);
    reg.register(CLOSET_MODULE);
    reg.register(HABITS_MODULE);
    reg.register(MEDS_MODULE);
    reg.register(SURF_MODULE);
    reg.register(WORKOUTS_MODULE);
    reg.register(HOMES_MODULE);
    reg.register(WORDS_MODULE);
    reg.register(JOURNAL_MODULE);
    reg.register(PETS_MODULE);
    reg.register(RSVP_MODULE);
    // Restore enabled state from SQLite (passed from server layout)
    for (const id of initialEnabledIds) {
      reg.enable(id as ModuleId);
    }
    return reg;
  }, [initialEnabledIds]);

  const paymentService = useMemo<PaymentService | null>(() => {
    try {
      return createPaymentService({ platform: 'web' });
    } catch {
      return null;
    }
  }, []);

  return (
    <RegistryProvider value={registry}>
      <EntitlementsProvider paymentService={paymentService}>
        {children as unknown as React.ReactNode}
      </EntitlementsProvider>
    </RegistryProvider>
  );
}
