import { NextRequest, NextResponse } from 'next/server';
import { issueActorIdentityToken } from '@/lib/actor-identity';

export const runtime = 'nodejs';

function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Body must be an object.' }, { status: 400 });
  }

  const userId = parseOptionalString((body as Record<string, unknown>).userId);
  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }

  const token = issueActorIdentityToken(userId);
  if (!token) {
    return NextResponse.json(
      { error: 'Actor identity secret is not configured.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    userId,
    actorToken: token,
    issuedAt: new Date().toISOString(),
  });
}
