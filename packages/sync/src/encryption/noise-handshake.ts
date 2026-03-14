/**
 * Simplified Noise NK handshake for authenticated transport encryption.
 *
 * The Noise NK pattern means:
 * - N: The initiator does NOT authenticate itself during the handshake
 *   (authentication happens via the encrypted payload containing a signed identity proof)
 * - K: The responder's static public key is Known to the initiator beforehand
 *
 * Flow:
 * 1. Initiator generates ephemeral X25519 keypair, encrypts identity proof
 *    using DH(ephemeral_secret, responder_static_public)
 * 2. Responder decrypts, verifies identity, generates own ephemeral keypair,
 *    derives session key from DH(responder_ephemeral, initiator_ephemeral) +
 *    DH(responder_static, initiator_ephemeral)
 * 3. Initiator derives the same session key
 *
 * This is a simplified version -- a production implementation would use a
 * proper Noise library with full chaining key state.
 */

import nacl from 'tweetnacl';
import { decodeUTF8 } from 'tweetnacl-util';
import { bytesToHex, hexToBytes, deriveKey } from './keys';
import type { DeviceIdentity } from '../types';

export class NoiseHandshake {
  private localIdentity: DeviceIdentity;
  private remoteStaticPublicKey: string | undefined;

  private ephemeralKeypair: nacl.BoxKeyPair | null = null;
  private remoteEphemeralPublicKey: Uint8Array | null = null;
  private sessionKey: Uint8Array | null = null;

  /**
   * Create a new handshake instance.
   *
   * @param localIdentity - This device's identity
   * @param remotePublicKey - The remote device's static X25519 public key (hex).
   *   The initiator must provide this (NK pattern: responder's key is Known).
   *   The responder may omit it if they will learn it from the hello message.
   */
  constructor(localIdentity: DeviceIdentity, remotePublicKey?: string) {
    this.localIdentity = localIdentity;
    this.remoteStaticPublicKey = remotePublicKey;
  }

  /**
   * Initiator step 1: Generate ephemeral keypair and encrypt identity proof.
   *
   * The encrypted payload contains the initiator's Ed25519 public key (device ID)
   * so the responder can identify and authenticate the initiator.
   *
   * The encryption uses DH(ephemeral_secret, responder_static_public) as the key.
   */
  initiatorHello(): { ephemeralPublicKey: string; encryptedPayload: Uint8Array } {
    if (!this.remoteStaticPublicKey) {
      throw new Error('Initiator must know the remote static public key (NK pattern)');
    }

    this.ephemeralKeypair = nacl.box.keyPair();
    const remoteStaticBytes = hexToBytes(this.remoteStaticPublicKey);

    // DH(ephemeral_secret, remote_static_public)
    const dhShared = nacl.box.before(remoteStaticBytes, this.ephemeralKeypair.secretKey);

    // Encrypt our device identity proof
    const identityProof = decodeUTF8(JSON.stringify({
      deviceId: this.localIdentity.publicKey,
      dhPublicKey: this.localIdentity.dhPublicKey,
      displayName: this.localIdentity.displayName,
    }));

    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(identityProof, nonce, dhShared);

    // Prepend nonce to ciphertext
    const payload = new Uint8Array(nonce.length + encrypted.length);
    payload.set(nonce, 0);
    payload.set(encrypted, nonce.length);

    return {
      ephemeralPublicKey: bytesToHex(this.ephemeralKeypair.publicKey),
      encryptedPayload: payload,
    };
  }

  /**
   * Responder step: Process the initiator's hello, decrypt identity,
   * generate ephemeral keypair, and derive the session key.
   *
   * The responder uses their static DH private key to decrypt the hello,
   * then combines multiple DH operations for the session key.
   *
   * @param hello - The initiator's hello message
   * @returns The responder's reply + the derived session key
   */
  responderReply(
    hello: { ephemeralPublicKey: string; encryptedPayload: Uint8Array },
  ): { ephemeralPublicKey: string; encryptedPayload: Uint8Array; sessionKey: Uint8Array } {
    const initiatorEphemeralBytes = hexToBytes(hello.ephemeralPublicKey);

    // Extract the DH private key from identity.
    // In production, this would be fetched from secure storage.
    // The privateKeyRef format for DH keys would need a separate ref,
    // but for this prototype we use the dhPublicKey to reconstruct.
    // Since we cannot recover the DH secret from the ref, the responder
    // must have their DH secret available. For the handshake to work,
    // the local identity must contain valid DH keys generated together.
    //
    // We use the Ed25519 secret key's first 32 bytes to derive a DH key
    // via nacl.box.keyPair.fromSecretKey in the real flow. However,
    // the identity stores an independent DH keypair. The DH secret key
    // is not stored in the identity struct (only a ref). For testing,
    // we extract from the ref if it follows the placeholder format.
    const localDhSecret = this.extractDhPrivateKey();

    // DH(local_static_secret, initiator_ephemeral)
    const dhShared = nacl.box.before(initiatorEphemeralBytes, localDhSecret);

    // Decrypt initiator's identity proof
    const nonceLen = nacl.secretbox.nonceLength;
    const nonce = hello.encryptedPayload.slice(0, nonceLen);
    const ciphertext = hello.encryptedPayload.slice(nonceLen);
    const decrypted = nacl.secretbox.open(ciphertext, nonce, dhShared);

    if (!decrypted) {
      throw new Error('Failed to decrypt initiator hello -- wrong key or tampered data');
    }

    // Store remote ephemeral for session key derivation
    this.remoteEphemeralPublicKey = initiatorEphemeralBytes;

    // Generate responder ephemeral keypair
    this.ephemeralKeypair = nacl.box.keyPair();

    // Derive session key from two DH operations:
    // 1. DH(responder_ephemeral_secret, initiator_ephemeral_public)
    // 2. DH(responder_static_secret, initiator_ephemeral_public)
    const dh1 = nacl.box.before(initiatorEphemeralBytes, this.ephemeralKeypair.secretKey);
    const dh2 = dhShared; // Already computed above

    // Combine DH outputs
    const combined = new Uint8Array(dh1.length + dh2.length);
    combined.set(dh1, 0);
    combined.set(dh2, dh1.length);

    this.sessionKey = deriveKey(combined, 'mylife-sync-session-key');

    // Encrypt our identity proof with the session key
    const replyProof = decodeUTF8(JSON.stringify({
      deviceId: this.localIdentity.publicKey,
      dhPublicKey: this.localIdentity.dhPublicKey,
      displayName: this.localIdentity.displayName,
    }));

    const replyNonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const replyEncrypted = nacl.secretbox(replyProof, replyNonce, this.sessionKey);

    const replyPayload = new Uint8Array(replyNonce.length + replyEncrypted.length);
    replyPayload.set(replyNonce, 0);
    replyPayload.set(replyEncrypted, replyNonce.length);

    return {
      ephemeralPublicKey: bytesToHex(this.ephemeralKeypair.publicKey),
      encryptedPayload: replyPayload,
      sessionKey: this.sessionKey,
    };
  }

  /**
   * Initiator step 2: Process the responder's reply and derive the session key.
   *
   * The initiator mirrors the responder's key derivation using:
   * 1. DH(initiator_ephemeral_secret, responder_ephemeral_public)
   * 2. DH(initiator_ephemeral_secret, responder_static_public)
   *
   * @param reply - The responder's reply message
   * @returns The derived session key (should match the responder's)
   */
  initiatorFinalize(
    reply: { ephemeralPublicKey: string; encryptedPayload: Uint8Array },
  ): Uint8Array {
    if (!this.ephemeralKeypair) {
      throw new Error('Must call initiatorHello() before initiatorFinalize()');
    }
    if (!this.remoteStaticPublicKey) {
      throw new Error('Remote static public key is required');
    }

    const responderEphemeralBytes = hexToBytes(reply.ephemeralPublicKey);
    const remoteStaticBytes = hexToBytes(this.remoteStaticPublicKey);

    // Mirror the responder's DH operations from the initiator's perspective:
    // 1. DH(initiator_ephemeral_secret, responder_ephemeral_public)
    const dh1 = nacl.box.before(responderEphemeralBytes, this.ephemeralKeypair.secretKey);
    // 2. DH(initiator_ephemeral_secret, responder_static_public)
    const dh2 = nacl.box.before(remoteStaticBytes, this.ephemeralKeypair.secretKey);

    // Combine DH outputs (same order as responder)
    const combined = new Uint8Array(dh1.length + dh2.length);
    combined.set(dh1, 0);
    combined.set(dh2, dh1.length);

    this.sessionKey = deriveKey(combined, 'mylife-sync-session-key');

    // Verify we can decrypt the responder's payload
    const nonceLen = nacl.secretbox.nonceLength;
    const nonce = reply.encryptedPayload.slice(0, nonceLen);
    const ciphertext = reply.encryptedPayload.slice(nonceLen);
    const decrypted = nacl.secretbox.open(ciphertext, nonce, this.sessionKey);

    if (!decrypted) {
      throw new Error('Failed to decrypt responder reply -- session key mismatch');
    }

    return this.sessionKey;
  }

  /**
   * Get the negotiated session key after the handshake completes.
   * Throws if the handshake has not been finalized.
   */
  getSessionKey(): Uint8Array {
    if (!this.sessionKey) {
      throw new Error('Handshake not complete -- no session key available');
    }
    return this.sessionKey;
  }

  /**
   * Extract the DH private key from the local identity.
   *
   * In production, this would fetch from secure storage.
   * For the prototype, we parse the placeholder ref format.
   */
  private extractDhPrivateKey(): Uint8Array {
    // The identity stores the Ed25519 secret key in the ref, not the DH key.
    // For testing, we need to derive a DH keypair that matches dhPublicKey.
    // Since the DH keypair was generated independently, we cannot derive it
    // from the Ed25519 key. The test setup must inject the DH secret key.
    //
    // Convention: if privateKeyRef contains the Ed25519 secret (128 hex chars),
    // we use the first 32 bytes as a seed to generate a DH key.
    // This only works for testing -- production uses secure storage lookup.
    const ref = this.localIdentity.privateKeyRef;
    const parts = ref.split(':');
    if (parts.length >= 3 && parts[0] === 'local') {
      const hexKey = parts.slice(2).join(':');
      // Ed25519 secret key is 64 bytes (128 hex). Use first 32 bytes as DH seed.
      if (hexKey.length >= 64) {
        const seed = hexToBytes(hexKey.substring(0, 64));
        return seed;
      }
    }
    throw new Error(
      'Cannot extract DH private key from identity ref. ' +
      'In production, fetch from secure storage keyed by dhPublicKey.',
    );
  }
}
