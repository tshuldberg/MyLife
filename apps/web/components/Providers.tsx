'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
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
import { FORUMS_MODULE } from '@mylife/forums';
import { RECIPES_MODULE } from '@mylife/recipes';
import { CAR_MODULE } from '@mylife/car';
import { CLOSET_MODULE } from '@mylife/closet';
import { HABITS_MODULE } from '@mylife/habits';
import { MEDS_MODULE } from '@mylife/meds';
import { MARKET_MODULE } from '@mylife/market';
import { SURF_MODULE } from '@mylife/surf';
import { WORKOUTS_MODULE } from '@mylife/workouts';
import { HOMES_MODULE } from '@mylife/homes';
import { WORDS_MODULE } from '@mylife/words';
import { JOURNAL_MODULE } from '@mylife/journal';
import { PETS_MODULE } from '@mylife/pets';
import { HEALTH_MODULE } from '@mylife/health';
import { RSVP_MODULE } from '@mylife/rsvp';
import {
  AuthProvider,
  AuthService,
  getSupabaseClient,
  type SupabaseClientOptions,
} from '@mylife/auth';
import { resetSocialClient, setSocialClient } from '@mylife/social';
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
  const supabaseOptions = useMemo<SupabaseClientOptions | null>(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) return null;
    return { url, anonKey };
  }, []);

  const supabaseClient = useMemo(
    () => (supabaseOptions ? getSupabaseClient(supabaseOptions) : null),
    [supabaseOptions],
  );

  const authService = useMemo(
    () => (supabaseClient ? new AuthService(supabaseClient) : null),
    [supabaseClient],
  );

  useEffect(() => {
    if (supabaseClient) {
      setSocialClient(supabaseClient);
      return;
    }

    resetSocialClient();
  }, [supabaseClient]);

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
    reg.register(FORUMS_MODULE);
    reg.register(RECIPES_MODULE);
    reg.register(CAR_MODULE);
    reg.register(CLOSET_MODULE);
    reg.register(HABITS_MODULE);
    reg.register(MEDS_MODULE);
    reg.register(MARKET_MODULE);
    reg.register(SURF_MODULE);
    reg.register(WORKOUTS_MODULE);
    reg.register(HOMES_MODULE);
    reg.register(WORDS_MODULE);
    reg.register(JOURNAL_MODULE);
    reg.register(PETS_MODULE);
    reg.register(HEALTH_MODULE);
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
      <AuthProvider service={authService}>
        <EntitlementsProvider paymentService={paymentService}>
          {children as unknown as React.ReactNode}
        </EntitlementsProvider>
      </AuthProvider>
    </RegistryProvider>
  );
}
