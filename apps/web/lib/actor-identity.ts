import crypto from 'node:crypto';

export interface ActorIdentityPayload {
  userId: string;
  issuedAt: string;
}

export interface VerifiedActorIdentity {
  ok: boolean;
  userId?: string;
  issuedAt?: string;
  reason?: 'missing_secret' | 'invalid_format' | 'invalid_signature' | 'invalid_payload';
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function canonicalize(payload: ActorIdentityPayload): string {
  return JSON.stringify({
    userId: payload.userId,
    issuedAt: payload.issuedAt,
  });
}

function signPayload(payloadBase64: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');
}

export function getActorIdentitySecret(): string | null {
  const secret = process.env.MYLIFE_ACTOR_IDENTITY_SECRET ?? process.env.MYLIFE_ENTITLEMENT_SECRET ?? null;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }
  if (process.env.NODE_ENV !== 'production') {
    // Refuse the dev fallback if the app is being served on a non-localhost origin.
    const origin = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
    try {
      const hostname = new URL(origin).hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1') {
        console.error(
          '[actor-identity] Dev fallback secret refused: non-localhost origin detected (%s). Set MYLIFE_ACTOR_IDENTITY_SECRET.',
          origin
        );
        return null;
      }
    } catch {
      // If origin is empty or unparseable, allow fallback (local dev without URL configured).
    }
    console.warn(
      '[actor-identity] Using dev fallback secret. Set MYLIFE_ACTOR_IDENTITY_SECRET for production.'
    );
    return 'mylife-dev-actor-identity-secret';
  }
  return null;
}

export function issueActorIdentityToken(
  userId: string,
  issuedAt = new Date().toISOString(),
): string | null {
  const secret = getActorIdentitySecret();
  if (!secret) return null;

  const payload: ActorIdentityPayload = {
    userId: userId.trim(),
    issuedAt,
  };

  const payloadBase64 = toBase64Url(canonicalize(payload));
  const signature = signPayload(payloadBase64, secret);
  return `v1.${payloadBase64}.${signature}`;
}

export function verifyActorIdentityToken(token: string): VerifiedActorIdentity {
  const secret = getActorIdentitySecret();
  if (!secret) return { ok: false, reason: 'missing_secret' };

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    return { ok: false, reason: 'invalid_format' };
  }

  const payloadBase64 = parts[1];
  const providedSignature = parts[2];
  const expectedSignature = signPayload(payloadBase64, secret);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length) {
    return { ok: false, reason: 'invalid_signature' };
  }
  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return { ok: false, reason: 'invalid_signature' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(payloadBase64)) as unknown;
  } catch {
    return { ok: false, reason: 'invalid_payload' };
  }

  if (
    typeof parsed !== 'object'
    || parsed === null
    || typeof (parsed as Record<string, unknown>).userId !== 'string'
    || typeof (parsed as Record<string, unknown>).issuedAt !== 'string'
  ) {
    return { ok: false, reason: 'invalid_payload' };
  }

  const userId = ((parsed as Record<string, unknown>).userId as string).trim();
  const issuedAt = (parsed as Record<string, unknown>).issuedAt as string;
  if (!userId) return { ok: false, reason: 'invalid_payload' };

  const issuedAtDate = new Date(issuedAt);
  if (Number.isNaN(issuedAtDate.getTime())) {
    return { ok: false, reason: 'invalid_payload' };
  }

  return {
    ok: true,
    userId,
    issuedAt: issuedAtDate.toISOString(),
  };
}
