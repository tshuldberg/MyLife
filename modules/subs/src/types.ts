import { z } from 'zod';

// --- Enums ---

export const BillingCycle = z.enum(['weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom']);
export type BillingCycle = z.infer<typeof BillingCycle>;

export const SubscriptionStatus = z.enum(['active', 'paused', 'cancelled', 'trial']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const CatalogCategory = z.enum([
  'entertainment', 'productivity', 'health', 'shopping', 'news', 'finance', 'utilities', 'other',
]);
export type CatalogCategory = z.infer<typeof CatalogCategory>;

// --- Subscription ---

export const SubscriptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  price: z.number().int(), // cents
  currency: z.string().length(3).default('USD'),
  billing_cycle: BillingCycle,
  custom_days: z.number().int().positive().nullable(),
  category: CatalogCategory.nullable(),
  status: SubscriptionStatus,
  start_date: z.string(), // YYYY-MM-DD
  next_renewal: z.string(), // YYYY-MM-DD
  trial_end_date: z.string().nullable(),
  cancelled_date: z.string().nullable(),
  notes: z.string().max(1000).nullable(),
  url: z.string().max(500).nullable(),
  icon: z.string().max(100).nullable(),
  color: z.string().max(20).nullable(),
  notify_days: z.number().int().nonnegative(),
  catalog_id: z.string().nullable(),
  sort_order: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const SubscriptionInsertSchema = SubscriptionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  currency: true,
  custom_days: true,
  category: true,
  trial_end_date: true,
  cancelled_date: true,
  notes: true,
  url: true,
  icon: true,
  color: true,
  notify_days: true,
  catalog_id: true,
  sort_order: true,
});
export type SubscriptionInsert = z.infer<typeof SubscriptionInsertSchema>;

// --- Filters & Updates ---

export const SubscriptionFilterSchema = z.object({
  status: SubscriptionStatus.optional(),
  category: CatalogCategory.optional(),
  billing_cycle: BillingCycle.optional(),
});
export type SubscriptionFilter = z.infer<typeof SubscriptionFilterSchema>;

export const SubscriptionUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().int().optional(),
  currency: z.string().length(3).optional(),
  billing_cycle: BillingCycle.optional(),
  custom_days: z.number().int().positive().nullable().optional(),
  category: CatalogCategory.nullable().optional(),
  start_date: z.string().optional(),
  next_renewal: z.string().optional(),
  trial_end_date: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  url: z.string().max(500).nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  notify_days: z.number().int().nonnegative().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});
export type SubscriptionUpdate = z.infer<typeof SubscriptionUpdateSchema>;

// --- Price History ---

export interface PriceHistory {
  id: string;
  subscription_id: string;
  price: number;
  effective_date: string;
  created_at: string;
}

// --- Catalog ---

export interface CatalogEntry {
  id: string;
  name: string;
  defaultPrice: number; // cents
  billingCycle: BillingCycle;
  category: CatalogCategory;
  iconKey: string;
  url?: string;
}

// --- Cost Summary ---

export interface CategoryCostSummary {
  category: string | null;
  monthlyCost: number;
  count: number;
}

export interface SubscriptionSummary {
  monthlyTotal: number;
  annualTotal: number;
  dailyCost: number;
  byCategory: CategoryCostSummary[];
  activeCount: number;
  totalCount: number;
}
