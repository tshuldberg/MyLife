import { z } from 'zod';
import type { ModuleId } from '@mylife/module-registry';

// ---------------------------------------------------------------------------
// Product types
// ---------------------------------------------------------------------------

export type ProductType = 'one_time' | 'annual' | 'monthly';

export interface ProductConfig {
  id: string;
  price: number;
  type: ProductType;
}

export interface StorageTierConfig {
  id: string;
  price: number;
  storageGB: number;
}

export interface StandaloneModuleConfig {
  id: string;
  price: number;
}

// ---------------------------------------------------------------------------
// Product catalog
// ---------------------------------------------------------------------------

export const PRODUCTS = {
  hubUnlock: {
    id: 'mylife_hub_unlock',
    price: 19.99,
    type: 'one_time' as const,
  },
  annualUpdate: {
    id: 'mylife_annual_update',
    price: 9.99,
    type: 'annual' as const,
  },
  storageTiers: {
    free: { id: 'free', price: 0, storageGB: 1 },
    starter: { id: 'mylife_storage_starter', price: 2.99, storageGB: 5 },
    power: { id: 'mylife_storage_power', price: 5.99, storageGB: 25 },
  },
  standaloneModules: {
    books: { id: 'mylife_books_unlock', price: 4.99 },
    budget: { id: 'mylife_budget_unlock', price: 4.99 },
    car: { id: 'mylife_car_unlock', price: 4.99 },
    habits: { id: 'mylife_habits_unlock', price: 4.99 },
    health: { id: 'mylife_health_unlock', price: 4.99 },
    homes: { id: 'mylife_homes_unlock', price: 4.99 },
    meds: { id: 'mylife_meds_unlock', price: 4.99 },
    recipes: { id: 'mylife_recipes_unlock', price: 4.99 },
    rsvp: { id: 'mylife_rsvp_unlock', price: 4.99 },
    surf: { id: 'mylife_surf_unlock', price: 4.99 },
    words: { id: 'mylife_words_unlock', price: 4.99 },
    workouts: { id: 'mylife_workouts_unlock', price: 4.99 },
  } satisfies Record<Exclude<ModuleId, 'fast'>, StandaloneModuleConfig>,
} as const;

// ---------------------------------------------------------------------------
// All purchasable product IDs (flat list for validation)
// ---------------------------------------------------------------------------

export const ALL_PRODUCT_IDS = [
  PRODUCTS.hubUnlock.id,
  PRODUCTS.annualUpdate.id,
  PRODUCTS.storageTiers.starter.id,
  PRODUCTS.storageTiers.power.id,
  ...Object.values(PRODUCTS.standaloneModules).map((m) => m.id),
] as const;

export const ProductIdSchema = z.enum(ALL_PRODUCT_IDS as unknown as [string, ...string[]]);

// ---------------------------------------------------------------------------
// Billing event types (webhooks from RevenueCat / Stripe)
// ---------------------------------------------------------------------------

export const BILLING_EVENT_TYPES = {
  purchaseCreated: 'purchase.created',
  purchaseRenewed: 'purchase.renewed',
  purchaseCanceled: 'purchase.canceled',
  purchaseRefunded: 'purchase.refunded',
  purchaseExpired: 'purchase.expired',
  purchaseDisputed: 'purchase.disputed',
} as const;

export const BillingEventTypeSchema = z.enum([
  BILLING_EVENT_TYPES.purchaseCreated,
  BILLING_EVENT_TYPES.purchaseRenewed,
  BILLING_EVENT_TYPES.purchaseCanceled,
  BILLING_EVENT_TYPES.purchaseRefunded,
  BILLING_EVENT_TYPES.purchaseExpired,
  BILLING_EVENT_TYPES.purchaseDisputed,
]);

export type BillingEventType = z.infer<typeof BillingEventTypeSchema>;

// ---------------------------------------------------------------------------
// Web billing SKUs (hosted subscription + self-host + update packs)
// ---------------------------------------------------------------------------

/**
 * Billing SKUs for the web/server-side hosted and self-host billing system.
 * These are distinct from the mobile IAP product IDs in PRODUCTS above.
 */
export const BILLING_SKUS = {
  hostedMonthly: 'mylife_hosted_monthly',
  hostedYearly: 'mylife_hosted_yearly',
  selfHostLifetime: 'mylife_self_host_lifetime',
  updatePack2026: 'mylife_update_pack_2026',
} as const;

export type BillingSku = (typeof BILLING_SKUS)[keyof typeof BILLING_SKUS];

export const BillingSkuSchema = z.enum([
  BILLING_SKUS.hostedMonthly,
  BILLING_SKUS.hostedYearly,
  BILLING_SKUS.selfHostLifetime,
  BILLING_SKUS.updatePack2026,
]);

// ---------------------------------------------------------------------------
// SKU entitlement defaults (what each SKU grants when purchased)
// ---------------------------------------------------------------------------

export interface SkuEntitlementDefaults {
  modeDefault: 'hosted' | 'self_host' | 'local_only' | 'unchanged';
  updatePackYear?: number;
}

export const SKU_ENTITLEMENT_DEFAULTS: Record<BillingSku, SkuEntitlementDefaults> = {
  [BILLING_SKUS.hostedMonthly]: { modeDefault: 'hosted' },
  [BILLING_SKUS.hostedYearly]: { modeDefault: 'hosted' },
  [BILLING_SKUS.selfHostLifetime]: { modeDefault: 'self_host' },
  [BILLING_SKUS.updatePack2026]: { modeDefault: 'unchanged', updatePackYear: 2026 },
};
