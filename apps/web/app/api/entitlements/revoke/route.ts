import { NextRequest, NextResponse } from 'next/server';
import { revokeHubEntitlement } from '@mylife/db';
import { getAdapter } from '@/lib/db';
import { clearStoredEntitlement, getStoredEntitlement } from '@/lib/entitlements';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function POST(request: NextRequest) {
  const revokeKey = process.env.MYLIFE_ENTITLEMENT_REVOKE_KEY ?? process.env.MYLIFE_ENTITLEMENT_ISSUER_KEY;
  if (revokeKey) {
    const provided = request.headers.get('x-entitlement-revoke-key');
    if (!provided || provided !== revokeKey) {
      return NextResponse.json({ error: 'Invalid revoke key.' }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.signature !== 'string' || body.signature.trim().length === 0) {
    return NextResponse.json({ error: 'signature is required.' }, { status: 400 });
  }

  const signature = body.signature.trim();
  const reason = typeof body.reason === 'string' ? body.reason : undefined;
  const sourceEventId = typeof body.sourceEventId === 'string' ? body.sourceEventId : undefined;

  const db = getAdapter();
  revokeHubEntitlement(db, signature, reason, sourceEventId);

  const current = getStoredEntitlement();
  if (current?.signature === signature) {
    clearStoredEntitlement();
  }

  return NextResponse.json({
    ok: true,
    signature,
  });
}
