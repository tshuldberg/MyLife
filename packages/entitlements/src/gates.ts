import type { Entitlements } from './types';

/** Returns true when the entitlement has an expiry that is now in the past. */
export function isEntitlementExpired(
  entitlements: Pick<Entitlements, 'expiresAt'>,
  nowMs: number = Date.now(),
): boolean {
  if (!entitlements.expiresAt) return false;
  const expiresAtMs = Date.parse(entitlements.expiresAt);
  if (Number.isNaN(expiresAtMs)) return true;
  return expiresAtMs <= nowMs;
}

/** Hosted features are available only with an active hosted entitlement. */
export function canUseHosted(
  entitlements: Entitlements,
  nowMs: number = Date.now(),
): boolean {
  return entitlements.mode === 'hosted'
    && entitlements.hostedActive
    && !isEntitlementExpired(entitlements, nowMs);
}

/** Self-host features are available with a valid self-host license. */
export function canUseSelfHost(
  entitlements: Entitlements,
  nowMs: number = Date.now(),
): boolean {
  return entitlements.mode === 'self_host'
    && entitlements.selfHostLicense
    && !isEntitlementExpired(entitlements, nowMs);
}

/**
 * Update packs are considered active when the entitlement advertises
 * the requested year or newer.
 */
export function canUseUpdatePack(
  entitlements: Entitlements,
  year: number,
  nowMs: number = Date.now(),
): boolean {
  if (isEntitlementExpired(entitlements, nowMs)) return false;
  if (!entitlements.updatePackYear) return false;
  return entitlements.updatePackYear >= year;
}
