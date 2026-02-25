import { z } from 'zod';

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

export const BILLING_EVENT_TYPES = {
  purchaseCreated: 'purchase.created',
  purchaseRenewed: 'purchase.renewed',
  purchaseCanceled: 'purchase.canceled',
  purchaseRefunded: 'purchase.refunded',
  purchaseDisputed: 'purchase.disputed',
} as const;

export const BillingEventTypeSchema = z.enum([
  BILLING_EVENT_TYPES.purchaseCreated,
  BILLING_EVENT_TYPES.purchaseRenewed,
  BILLING_EVENT_TYPES.purchaseCanceled,
  BILLING_EVENT_TYPES.purchaseRefunded,
  BILLING_EVENT_TYPES.purchaseDisputed,
]);

export type BillingEventType = z.infer<typeof BillingEventTypeSchema>;

export interface SkuEntitlementDefaults {
  hostedActive: boolean;
  selfHostLicense: boolean;
  modeDefault: 'hosted' | 'self_host' | 'local_only' | 'unchanged';
  updatePackYear: number | null;
}

export const SKU_ENTITLEMENT_DEFAULTS: Record<BillingSku, SkuEntitlementDefaults> = {
  [BILLING_SKUS.hostedMonthly]: {
    hostedActive: true,
    selfHostLicense: false,
    modeDefault: 'hosted',
    updatePackYear: null,
  },
  [BILLING_SKUS.hostedYearly]: {
    hostedActive: true,
    selfHostLicense: false,
    modeDefault: 'hosted',
    updatePackYear: null,
  },
  [BILLING_SKUS.selfHostLifetime]: {
    hostedActive: false,
    selfHostLicense: true,
    modeDefault: 'self_host',
    updatePackYear: null,
  },
  [BILLING_SKUS.updatePack2026]: {
    hostedActive: false,
    selfHostLicense: false,
    modeDefault: 'unchanged',
    updatePackYear: 2026,
  },
};
