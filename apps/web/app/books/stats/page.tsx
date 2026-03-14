'use client';

import { useEffect, useState } from 'react';
import {
  fetchBookCount,
  fetchBookStatusCounts,
  fetchGoalProgress,
  fetchReadingStats,
} from '../actions';
import { formatMonthLabel } from '../ui';

interface ReadingStats {
  totalBooks: number;
  totalPages: number;
  averageRating: number;
  averagePagesPerBook: number;
  booksPerMonth: Record<string, number>;
  topAuthors: Array<{ author: string; count: number }>;
}

interface GoalProgress {
  booksRead: number;
  goal?: { target_books?: number | null } | null;
}

interface StatusCounts {
  reading: number;
  wantToRead: number;
  finished: number;
  dnf: number;
}

export default function BooksStatsPage() {
  const currentYear = new Date().getFullYear();
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [bookCount, setBookCount] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchReadingStats(),
      fetchGoalProgress(currentYear),
      fetchBookCount(),
      fetchBookStatusCounts(),
    ]).then(([nextReadingStats, nextGoalProgress, nextBookCount, nextStatusCounts]) => {
      if (cancelled) return;
      setReadingStats(nextReadingStats as ReadingStats);
      setGoalProgress(nextGoalProgress as GoalProgress);
      setBookCount(nextBookCount as number);
      setStatusCounts(nextStatusCounts as StatusCounts);
    });

    return () => {
      cancelled = true;
    };
  }, [currentYear]);

  const goalTarget = goalProgress?.goal?.target_books ?? 0;
  const progressPercent = goalTarget > 0
    ? Math.round(((goalProgress?.booksRead ?? 0) / goalTarget) * 100)
    : 0;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section
        style={{
          padding: 24,
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(123, 83, 36, 0.12)',
          boxShadow: '0 16px 32px rgba(80, 54, 25, 0.08)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 32 }}>Reading Stats</h1>
        <p style={{ margin: '10px 0 0', color: '#6B5845' }}>
          Your reading journey at a glance
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
        {[
          ['Total books', String(readingStats?.totalBooks ?? bookCount ?? 0)],
          ['Pages read', String(readingStats?.totalPages ?? 0)],
          ['Average rating', readingStats ? readingStats.averageRating.toFixed(1) : '0.0'],
          ['Avg. pages / book', readingStats ? String(Math.round(readingStats.averagePagesPerBook)) : '0'],
        ].map(([label, value]) => (
          <article
            key={label}
            style={{
              padding: 18,
              borderRadius: 20,
              border: '1px solid rgba(123, 83, 36, 0.12)',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div style={{ color: '#6B5845', fontWeight: 700 }}>{label}</div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{value}</div>
          </article>
        ))}
      </section>

      <section
        style={{
          padding: 24,
          borderRadius: 24,
          border: '1px solid rgba(123, 83, 36, 0.12)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>{currentYear} Reading Goal</h2>
        <p style={{ margin: '12px 0 0', fontSize: 24, fontWeight: 800 }}>
          {(goalProgress?.booksRead ?? 0)} / {goalTarget} books
        </p>
        <p style={{ margin: '6px 0 0', color: '#6B5845' }}>{progressPercent}% complete</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <article
          style={{
            padding: 24,
            borderRadius: 24,
            border: '1px solid rgba(123, 83, 36, 0.12)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Monthly pace</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
            {Object.entries(readingStats?.booksPerMonth ?? {}).map(([month, count]) => (
              <div key={month} style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontWeight: 700 }}>{formatMonthLabel(month)}</span>
                  <span style={{ color: '#6B5845' }}>{count}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, backgroundColor: '#F4E7D7', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.max(12, count * 24)}%`,
                      height: '100%',
                      backgroundColor: '#8C5A2B',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article
          style={{
            padding: 24,
            borderRadius: 24,
            border: '1px solid rgba(123, 83, 36, 0.12)',
            backgroundColor: '#FFFFFF',
            display: 'grid',
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Library mix</h2>
          <div>Reading</div>
          <strong>{statusCounts?.reading ?? 0}</strong>
          <div>Want to Read</div>
          <strong>{statusCounts?.wantToRead ?? 0}</strong>
          <div>Finished</div>
          <strong>{statusCounts?.finished ?? 0}</strong>
          <div>DNF</div>
          <strong>{statusCounts?.dnf ?? 0}</strong>
        </article>
      </section>

      <section
        style={{
          padding: 24,
          borderRadius: 24,
          border: '1px solid rgba(123, 83, 36, 0.12)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Top authors</h2>
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          {(readingStats?.topAuthors ?? []).map((author) => (
            <div key={author.author} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span>{author.author}</span>
              <strong>{author.count}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
