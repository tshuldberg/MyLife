import { z } from 'zod';

// --- Enums ---

export const AccountType = z.enum([
  'cash',
  'checking',
  'savings',
  'credit',
  'other',
]);
export type AccountType = z.infer<typeof AccountType>;

export const TransactionDirection = z.enum(['inflow', 'outflow', 'transfer']);
export type TransactionDirection = z.infer<typeof TransactionDirection>;

// --- Envelopes ---

export const EnvelopeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  monthly_budget: z.number().int().nonnegative(),
  rollover_enabled: z.number().int().min(0).max(1), // SQLite boolean
  archived: z.number().int().min(0).max(1), // SQLite boolean
  sort_order: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Envelope = z.infer<typeof EnvelopeSchema>;

export const EnvelopeInsertSchema = EnvelopeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  icon: true,
  color: true,
  monthly_budget: true,
  rollover_enabled: true,
  archived: true,
  sort_order: true,
});
export type EnvelopeInsert = z.infer<typeof EnvelopeInsertSchema>;

export const EnvelopeUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  monthly_budget: z.number().int().nonnegative().optional(),
  rollover_enabled: z.number().int().min(0).max(1).optional(),
  archived: z.number().int().min(0).max(1).optional(),
  sort_order: z.number().int().nonnegative().optional(),
});
export type EnvelopeUpdate = z.infer<typeof EnvelopeUpdateSchema>;

// --- Accounts ---

export const AccountSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  type: AccountType,
  current_balance: z.number().int(),
  currency: z.string().length(3).default('USD'),
  archived: z.number().int().min(0).max(1), // SQLite boolean
  sort_order: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Account = z.infer<typeof AccountSchema>;

export const AccountInsertSchema = AccountSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  type: true,
  current_balance: true,
  currency: true,
  archived: true,
  sort_order: true,
});
export type AccountInsert = z.infer<typeof AccountInsertSchema>;

export const AccountUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  type: AccountType.optional(),
  current_balance: z.number().int().optional(),
  currency: z.string().length(3).optional(),
  archived: z.number().int().min(0).max(1).optional(),
  sort_order: z.number().int().nonnegative().optional(),
});
export type AccountUpdate = z.infer<typeof AccountUpdateSchema>;

// --- Transactions ---

export const BudgetTransactionSchema = z.object({
  id: z.string(),
  envelope_id: z.string().nullable(),
  account_id: z.string().nullable(),
  amount: z.number().int(), // cents
  direction: TransactionDirection,
  merchant: z.string().nullable(),
  note: z.string().nullable(),
  occurred_on: z.string(), // YYYY-MM-DD
  created_at: z.string(),
  updated_at: z.string(),
});
export type BudgetTransaction = z.infer<typeof BudgetTransactionSchema>;

export const BudgetTransactionInsertSchema = BudgetTransactionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  envelope_id: true,
  account_id: true,
  merchant: true,
  note: true,
});
export type BudgetTransactionInsert = z.infer<typeof BudgetTransactionInsertSchema>;

export const BudgetTransactionUpdateSchema = z.object({
  envelope_id: z.string().nullable().optional(),
  account_id: z.string().nullable().optional(),
  amount: z.number().int().optional(),
  direction: TransactionDirection.optional(),
  merchant: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  occurred_on: z.string().optional(),
});
export type BudgetTransactionUpdate = z.infer<typeof BudgetTransactionUpdateSchema>;

export const BudgetTransactionFilterSchema = z.object({
  envelope_id: z.string().optional(),
  account_id: z.string().optional(),
  direction: TransactionDirection.optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  limit: z.number().int().positive().max(500).optional(),
  offset: z.number().int().nonnegative().optional(),
});
export type BudgetTransactionFilter = z.infer<typeof BudgetTransactionFilterSchema>;

// --- Goals ---

export const BudgetGoalSchema = z.object({
  id: z.string(),
  envelope_id: z.string(),
  name: z.string().min(1).max(80),
  target_amount: z.number().int().nonnegative(),
  target_date: z.string().nullable(),
  completed_amount: z.number().int().nonnegative(),
  is_completed: z.number().int().min(0).max(1), // SQLite boolean
  created_at: z.string(),
  updated_at: z.string(),
});
export type BudgetGoal = z.infer<typeof BudgetGoalSchema>;

export const BudgetGoalInsertSchema = BudgetGoalSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  target_date: true,
  completed_amount: true,
  is_completed: true,
});
export type BudgetGoalInsert = z.infer<typeof BudgetGoalInsertSchema>;

export const BudgetGoalUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  target_amount: z.number().int().nonnegative().optional(),
  target_date: z.string().nullable().optional(),
  completed_amount: z.number().int().nonnegative().optional(),
  is_completed: z.number().int().min(0).max(1).optional(),
});
export type BudgetGoalUpdate = z.infer<typeof BudgetGoalUpdateSchema>;

// --- Settings ---

export const BudgetSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});
export type BudgetSetting = z.infer<typeof BudgetSettingSchema>;

// --- Subscriptions ---

export const BillingCycle = z.enum([
  'weekly',
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
  'custom',
]);
export type BillingCycle = z.infer<typeof BillingCycle>;

export const SubscriptionStatus = z.enum(['active', 'paused', 'cancelled', 'trial']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const BudgetSubscriptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  price: z.number().int(),
  currency: z.string().length(3),
  billing_cycle: BillingCycle,
  custom_days: z.number().int().positive().nullable(),
  status: SubscriptionStatus,
  start_date: z.string(),
  next_renewal: z.string(),
  trial_end_date: z.string().nullable(),
  cancelled_date: z.string().nullable(),
  notes: z.string().nullable(),
  url: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  notify_days: z.number().int().nonnegative(),
  catalog_id: z.string().nullable(),
  sort_order: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type BudgetSubscription = z.infer<typeof BudgetSubscriptionSchema>;

export const BudgetSubscriptionInsertSchema = BudgetSubscriptionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  currency: true,
  custom_days: true,
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
export type BudgetSubscriptionInsert = z.infer<typeof BudgetSubscriptionInsertSchema>;

export const BudgetSubscriptionUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().int().optional(),
  currency: z.string().length(3).optional(),
  billing_cycle: BillingCycle.optional(),
  custom_days: z.number().int().positive().nullable().optional(),
  status: SubscriptionStatus.optional(),
  start_date: z.string().optional(),
  next_renewal: z.string().optional(),
  trial_end_date: z.string().nullable().optional(),
  cancelled_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  notify_days: z.number().int().nonnegative().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});
export type BudgetSubscriptionUpdate = z.infer<typeof BudgetSubscriptionUpdateSchema>;

export const BudgetSubscriptionFilterSchema = z.object({
  status: SubscriptionStatus.optional(),
  billing_cycle: BillingCycle.optional(),
});
export type BudgetSubscriptionFilter = z.infer<typeof BudgetSubscriptionFilterSchema>;

// --- Catalog ---

export const CatalogCategorySchema = z.enum([
  'entertainment',
  'productivity',
  'health',
  'shopping',
  'news',
  'finance',
  'utilities',
  'other',
]);
export type CatalogCategory = z.infer<typeof CatalogCategorySchema>;

export interface CatalogEntry {
  id: string;
  name: string;
  defaultPrice: number;
  billingCycle: BillingCycle;
  category: CatalogCategory;
}

