/**
 * Device identity generation and Ed25519 signing/verification.
 *
 * Each device generates a unique Ed25519 signing keypair and an X25519
 * Diffie-Hellman keypair on first launch. The Ed25519 public key serves
 * as the canonical device ID.
 */

import nacl from 'tweetnacl';
import { bytesToHex, hexToBytes } from '../encryption/keys';

/**
 * Re-export DeviceIdentity from types for convenience.
 */
import type { DeviceIdentity } from '../types';
export type { DeviceIdentity };

/**
 * Generate a new device identity with fresh Ed25519 and X25519 keypairs.
 *
 * The `privateKeyRef` uses the format `local:ed25519:{hex}` as a placeholder.
 * In production, the raw private key should be stored in platform-specific
 * secure storage (Keychain on iOS, Keystore on Android) and the ref
 * should point to that storage location.
 */
export function generateDeviceIdentity(displayName: string): DeviceIdentity {
  const signingKeypair = nacl.sign.keyPair();
  const dhKeypair = nacl.box.keyPair();

  const publicKeyHex = bytesToHex(signingKeypair.publicKey);
  const privateKeyHex = bytesToHex(signingKeypair.secretKey);
  const dhPublicKeyHex = bytesToHex(dhKeypair.publicKey);

  return {
    publicKey: publicKeyHex,
    privateKeyRef: `local:ed25519:${privateKeyHex}`,
    dhPublicKey: dhPublicKeyHex,
    displayName,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Extract the device ID from an identity.
 * The device ID is the Ed25519 public key (hex-encoded).
 */
export function getDeviceId(identity: DeviceIdentity): string {
  return identity.publicKey;
}

/**
 * Sign a message using an Ed25519 private key.
 *
 * @param privateKeyHex - The full Ed25519 secret key (64 bytes) as hex
 * @param message - The message bytes to sign
 * @returns The detached signature (64 bytes)
 */
export function signMessage(privateKeyHex: string, message: Uint8Array): Uint8Array {
  const privateKey = hexToBytes(privateKeyHex);
  return nacl.sign.detached(message, privateKey);
}

/**
 * Verify an Ed25519 signature against a public key.
 *
 * @param publicKeyHex - The Ed25519 public key as hex
 * @param message - The original message bytes
 * @param signature - The detached signature to verify
 * @returns true if the signature is valid
 */
export function verifySignature(
  publicKeyHex: string,
  message: Uint8Array,
  signature: Uint8Array,
): boolean {
  try {
    const publicKey = hexToBytes(publicKeyHex);
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
}

/**
 * Compute a short fingerprint of a public key for human-readable display.
 *
 * Returns the first 8 hex characters of the SHA-512 hash of the public key bytes.
 * This is NOT cryptographically binding for security purposes -- it is purely
 * a UX convenience for device identification in the pairing UI.
 */
export function getPublicKeyFingerprint(publicKeyHex: string): string {
  const publicKeyBytes = hexToBytes(publicKeyHex);
  const hash = nacl.hash(publicKeyBytes); // SHA-512
  return bytesToHex(hash).substring(0, 8);
}
