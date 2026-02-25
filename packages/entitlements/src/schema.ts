import { z } from 'zod';
import type { Entitlements, UnsignedEntitlements } from './types';

export const PlanModeSchema = z.enum(['hosted', 'self_host', 'local_only']);

export const UnsignedEntitlementsSchema = z.object({
  appId: z.string().min(1),
  mode: PlanModeSchema,
  hostedActive: z.boolean(),
  selfHostLicense: z.boolean(),
  updatePackYear: z.number().int().min(2000).max(9999).optional(),
  features: z.array(z.string()),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

export const EntitlementsSchema = UnsignedEntitlementsSchema.extend({
  signature: z.string().min(16),
});

// Compile-time compatibility checks
const _unsignedTypeCheck: z.ZodType<UnsignedEntitlements> = UnsignedEntitlementsSchema;
const _signedTypeCheck: z.ZodType<Entitlements> = EntitlementsSchema;
void _unsignedTypeCheck;
void _signedTypeCheck;
