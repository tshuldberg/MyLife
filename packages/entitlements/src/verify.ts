import crypto from 'node:crypto';
import { EntitlementsSchema, UnsignedEntitlementsSchema } from './schema';
import { isEntitlementExpired } from './runtime';
import type { Entitlements, UnsignedEntitlements } from './types';

export interface VerifyEntitlementSignatureOptions {
  nowMs?: number;
  isRevoked?: (signature: string) => boolean | Promise<boolean>;
}

function normalizeUnsignedEntitlements(input: UnsignedEntitlements): UnsignedEntitlements {
  return {
    appId: input.appId.trim(),
    mode: input.mode,
    hostedActive: input.hostedActive,
    selfHostLicense: input.selfHostLicense,
    updatePackYear: input.updatePackYear,
    features: [...new Set(input.features)].sort(),
    issuedAt: new Date(input.issuedAt).toISOString(),
    expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : undefined,
  };
}

function canonicalizeUnsignedEntitlements(input: UnsignedEntitlements): string {
  const normalized = normalizeUnsignedEntitlements(input);
  return JSON.stringify({
    appId: normalized.appId,
    mode: normalized.mode,
    hostedActive: normalized.hostedActive,
    selfHostLicense: normalized.selfHostLicense,
    updatePackYear: normalized.updatePackYear ?? null,
    features: normalized.features,
    issuedAt: normalized.issuedAt,
    expiresAt: normalized.expiresAt ?? null,
  });
}

export function stripEntitlementSignature(input: Entitlements): UnsignedEntitlements {
  return {
    appId: input.appId,
    mode: input.mode,
    hostedActive: input.hostedActive,
    selfHostLicense: input.selfHostLicense,
    updatePackYear: input.updatePackYear,
    features: input.features,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  };
}

export async function createEntitlementSignature(
  input: UnsignedEntitlements,
  secret: string,
): Promise<string> {
  const parsed = UnsignedEntitlementsSchema.parse(input);
  return crypto
    .createHmac('sha256', secret)
    .update(canonicalizeUnsignedEntitlements(parsed))
    .digest('base64url');
}

export async function verifyEntitlementSignature(
  input: Entitlements,
  secret: string,
  options?: VerifyEntitlementSignatureOptions,
): Promise<boolean> {
  const parsed = EntitlementsSchema.safeParse(input);
  if (!parsed.success) {
    return false;
  }

  if (isEntitlementExpired(parsed.data, options?.nowMs)) {
    return false;
  }

  if (options?.isRevoked) {
    const revoked = await options.isRevoked(parsed.data.signature);
    if (revoked) {
      return false;
    }
  }

  const expectedSignature = await createEntitlementSignature(
    stripEntitlementSignature(parsed.data),
    secret,
  );
  const receivedBuffer = Buffer.from(parsed.data.signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}
