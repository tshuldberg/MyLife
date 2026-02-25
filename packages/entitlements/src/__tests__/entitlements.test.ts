import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EntitlementsSchema,
  createEntitlementSignature,
  verifyEntitlementSignature,
  canUseHosted,
  canUseSelfHost,
  canUseUpdatePack,
  isEntitlementExpired,
} from '../index';
import type { Entitlements, UnsignedEntitlements } from '../types';

const NOW = Date.parse('2026-02-24T00:00:00.000Z');
const SECRET = 'test-shared-secret';

async function buildSignedEntitlements(
  partial: Partial<UnsignedEntitlements> = {},
): Promise<Entitlements> {
  const base: UnsignedEntitlements = {
    appId: 'books',
    mode: 'hosted',
    hostedActive: true,
    selfHostLicense: false,
    updatePackYear: 2026,
    features: ['sharing', 'sync'],
    issuedAt: '2026-02-24T00:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
    ...partial,
  };

  const signature = await createEntitlementSignature(base, SECRET);
  return { ...base, signature };
}

describe('@mylife/entitlements', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts a valid entitlement payload shape', async () => {
    const ent = await buildSignedEntitlements();
    expect(EntitlementsSchema.safeParse(ent).success).toBe(true);
  });

  it('verifies a valid entitlement signature', async () => {
    const ent = await buildSignedEntitlements();
    await expect(verifyEntitlementSignature(ent, SECRET)).resolves.toBe(true);
  });

  it('rejects a tampered entitlement', async () => {
    const ent = await buildSignedEntitlements();
    const tampered = { ...ent, hostedActive: false };
    await expect(verifyEntitlementSignature(tampered, SECRET)).resolves.toBe(false);
  });

  it('returns false for invalid entitlement payloads during verification', async () => {
    const invalid = { appId: 'books' } as Entitlements;
    await expect(verifyEntitlementSignature(invalid, SECRET)).resolves.toBe(false);
  });

  it('rejects a revoked entitlement via revokedSignatures option', async () => {
    const ent = await buildSignedEntitlements();
    await expect(
      verifyEntitlementSignature(ent, SECRET, {
        revokedSignatures: [ent.signature],
      }),
    ).resolves.toBe(false);
  });

  it('rejects a revoked entitlement via isRevoked callback', async () => {
    const ent = await buildSignedEntitlements();
    await expect(
      verifyEntitlementSignature(ent, SECRET, {
        isRevoked: (signature) => signature === ent.signature,
      }),
    ).resolves.toBe(false);
  });

  it('marks expired entitlements correctly', async () => {
    const ent = await buildSignedEntitlements({ expiresAt: '2025-01-01T00:00:00.000Z' });
    expect(isEntitlementExpired(ent, NOW)).toBe(true);
  });

  it('treats invalid expiry timestamps as expired', async () => {
    const ent = await buildSignedEntitlements({ expiresAt: 'not-a-date' });
    expect(isEntitlementExpired(ent, NOW)).toBe(true);
  });

  it('allows hosted mode when active and not expired', async () => {
    const ent = await buildSignedEntitlements({ mode: 'hosted', hostedActive: true });
    expect(canUseHosted(ent, NOW)).toBe(true);
    expect(canUseSelfHost(ent, NOW)).toBe(false);
  });

  it('allows self-host mode when licensed and not expired', async () => {
    const ent = await buildSignedEntitlements({
      mode: 'self_host',
      hostedActive: false,
      selfHostLicense: true,
      expiresAt: undefined,
    });
    expect(canUseSelfHost(ent, NOW)).toBe(true);
    expect(canUseHosted(ent, NOW)).toBe(false);
  });

  it('enforces update pack year checks', async () => {
    const ent = await buildSignedEntitlements({ updatePackYear: 2026 });
    expect(canUseUpdatePack(ent, 2026, NOW)).toBe(true);
    expect(canUseUpdatePack(ent, 2027, NOW)).toBe(false);
  });

  it('denies update packs when entitlement is expired', async () => {
    const ent = await buildSignedEntitlements({
      updatePackYear: 2026,
      expiresAt: '2025-01-01T00:00:00.000Z',
    });
    expect(canUseUpdatePack(ent, 2026, NOW)).toBe(false);
  });

  it('denies update packs when updatePackYear is missing', async () => {
    const ent = await buildSignedEntitlements({ updatePackYear: undefined });
    expect(canUseUpdatePack(ent, 2026, NOW)).toBe(false);
  });

  it('accepts revokedSignatures option when no signature matches', async () => {
    const ent = await buildSignedEntitlements();
    await expect(
      verifyEntitlementSignature(ent, SECRET, {
        revokedSignatures: ['not-the-current-signature'],
      }),
    ).resolves.toBe(true);
  });

  it('throws when WebCrypto is unavailable during signing', async () => {
    vi.stubGlobal('crypto', undefined);

    const payload: UnsignedEntitlements = {
      appId: 'books',
      mode: 'hosted',
      hostedActive: true,
      selfHostLicense: false,
      updatePackYear: 2026,
      features: ['sync'],
      issuedAt: '2026-02-24T00:00:00.000Z',
      expiresAt: '2026-12-31T23:59:59.000Z',
    };

    await expect(createEntitlementSignature(payload, SECRET)).rejects.toThrow(
      'WebCrypto API is unavailable in this runtime.',
    );
  });

  it('supports single-byte signature buffers', async () => {
    vi.stubGlobal('crypto', {
      subtle: {
        importKey: async () => ({}),
        sign: async () => new Uint8Array([1]).buffer,
      },
    });

    const payload: UnsignedEntitlements = {
      appId: 'books',
      mode: 'hosted',
      hostedActive: true,
      selfHostLicense: false,
      updatePackYear: 2026,
      features: ['sync'],
      issuedAt: '2026-02-24T00:00:00.000Z',
      expiresAt: '2026-12-31T23:59:59.000Z',
    };

    await expect(createEntitlementSignature(payload, SECRET)).resolves.toBe('AQ');
  });
});
