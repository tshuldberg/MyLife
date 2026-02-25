import { expect, test } from '@playwright/test';

test.describe('API auth and data pipelines', () => {
  test('entitlement issuance/webhook/sync pipeline enforces auth and returns expected data', async ({ request }) => {
    const issueWithoutKey = await request.post('/api/entitlements/issue', {
      data: {
        appId: 'mylife',
        mode: 'hosted',
        hostedActive: true,
        selfHostLicense: false,
      },
    });
    expect(issueWithoutKey.status()).toBe(401);

    const issueWithKey = await request.post('/api/entitlements/issue', {
      headers: {
        'x-entitlement-issuer-key': 'mylife-e2e-issuer-key',
      },
      data: {
        appId: 'mylife',
        mode: 'hosted',
        hostedActive: true,
        selfHostLicense: false,
        features: ['books', 'sharing'],
      },
    });
    expect(issueWithKey.status()).toBe(200);
    const issuedBody = await issueWithKey.json();
    expect(typeof issuedBody.token).toBe('string');
    expect(issuedBody.entitlements.hostedActive).toBe(true);

    const syncWithoutKey = await request.get('/api/entitlements/sync');
    expect(syncWithoutKey.status()).toBe(401);

    const syncBeforeWebhook = await request.get('/api/entitlements/sync', {
      headers: {
        'x-entitlement-sync-key': 'mylife-e2e-sync-key',
      },
    });
    expect(syncBeforeWebhook.status()).toBe(404);

    const webhookWithoutKey = await request.post('/api/webhooks/billing', {
      data: {
        eventId: `e2e-missing-key-${Date.now()}`,
        eventType: 'purchase.created',
        sku: 'mylife_hosted_monthly_v1',
      },
    });
    expect(webhookWithoutKey.status()).toBe(401);

    const webhookWithKey = await request.post('/api/webhooks/billing', {
      headers: {
        'x-billing-webhook-key': 'mylife-e2e-webhook-key',
      },
      data: {
        eventId: `e2e-webhook-${Date.now()}`,
        eventType: 'purchase.created',
        sku: 'mylife_hosted_monthly_v1',
        appId: 'mylife',
        features: ['books', 'sharing'],
      },
    });
    expect(webhookWithKey.status()).toBe(200);
    const webhookBody = await webhookWithKey.json();
    expect(webhookBody.ok).toBe(true);

    const syncAfterWebhook = await request.get('/api/entitlements/sync', {
      headers: {
        'x-entitlement-sync-key': 'mylife-e2e-sync-key',
      },
    });
    expect(syncAfterWebhook.status()).toBe(200);
    const syncedBody = await syncAfterWebhook.json();
    expect(syncedBody.entitlements.hostedActive).toBe(true);
    expect(syncedBody.entitlements.features).toContain('books');
  });

  test('social share and friend invite endpoints require identity and persist relationships', async ({ request }) => {
    const missingIdentityShare = await request.post('/api/share/events', {
      data: {
        objectType: 'generic',
        objectId: 'api-e2e-book',
        visibility: 'friends',
      },
    });
    expect(missingIdentityShare.status()).toBe(400);

    const invalidIdentityShare = await request.post('/api/share/events', {
      data: {
        actorToken: 'invalid.token.value',
        actorUserId: 'api-alice',
        objectType: 'generic',
        objectId: 'api-e2e-book',
        visibility: 'friends',
      },
    });
    expect(invalidIdentityShare.status()).toBe(401);

    const createShare = await request.post('/api/share/events', {
      data: {
        actorUserId: 'api-alice',
        objectType: 'generic',
        objectId: 'api-e2e-book',
        visibility: 'friends',
        payload: { note: 'E2E API share test' },
      },
    });
    expect(createShare.status()).toBe(201);
    const createdShareBody = await createShare.json();
    expect(createdShareBody.item.actorUserId).toBe('api-alice');

    const listShare = await request.get('/api/share/events?viewerUserId=api-alice&objectId=api-e2e-book');
    expect(listShare.status()).toBe(200);
    const listShareBody = await listShare.json();
    expect(listShareBody.items.length).toBeGreaterThan(0);

    const createInvite = await request.post('/api/friends/invites', {
      data: {
        fromUserId: 'api-alice',
        toUserId: 'api-bob',
        message: 'hello from api test',
      },
    });
    expect(createInvite.status()).toBe(201);
    const inviteBody = await createInvite.json();
    const inviteId = inviteBody.invite.id as string;
    expect(inviteBody.invite.status).toBe('pending');

    const incomingBeforeAccept = await request.get('/api/friends/invites?userId=api-bob&direction=incoming');
    expect(incomingBeforeAccept.status()).toBe(200);
    const incomingBody = await incomingBeforeAccept.json();
    expect(incomingBody.incoming.some((invite: { id: string }) => invite.id === inviteId)).toBe(true);

    const acceptInvite = await request.post(`/api/friends/invites/${inviteId}/accept`, {
      data: {
        actorUserId: 'api-bob',
      },
    });
    expect(acceptInvite.status()).toBe(200);

    const aliceFriends = await request.get('/api/friends?userId=api-alice');
    expect(aliceFriends.status()).toBe(200);
    const aliceFriendsBody = await aliceFriends.json();
    expect(
      aliceFriendsBody.friends.some(
        (friend: { friendUserId: string; status: string }) =>
          friend.friendUserId === 'api-bob' && friend.status === 'accepted',
      ),
    ).toBe(true);
  });
});
