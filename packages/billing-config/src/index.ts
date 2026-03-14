import { z } from 'zod';
import { FREE_MODULES, type ModuleId } from '@mylife/module-registry';

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

type PurchasableModuleId = Exclude<ModuleId, (typeof FREE_MODULES)[number]>;

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
    closet: { id: 'mylife_closet_unlock', price: 4.99 },
    cycle: { id: 'mylife_cycle_unlock', price: 4.99 },
    flash: { id: 'mylife_flash_unlock', price: 4.99 },
    garden: { id: 'mylife_garden_unlock', price: 4.99 },
    habits: { id: 'mylife_habits_unlock', price: 4.99 },
    health: { id: 'mylife_health_unlock', price: 4.99 },
    homes: { id: 'mylife_homes_unlock', price: 4.99 },
    mail: { id: 'mylife_mail_unlock', price: 4.99 },
    meds: { id: 'mylife_meds_unlock', price: 4.99 },
    nutrition: { id: 'mylife_nutrition_unlock', price: 4.99 },
    pets: { id: 'mylife_pets_unlock', price: 4.99 },
    recipes: { id: 'mylife_recipes_unlock', price: 4.99 },
    rsvp: { id: 'mylife_rsvp_unlock', price: 4.99 },
    stars: { id: 'mylife_stars_unlock', price: 4.99 },
    subs: { id: 'mylife_subs_unlock', price: 4.99 },
    surf: { id: 'mylife_surf_unlock', price: 4.99 },
    trails: { id: 'mylife_trails_unlock', price: 4.99 },
    words: { id: 'mylife_words_unlock', price: 4.99 },
    workouts: { id: 'mylife_workouts_unlock', price: 4.99 },
  } satisfies Record<PurchasableModuleId, StandaloneModuleConfig>,
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
  purchaseDisputed: 'purchase.disputed',
  purchaseExpired: 'purchase.expired',
} as const;

export const BillingEventTypeSchema = z.enum([
  BILLING_EVENT_TYPES.purchaseCreated,
  BILLING_EVENT_TYPES.purchaseRenewed,
  BILLING_EVENT_TYPES.purchaseCanceled,
  BILLING_EVENT_TYPES.purchaseRefunded,
  BILLING_EVENT_TYPES.purchaseDisputed,
  BILLING_EVENT_TYPES.purchaseExpired,
]);

export type BillingEventType = z.infer<typeof BillingEventTypeSchema>;

export const BILLING_SKUS = {
  hostedMonthly: 'mylife_hosted_monthly_v1',
  hostedYearly: 'mylife_hosted_yearly_v1',
  selfHostLifetime: 'mylife_self_host_lifetime_v1',
  updatePack2026: 'mylife_update_pack_2026_v1',
} as const;

export const BillingSkuSchema = z.enum([
  BILLING_SKUS.hostedMonthly,
  BILLING_SKUS.hostedYearly,
  BILLING_SKUS.selfHostLifetime,
  BILLING_SKUS.updatePack2026,
]);

export type BillingSku = z.infer<typeof BillingSkuSchema>;

type BillingModeDefault = 'hosted' | 'self_host' | 'local_only' | 'unchanged';

export const SKU_ENTITLEMENT_DEFAULTS: Record<
  BillingSku,
  {
    hostedActive: boolean;
    selfHostLicense: boolean;
    modeDefault: BillingModeDefault;
    updatePackYear?: number;
  }
> = {
  [BILLING_SKUS.hostedMonthly]: {
    hostedActive: true,
    selfHostLicense: false,
    modeDefault: 'hosted',
  },
  [BILLING_SKUS.hostedYearly]: {
    hostedActive: true,
    selfHostLicense: false,
    modeDefault: 'hosted',
  },
  [BILLING_SKUS.selfHostLifetime]: {
    hostedActive: false,
    selfHostLicense: true,
    modeDefault: 'self_host',
  },
  [BILLING_SKUS.updatePack2026]: {
    hostedActive: false,
    selfHostLicense: false,
    modeDefault: 'unchanged',
    updatePackYear: 2026,
  },
};
