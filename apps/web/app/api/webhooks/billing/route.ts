import { NextRequest, NextResponse } from 'next/server';
import { BILLING_EVENT_TYPES, BILLING_SKUS } from '@mylife/billing-config';
import { getPreference, revokeHubEntitlement, setPreference } from '@mylife/db';
import { getAdapter } from '@/lib/db';
import { getStoredEntitlement, saveEntitlement } from '@/lib/entitlements';
import {
  runSelfHostAccessProvisioning,
  runSelfHostAccessRevocation,
} from '@/lib/access/provisioning';
import {
  parseBillingWebhookPayload,
  deriveEntitlementFromBillingEvent,
  issueSignedEntitlement,
} from '@/lib/billing/entitlement-issuer';
import { requireEnvVar } from '@/lib/env-guard';

export const runtime = 'nodejs';

function idempotencyKey(eventId: string): string {
  return `billing_event:${eventId}`;
}

export async function POST(request: NextRequest) {
  let webhookKey: string;
  let signingSecret: string;
  try {
    webhookKey = requireEnvVar('MYLIFE_BILLING_WEBHOOK_KEY');
    signingSecret = requireEnvVar('MYLIFE_ENTITLEMENT_SECRET');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Required secrets not configured.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const providedKey = request.headers.get('x-billing-webhook-key');
  if (!providedKey || providedKey !== webhookKey) {
    return NextResponse.json({ error: 'Invalid webhook key.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = parseBillingWebhookPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const db = getAdapter();
  const eventKey = idempotencyKey(parsed.data.eventId);
  const alreadyProcessed = getPreference(db, eventKey);
  if (alreadyProcessed) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      eventId: parsed.data.eventId,
    });
  }

  const current = getStoredEntitlement();

  if (
    parsed.data.sku === BILLING_SKUS.selfHostLifetime
    && (
      parsed.data.eventType === BILLING_EVENT_TYPES.purchaseRefunded
      || parsed.data.eventType === BILLING_EVENT_TYPES.purchaseDisputed
    )
    && current?.signature
  ) {
    revokeHubEntitlement(
      db,
      current.signature,
      `billing:${parsed.data.eventType}`,
      parsed.data.eventId,
    );
  }

  const nextUnsigned = deriveEntitlementFromBillingEvent(parsed.data, current);

  const issued = await issueSignedEntitlement(
    {
      appId: nextUnsigned.appId,
      mode: nextUnsigned.mode,
      hostedActive: nextUnsigned.hostedActive,
      selfHostLicense: nextUnsigned.selfHostLicense,
      updatePackYear: nextUnsigned.updatePackYear,
      features: nextUnsigned.features,
      issuedAt: nextUnsigned.issuedAt,
      expiresAt: nextUnsigned.expiresAt,
    },
    signingSecret,
  );

  const saveResult = await saveEntitlement(issued.token, issued.entitlements);
  if (!saveResult.ok) {
    return NextResponse.json(
      { error: 'Failed to persist entitlement.', reason: saveResult.reason },
      { status: 500 },
    );
  }

  setPreference(db, eventKey, new Date().toISOString());

  const provisioning = await runSelfHostAccessProvisioning(db, {
    ...parsed.data,
    requestBaseUrl: request.nextUrl.origin,
  });

  const accessRevocation = await runSelfHostAccessRevocation(db, {
    ...parsed.data,
    requestBaseUrl: request.nextUrl.origin,
  });

  return NextResponse.json({
    ok: true,
    idempotent: false,
    eventId: parsed.data.eventId,
    entitlements: issued.entitlements,
    provisioning: provisioning ?? undefined,
    accessRevocation: accessRevocation ?? undefined,
  });
}
