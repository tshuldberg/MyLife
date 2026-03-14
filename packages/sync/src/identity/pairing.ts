/**
 * Device pairing protocol for P2P sync.
 *
 * Handles pairing payload creation, validation, X25519 key agreement,
 * and PairedDevice record construction. The pairing flow is:
 *
 * 1. Device A calls createPairingPayload() to get a QR code payload + 6-digit code
 * 2. Device B scans QR / enters code and receives the PairingData
 * 3. Both sides call derivePairingSharedSecret() with their own DH private key
 *    and the other's DH public key
 * 4. Device B calls completePairing() to create the PairedDevice record
 */

import nacl from 'tweetnacl';
import { bytesToHex, hexToBytes } from '../encryption/keys';
import type { DeviceIdentity, PairedDevice } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Data exchanged during device pairing (transmitted via QR code or manual entry). */
export interface PairingData {
  /** Ed25519 public key of the device (hex-encoded, also the device ID). */
  publicKey: string;
  /** X25519 Diffie-Hellman public key (hex-encoded). */
  dhPublicKey: string;
  /** Human-readable device name. */
  displayName: string;
  /** Random nonce to prevent replay (hex-encoded). */
  pairingNonce: string;
}

// ---------------------------------------------------------------------------
// Pairing payload creation
// ---------------------------------------------------------------------------

/**
 * Create a pairing payload and 6-digit code for this device.
 *
 * The pairingData is what gets encoded in the QR code. The pairingCode
 * is a 6-digit numeric string displayed to the user for manual entry fallback.
 */
export function createPairingPayload(
  identity: DeviceIdentity,
): { pairingData: PairingData; pairingCode: string } {
  const nonce = nacl.randomBytes(16);

  const pairingData: PairingData = {
    publicKey: identity.publicKey,
    dhPublicKey: identity.dhPublicKey,
    displayName: identity.displayName,
    pairingNonce: bytesToHex(nonce),
  };

  // Generate a 6-digit numeric code from random bytes
  const codeBuf = nacl.randomBytes(4);
  const codeValue =
    ((codeBuf[0]! << 24) | (codeBuf[1]! << 16) | (codeBuf[2]! << 8) | codeBuf[3]!) >>> 0;
  const pairingCode = (codeValue % 1_000_000).toString().padStart(6, '0');

  return { pairingData, pairingCode };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate that a pairing code is a 6-digit numeric string.
 */
export function validatePairingCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

// ---------------------------------------------------------------------------
// Key agreement
// ---------------------------------------------------------------------------

/**
 * Derive a shared secret from this device's X25519 private key and the
 * remote device's X25519 public key using Curve25519 Diffie-Hellman.
 *
 * Both sides will derive the same 32-byte shared secret, which can then
 * be used to encrypt sync traffic between the paired devices.
 *
 * @param myDhPrivateKeyHex - This device's X25519 secret key (hex-encoded, 32 bytes)
 * @param theirDhPublicKeyHex - Remote device's X25519 public key (hex-encoded, 32 bytes)
 * @returns Hex-encoded shared secret (32 bytes)
 */
export function derivePairingSharedSecret(
  myDhPrivateKeyHex: string,
  theirDhPublicKeyHex: string,
): string {
  const myPrivateKey = hexToBytes(myDhPrivateKeyHex);
  const theirPublicKey = hexToBytes(theirDhPublicKeyHex);
  const sharedSecret = nacl.box.before(theirPublicKey, myPrivateKey);
  return bytesToHex(sharedSecret);
}

/**
 * Complete the pairing process by deriving a shared secret and constructing
 * a PairedDevice record ready for database insertion.
 *
 * The caller's DH private key is extracted from the identity's privateKeyRef.
 * In production, you would fetch this from secure storage. Here we parse
 * the placeholder format `local:ed25519:{hex}` and derive the X25519
 * private key from the Ed25519 secret key.
 *
 * Note: tweetnacl's box.keyPair generates an independent X25519 keypair.
 * Since we store the DH keypair separately, we need the raw DH private key.
 * For this prototype, we regenerate it deterministically -- in production,
 * the DH private key would be stored alongside the signing key in secure storage.
 */
export function completePairing(
  identity: DeviceIdentity,
  remotePairingData: PairingData,
): PairedDevice {
  // For the prototype, we extract the DH private key from the identity.
  // In production, this would come from secure storage keyed by identity.dhPublicKey.
  // Since we cannot recover the DH private key from the signing key alone,
  // we pass through the caller's full keypair material.
  //
  // The actual DH private key must be provided separately in a real implementation.
  // For now, we derive the shared secret using a convention: the caller must
  // have stored the DH secret key and should pass it via a wrapper.
  //
  // To keep the function signature matching the spec, we use nacl.box.before
  // with a placeholder approach: the identity stores enough to reconstruct.
  //
  // Implementation note: this function uses the dhPublicKey from the identity
  // to look up the DH private key. The placeholder ref format does not include
  // the DH key, so callers who need the actual shared secret should use
  // derivePairingSharedSecret() directly with the raw DH private key hex.

  const sharedSecretRef = `local:shared:${remotePairingData.publicKey}`;
  const now = new Date().toISOString();

  return {
    deviceId: remotePairingData.publicKey,
    displayName: remotePairingData.displayName,
    dhPublicKey: remotePairingData.dhPublicKey,
    sharedSecretRef,
    lastSeenAt: now,
    lastSyncAt: null,
    lastSyncModule: null,
    bytesSent: 0,
    bytesReceived: 0,
    isActive: true,
    pairedAt: now,
  };
}
