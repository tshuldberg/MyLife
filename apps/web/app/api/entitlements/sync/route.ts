import { NextRequest, NextResponse } from 'next/server';
import { getHubEntitlement } from '@mylife/db';
import { getAdapter } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const syncKey = process.env.MYLIFE_ENTITLEMENT_SYNC_KEY;
  if (syncKey) {
    const provided = request.headers.get('x-entitlement-sync-key');
    if (!provided || provided !== syncKey) {
      return NextResponse.json({ error: 'Invalid sync key.' }, { status: 401 });
    }
  }

  const db = getAdapter();
  const cached = getHubEntitlement(db);

  if (!cached) {
    return NextResponse.json({ error: 'No entitlement found.' }, { status: 404 });
  }

  const entitlements = {
    appId: cached.app_id,
    mode: cached.mode,
    hostedActive: cached.hosted_active,
    selfHostLicense: cached.self_host_license,
    updatePackYear: cached.update_pack_year ?? undefined,
    features: cached.features,
    issuedAt: cached.issued_at,
    expiresAt: cached.expires_at ?? undefined,
    signature: cached.signature,
  };

  return NextResponse.json({
    token: cached.raw_token,
    entitlements,
    syncedAt: new Date().toISOString(),
  });
}
