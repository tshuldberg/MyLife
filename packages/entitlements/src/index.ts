export type {
  HubUnlockProduct,
  StandaloneProduct,
  AnnualUpdateProduct,
  StorageTierProduct,
  ProductId,
  StorageTier,
  Purchase,
  EntitlementState,
} from './types';

export {
  HubUnlockProductSchema,
  StandaloneProductSchema,
  AnnualUpdateProductSchema,
  StorageTierProductSchema,
  ProductIdSchema,
  StorageTierSchema,
  PurchaseSchema,
  PlanModeSchema,
  UnsignedEntitlementsSchema,
  EntitlementsSchema,
} from './schema';

export type { EntitlementExpirableShape } from './gates';

export {
  isModuleUnlocked,
  getUnlockedModules,
  isHubUnlocked,
  getStorageTier,
  isUpdateEntitled,
  isEntitlementExpired,
  resolveEntitlements,
} from './gates';

export type { PlanMode, UnsignedEntitlements, Entitlements } from './hosted-types';

export {
  createEntitlementSignature,
  verifyEntitlementSignature,
} from './verify';
