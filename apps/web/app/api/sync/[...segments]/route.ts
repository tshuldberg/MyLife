import { NextRequest, NextResponse } from 'next/server';
import { getModeConfig } from '@/lib/entitlements';
import { resolveApiBaseUrl } from '@/lib/server-endpoint';

export const runtime = 'nodejs';

function buildCurrentBaseUrl(request: NextRequest): string {
  const protocol = request.headers.get('x-forwarded-proto')
    ?? request.nextUrl.protocol.replace(':', '')
    ?? 'http';
  const host = request.headers.get('x-forwarded-host')
    ?? request.headers.get('host')
    ?? request.nextUrl.host;
  return `${protocol}://${host}`;
}

function resolveTargetBaseUrl(request: NextRequest): string | null {
  const mode = getModeConfig();
  if (mode.mode === 'local_only') {
    return buildCurrentBaseUrl(request);
  }

  const resolved = resolveApiBaseUrl(mode.mode, mode.serverUrl);
  if (resolved.ok && resolved.url) {
    return resolved.url;
  }

  if (mode.mode === 'hosted') {
    return buildCurrentBaseUrl(request);
  }

  return null;
}

async function proxy(request: NextRequest, method: 'GET' | 'POST' | 'DELETE') {
  const segments = request.nextUrl.pathname
    .replace(/^\/api\/sync\/?/, '')
    .split('/')
    .filter(Boolean);

  if (segments.length === 0) {
    return NextResponse.json({ error: 'Sync path is required.' }, { status: 400 });
  }

  if (segments[0] === 'sync') {
    return NextResponse.json({ error: 'Recursive sync route is not allowed.' }, { status: 400 });
  }

  const baseUrl = resolveTargetBaseUrl(request);
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'No remote sync endpoint is configured for current mode.' },
      { status: 400 },
    );
  }

  const target = new URL(`/api/${segments.join('/')}`, `${baseUrl}/`);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const outboundHeaders = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) outboundHeaders.set('content-type', contentType);
  const actorToken = request.headers.get('x-actor-identity-token');
  if (actorToken) outboundHeaders.set('x-actor-identity-token', actorToken);
  const entitlementSyncKey = request.headers.get('x-entitlement-sync-key');
  if (entitlementSyncKey) outboundHeaders.set('x-entitlement-sync-key', entitlementSyncKey);

  const body = method === 'GET' ? undefined : await request.text();
  const response = await fetch(target.toString(), {
    method,
    headers: outboundHeaders,
    body: method === 'GET' ? undefined : body,
    cache: 'no-store',
  });

  const raw = await response.text();
  const responseHeaders = new Headers();
  const responseContentType = response.headers.get('content-type');
  if (responseContentType) {
    responseHeaders.set('content-type', responseContentType);
  }

  return new NextResponse(raw, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest) {
  return proxy(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxy(request, 'POST');
}

export async function DELETE(request: NextRequest) {
  return proxy(request, 'DELETE');
}
