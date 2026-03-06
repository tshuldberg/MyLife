import { z } from 'zod';
import { ModuleIdSchema } from '@mylife/module-registry';

// ---------------------------------------------------------------------------
// Product schemas
// ---------------------------------------------------------------------------

export const HubUnlockProductSchema = z.literal('mylife_hub_unlock');

export const StandaloneProductSchema = z.custom<`mylife_${z.infer<typeof ModuleIdSchema>}_unlock`>(
  (val) => {
    if (typeof val !== 'string') return false;
    const match = val.match(/^mylife_(.+)_unlock$/);
    if (!match) return false;
    return ModuleIdSchema.safeParse(match[1]).success;
  },
);

export const AnnualUpdateProductSchema = z.literal('mylife_annual_update');

export const StorageTierProductSchema = z.enum([
  'mylife_storage_starter',
  'mylife_storage_power',
]);

export const ProductIdSchema = z.union([
  HubUnlockProductSchema,
  StandaloneProductSchema,
  AnnualUpdateProductSchema,
  StorageTierProductSchema,
]);

// ---------------------------------------------------------------------------
// Storage tier schema
// ---------------------------------------------------------------------------

export const StorageTierSchema = z.enum(['free', 'starter', 'power']);

// ---------------------------------------------------------------------------
// Purchase schema
// ---------------------------------------------------------------------------

export const PurchaseSchema = z.object({
  productId: z.string().min(1),
  purchaseDate: z.string().datetime(),
  isActive: z.boolean(),
});
