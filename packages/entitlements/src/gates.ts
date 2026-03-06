import type { ModuleId } from '@mylife/module-registry';
import type { EntitlementState, Purchase, StorageTier } from './types';

/** Modules that are always free regardless of purchase state. */
const FREE_MODULES: ReadonlySet<ModuleId> = new Set(['fast']);

/** One year in milliseconds. */
const ONE_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Returns true if a module is unlocked for the user.
 *
 * A module is unlocked if:
 * - It is a free module (MyFast), OR
 * - The hub unlock ($19.99) has been purchased, OR
 * - The individual standalone unlock for that module was purchased
 */
export function isModuleUnlocked(moduleId: ModuleId, state: EntitlementState): boolean {
  if (FREE_MODULES.has(moduleId)) return true;
  if (state.hubUnlocked) return true;
  return state.unlockedModules.has(moduleId);
}

/** Returns all module IDs the user currently has access to. */
export function getUnlockedModules(
  allModuleIds: readonly ModuleId[],
  state: EntitlementState,
): ModuleId[] {
  return allModuleIds.filter((id) => isModuleUnlocked(id, state));
}

/** Returns true if the full hub unlock ($19.99) has been purchased. */
export function isHubUnlocked(state: EntitlementState): boolean {
  return state.hubUnlocked;
}

/** Returns the user's current storage tier. */
export function getStorageTier(state: EntitlementState): StorageTier {
  return state.storageTier;
}

/**
 * Returns true if the user is entitled to app updates.
 *
 * Update entitlement is active when:
 * - The user is within Year 1 of their purchase, OR
 * - The $9.99/yr annual update fee is currently active
 */
export function isUpdateEntitled(state: EntitlementState): boolean {
  return state.updateEntitled;
}

// ---------------------------------------------------------------------------
// Resolution -- compute EntitlementState from raw purchases
// ---------------------------------------------------------------------------

/**
 * Computes a full EntitlementState from a list of purchases.
 *
 * Bridge logic: if the purchase list includes a standalone module unlock
 * (e.g. `mylife_workouts_unlock`), that module is also unlocked in the hub.
 */
export function resolveEntitlements(
  purchases: Purchase[],
  nowMs: number = Date.now(),
): EntitlementState {
  let hubUnlocked = false;
  const unlockedModules = new Set<ModuleId>();
  let storageTier: StorageTier = 'free';
  let updateEntitled = false;
  let earliestPurchaseDate: Date | null = null;

  for (const purchase of purchases) {
    if (!purchase.isActive) continue;

    const purchaseDate = new Date(purchase.purchaseDate);

    // Track earliest purchase date (for hub unlock or standalone unlocks)
    if (
      purchase.productId === 'mylife_hub_unlock' ||
      /^mylife_.+_unlock$/.test(purchase.productId)
    ) {
      if (!earliestPurchaseDate || purchaseDate < earliestPurchaseDate) {
        earliestPurchaseDate = purchaseDate;
      }
    }

    // Hub unlock
    if (purchase.productId === 'mylife_hub_unlock') {
      hubUnlocked = true;
    }

    // Standalone module unlocks (bridge)
    const standaloneMatch = purchase.productId.match(/^mylife_(.+)_unlock$/);
    if (standaloneMatch && standaloneMatch[1] !== 'hub') {
      unlockedModules.add(standaloneMatch[1] as ModuleId);
    }

    // Storage tiers (highest active tier wins)
    if (purchase.productId === 'mylife_storage_power') {
      storageTier = 'power';
    } else if (purchase.productId === 'mylife_storage_starter' && storageTier !== 'power') {
      storageTier = 'starter';
    }

    // Annual update fee
    if (purchase.productId === 'mylife_annual_update') {
      updateEntitled = true;
    }
  }

  // Year 1 update entitlement: if user purchased within last year, they get updates
  if (earliestPurchaseDate && !updateEntitled) {
    const elapsed = nowMs - earliestPurchaseDate.getTime();
    if (elapsed < ONE_YEAR_MS) {
      updateEntitled = true;
    }
  }

  return {
    hubUnlocked,
    unlockedModules,
    storageTier,
    updateEntitled,
    purchaseDate: earliestPurchaseDate,
  };
}
