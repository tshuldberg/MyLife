import { z } from 'zod';

export const BillingCycleSchema = z.enum([
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'lifetime',
]);
export type BillingCycle = z.infer<typeof BillingCycleSchema>;

export const SubscriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  costCents: z.number().int(),
  billingCycle: BillingCycleSchema,
  category: z.string().nullable(),
  nextRenewalDate: z.string().nullable(),
  startDate: z.string(),
  iconUri: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;
