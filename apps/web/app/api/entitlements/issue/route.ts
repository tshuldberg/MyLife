import { NextRequest, NextResponse } from 'next/server';
import {
  parseIssueEntitlementInput,
  issueSignedEntitlement,
} from '@/lib/billing/entitlement-issuer';

export const runtime = 'nodejs';

function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const issuerKey = process.env.MYLIFE_ENTITLEMENT_ISSUER_KEY;
  const signingSecret = process.env.MYLIFE_ENTITLEMENT_SECRET;

  if (!issuerKey || !signingSecret) {
    return NextResponse.json(
      { error: 'Issuer key or entitlement signing secret is not configured.' },
      { status: 500 },
    );
  }

  const providedKey = request.headers.get('x-entitlement-issuer-key');
  if (!providedKey || providedKey !== issuerKey) {
    return unauthorized('Invalid issuer key.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = parseIssueEntitlementInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const issued = await issueSignedEntitlement(parsed.data, signingSecret);

  return NextResponse.json({
    token: issued.token,
    entitlements: issued.entitlements,
  });
}
