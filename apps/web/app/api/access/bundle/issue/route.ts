import { NextRequest, NextResponse } from 'next/server';
import { issueSignedBundleDownloadUrl } from '@/lib/access/bundle';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function POST(request: NextRequest) {
  const issuerKey = process.env.MYLIFE_BUNDLE_ISSUER_KEY;
  if (issuerKey) {
    const provided = request.headers.get('x-bundle-issuer-key');
    if (!provided || provided !== issuerKey) {
      return NextResponse.json({ error: 'Invalid bundle issuer key.' }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Body must be an object.' }, { status: 400 });
  }

  const bundleId = typeof body.bundleId === 'string' ? body.bundleId : undefined;
  const eventId = typeof body.eventId === 'string' ? body.eventId : undefined;
  const purchaserRef = typeof body.purchaserRef === 'string' ? body.purchaserRef : undefined;
  const expiresInSeconds = typeof body.expiresInSeconds === 'number' ? body.expiresInSeconds : undefined;

  if (!bundleId || !eventId) {
    return NextResponse.json({ error: 'bundleId and eventId are required.' }, { status: 400 });
  }

  const issued = issueSignedBundleDownloadUrl({
    bundleId,
    eventId,
    purchaserRef,
    requestBaseUrl: request.nextUrl.origin,
    expiresInSeconds,
  });

  if (!issued.ok) {
    return NextResponse.json({ error: 'Failed to issue bundle URL.', reason: issued.reason }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    downloadUrl: issued.url,
    expiresAt: issued.expiresAt,
    token: issued.token,
  });
}
