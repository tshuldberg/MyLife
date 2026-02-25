import { EntitlementsSchema } from './schema';
import type { Entitlements, UnsignedEntitlements } from './types';

function bytesToBase64(bytes: Uint8Array): string {
  const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index];
    const byte2 = bytes[index + 1];
    const byte3 = bytes[index + 2];

    const combined = (byte1 << 16) | ((byte2 ?? 0) << 8) | (byte3 ?? 0);

    output += table[(combined >> 18) & 0x3f];
    output += table[(combined >> 12) & 0x3f];
    output += byte2 === undefined ? '=' : table[(combined >> 6) & 0x3f];
    output += byte3 === undefined ? '=' : table[combined & 0x3f];
  }

  return output;
}

function toBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function normalizeForSigning(payload: UnsignedEntitlements): string {
  return JSON.stringify({
    appId: payload.appId,
    mode: payload.mode,
    hostedActive: payload.hostedActive,
    selfHostLicense: payload.selfHostLicense,
    updatePackYear: payload.updatePackYear ?? null,
    features: [...payload.features].sort(),
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt ?? null,
  });
}

async function signMessage(message: string, secret: string): Promise<string> {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error('WebCrypto API is unavailable in this runtime.');
  }

  const encoder = new TextEncoder();
  const key = await cryptoApi.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await cryptoApi.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message),
  );

  return toBase64Url(new Uint8Array(signatureBuffer));
}

/** Generate a signature for an entitlement payload. */
export async function createEntitlementSignature(
  payload: UnsignedEntitlements,
  secret: string,
): Promise<string> {
  return signMessage(normalizeForSigning(payload), secret);
}

export interface VerifyEntitlementOptions {
  revokedSignatures?: Iterable<string>;
  isRevoked?: (signature: string) => boolean;
}

/** Verify an entitlement payload against a shared signing secret. */
export async function verifyEntitlementSignature(
  entitlements: Entitlements,
  secret: string,
  options?: VerifyEntitlementOptions,
): Promise<boolean> {
  const parsed = EntitlementsSchema.safeParse(entitlements);
  if (!parsed.success) return false;

  if (options?.isRevoked?.(parsed.data.signature) === true) {
    return false;
  }

  if (options?.revokedSignatures) {
    for (const signature of options.revokedSignatures) {
      if (signature === parsed.data.signature) {
        return false;
      }
    }
  }

  const { signature, ...unsignedPayload } = parsed.data;
  const expected = await createEntitlementSignature(unsignedPayload, secret);
  return signature === expected;
}
