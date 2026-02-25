import { NextRequest, NextResponse } from 'next/server';
import { listFriendsForUser, removeFriendship } from '@mylife/db';
import { getAdapter } from '@/lib/db';
import { resolveActorIdentity } from '@/app/api/_shared/actor-identity';

export const runtime = 'nodejs';

function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function GET(request: NextRequest) {
  const identity = resolveActorIdentity({
    token: request.nextUrl.searchParams.get('actorToken')
      ?? request.headers.get('x-actor-identity-token')
      ?? undefined,
    userId: request.nextUrl.searchParams.get('userId')?.trim(),
    required: true,
  });
  if (!identity.ok || !identity.userId) {
    return NextResponse.json(
      { error: identity.error ?? 'user identity is required.' },
      { status: identity.status ?? 400 },
    );
  }
  const userId = identity.userId;

  const db = getAdapter();
  const friends = listFriendsForUser(db, userId);

  return NextResponse.json({
    userId,
    friends: friends.map((friend) => ({
      userId: friend.user_id,
      friendUserId: friend.friend_user_id,
      status: friend.status,
      sourceInviteId: friend.source_invite_id,
      createdAt: friend.created_at,
      updatedAt: friend.updated_at,
      displayName: friend.display_name,
      handle: friend.handle,
      avatarUrl: friend.avatar_url,
    })),
  });
}

export async function DELETE(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Body must be an object.' }, { status: 400 });
  }

  const identity = resolveActorIdentity({
    token: body.actorToken ?? request.headers.get('x-actor-identity-token') ?? undefined,
    userId: body.userId,
    required: true,
  });
  if (!identity.ok || !identity.userId) {
    return NextResponse.json(
      { error: identity.error ?? 'user identity is required.' },
      { status: identity.status ?? 400 },
    );
  }

  const userId = identity.userId;
  const friendUserId = parseOptionalString(body.friendUserId);

  if (!userId || !friendUserId) {
    return NextResponse.json({ error: 'userId and friendUserId are required.' }, { status: 400 });
  }

  const db = getAdapter();
  removeFriendship(db, userId, friendUserId);

  return NextResponse.json({
    ok: true,
    userId,
    friendUserId,
  });
}
