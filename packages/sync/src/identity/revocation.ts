/**
 * Device revocation for the P2P sync trust model.
 *
 * When a device is lost, stolen, or compromised, any trusted device can
 * create a signed revocation record. Revoked devices are rejected during
 * the handshake and cannot participate in further sync sessions.
 */

import type { DatabaseAdapter } from '@mylife/db';
import type { DeviceIdentity, DeviceRevocation } from '../types';
import { isDeviceRevoked } from '../db/queries';

/**
 * Create a signed revocation record for a target device.
 *
 * The revocation is attributed to the local device (the one creating it).
 * In a full implementation, this record would be signed with the local
 * device's Ed25519 key and gossiped to all peers.
 *
 * @param identity - The local device's identity (the revoker)
 * @param targetDeviceId - The public key / device ID being revoked
 * @param reason - Optional human-readable reason for revocation
 */
export function createRevocation(
  identity: DeviceIdentity,
  targetDeviceId: string,
  reason?: string,
): DeviceRevocation {
  return {
    deviceId: targetDeviceId,
    revokedByDeviceId: identity.publicKey,
    reason: reason ?? null,
    revokedAt: new Date().toISOString(),
  };
}

/**
 * Check whether a device has been revoked.
 *
 * Delegates to the database query layer to look up revocation records.
 */
export function isRevoked(db: DatabaseAdapter, deviceId: string): boolean {
  return isDeviceRevoked(db, deviceId);
}
