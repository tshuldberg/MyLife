import { POST } from '../route';
import { issueActorIdentityToken } from '@/lib/actor-identity';

vi.mock('@/lib/actor-identity', () => ({
  issueActorIdentityToken: vi.fn(),
}));

describe('POST /api/identity/actor/issue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function requestWithBody(body: unknown, opts?: { throwJson?: boolean }) {
    return {
      json: opts?.throwJson
        ? vi.fn().mockRejectedValue(new Error('bad json'))
        : vi.fn().mockResolvedValue(body),
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/identity/actor/issue'),
    } as any;
  }

  it('returns 400 for invalid JSON', async () => {
    const response = await POST(requestWithBody(null, { throwJson: true }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body.' });
  });

  it('returns 400 when userId is missing', async () => {
    const response = await POST(requestWithBody({ userId: '   ' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'userId is required.' });
  });

  it('returns 500 when actor token cannot be issued', async () => {
    vi.mocked(issueActorIdentityToken).mockReturnValue(null);

    const response = await POST(requestWithBody({ userId: 'demo-user' }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Actor identity secret is not configured.',
    });
  });

  it('returns token payload on success', async () => {
    vi.mocked(issueActorIdentityToken).mockReturnValue('actor-token-123');

    const response = await POST(requestWithBody({ userId: 'demo-user' }));

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload).toMatchObject({
      ok: true,
      userId: 'demo-user',
      actorToken: 'actor-token-123',
    });
    expect(typeof payload.issuedAt).toBe('string');
  });
});
