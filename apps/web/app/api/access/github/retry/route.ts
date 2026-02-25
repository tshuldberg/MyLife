import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/db';
import { grantGitHubSelfHostAccess } from '@/lib/access/github';
import {
  listDueAccessJobs,
  markAccessJobCompleted,
  scheduleAccessJobRetry,
} from '@/lib/access/jobs';

export const runtime = 'nodejs';

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? '10');
  if (!Number.isFinite(parsed) || parsed <= 0) return 10;
  return Math.min(100, Math.floor(parsed));
}

export async function POST(request: NextRequest) {
  const retryKey = process.env.MYLIFE_ACCESS_JOB_KEY;
  if (retryKey) {
    const provided = request.headers.get('x-access-job-key');
    if (!provided || provided !== retryKey) {
      return NextResponse.json({ error: 'Invalid access job key.' }, { status: 401 });
    }
  }

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
  const db = getAdapter();
  const jobs = listDueAccessJobs(db, new Date().toISOString(), limit);

  let processed = 0;
  let completed = 0;
  let pending = 0;
  let alerts = 0;

  for (const job of jobs) {
    processed += 1;

    const result = await grantGitHubSelfHostAccess({
      githubUsername: job.payload.githubUsername,
      email: job.payload.customerEmail,
    }).catch((error: unknown) => ({
      ok: false as const,
      status: 'failed' as const,
      detail: error instanceof Error ? error.message : 'Unknown retry exception.',
    }));

    if (result.ok) {
      markAccessJobCompleted(db, job.eventId);
      completed += 1;
      continue;
    }

    const updated = scheduleAccessJobRetry(
      db,
      job.eventId,
      result.detail ?? 'Unknown retry failure.',
      job.payload,
    );

    if (updated.status === 'alert') {
      alerts += 1;
    } else {
      pending += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    completed,
    pending,
    alerts,
  });
}
