'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchSleepSessions } from '../actions';

interface SleepSession {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  quality_score: number | null;
  deep_minutes: number | null;
  rem_minutes: number | null;
  light_minutes: number | null;
  awake_minutes: number | null;
  source: string;
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  backLink: { color: '#10B981', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' },
  subtitle: { color: '#9CA3AF', marginBottom: '2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#1E1E1E', borderRadius: 8, padding: '1rem', border: '1px solid #333' },
  statLabel: { fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase' as const, marginBottom: '0.5rem' },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: '#10B981' },
  statUnit: { fontSize: '0.75rem', color: '#9CA3AF' },
  card: { background: '#1E1E1E', borderRadius: 8, padding: '1rem', border: '1px solid #333', marginBottom: '0.75rem' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  cardDate: { fontWeight: 600, color: '#E5E7EB', fontSize: '0.9rem' },
  cardDuration: { fontSize: '1.25rem', fontWeight: 700, color: '#10B981' },
  stagesRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const },
  stageBadge: { fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 4, background: '#111', border: '1px solid #333', color: '#D1D5DB' },
  qualityBar: { height: 6, borderRadius: 3, background: '#333', marginTop: '0.5rem', overflow: 'hidden' },
  qualityFill: { height: '100%', borderRadius: 3, background: '#10B981' },
  empty: { textAlign: 'center' as const, color: '#6B7280', padding: '2rem', fontSize: '0.9rem' },
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function qualityLabel(score: number | null): string {
  if (score == null) return 'N/A';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

export default function SleepPage() {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchSleepSessions(30);
      setSessions(data as SleepSession[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading sleep data...</div></div>;
  }

  // Compute averages from recent sessions
  const recent7 = sessions.slice(0, 7);
  const avgDuration = recent7.length > 0
    ? Math.round(recent7.reduce((s, r) => s + r.duration_minutes, 0) / recent7.length)
    : 0;
  const avgQuality = recent7.filter((r) => r.quality_score != null).length > 0
    ? Math.round(recent7.filter((r) => r.quality_score != null).reduce((s, r) => s + (r.quality_score ?? 0), 0) / recent7.filter((r) => r.quality_score != null).length)
    : null;
  const lastSession = sessions[0] ?? null;

  return (
    <div style={styles.page}>
      <Link href="/health" style={styles.backLink}>Back to Health</Link>
      <h1 style={styles.title}>Sleep</h1>
      <p style={styles.subtitle}>Sleep sessions and quality tracking</p>

      {/* Summary Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Last Night</div>
          <div style={styles.statValue}>
            {lastSession ? formatDuration(lastSession.duration_minutes) : '--'}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>7-Day Average</div>
          <div style={styles.statValue}>
            {avgDuration > 0 ? formatDuration(avgDuration) : '--'}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Avg Quality</div>
          <div style={styles.statValue}>
            {avgQuality != null ? `${avgQuality}%` : '--'}
          </div>
          {avgQuality != null && (
            <div style={styles.statUnit}>{qualityLabel(avgQuality)}</div>
          )}
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Sessions Logged</div>
          <div style={styles.statValue}>{sessions.length}</div>
        </div>
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <div style={styles.empty}>
          No sleep sessions recorded yet. Sleep data syncs from your wearable device.
        </div>
      ) : (
        sessions.map((session) => (
          <div key={session.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardDate}>
                {new Date(session.start_time).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </div>
              <div style={styles.cardDuration}>{formatDuration(session.duration_minutes)}</div>
            </div>

            {/* Sleep stages */}
            <div style={styles.stagesRow}>
              {session.deep_minutes != null && (
                <span style={styles.stageBadge}>Deep: {session.deep_minutes}m</span>
              )}
              {session.rem_minutes != null && (
                <span style={styles.stageBadge}>REM: {session.rem_minutes}m</span>
              )}
              {session.light_minutes != null && (
                <span style={styles.stageBadge}>Light: {session.light_minutes}m</span>
              )}
              {session.awake_minutes != null && (
                <span style={styles.stageBadge}>Awake: {session.awake_minutes}m</span>
              )}
              <span style={{ ...styles.stageBadge, borderColor: '#555' }}>
                {session.source}
              </span>
            </div>

            {/* Quality bar */}
            {session.quality_score != null && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Quality</span>
                  <span style={{ fontSize: '0.75rem', color: '#D1D5DB' }}>
                    {session.quality_score}% - {qualityLabel(session.quality_score)}
                  </span>
                </div>
                <div style={styles.qualityBar}>
                  <div style={{ ...styles.qualityFill, width: `${session.quality_score}%` }} />
                </div>
              </div>
            )}
          </div>
        ))
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#6B7280' }}>
        Sleep sessions sync automatically from Apple Health or Health Connect on mobile devices.
      </div>
    </div>
  );
}
