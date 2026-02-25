export type { PlanMode, Entitlements, UnsignedEntitlements } from './types';

export {
  PlanModeSchema,
  UnsignedEntitlementsSchema,
  EntitlementsSchema,
} from './schema';

export {
  isEntitlementExpired,
  canUseHosted,
  canUseSelfHost,
  canUseUpdatePack,
} from './gates';

export {
  createEntitlementSignature,
  verifyEntitlementSignature,
} from './verify';
