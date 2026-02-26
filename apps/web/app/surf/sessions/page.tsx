'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { SurfSession, SurfSpot } from '@mylife/surf';
import {
  doCreateSurfSession,
  doDeleteSurfSession,
  fetchSurfSessions,
  fetchSurfSpots,
} from '../actions';
import { SurfShell } from '../components/SurfShell';

export default function SurfSessionsPage() {
  const [spots, setSpots] = useState<SurfSpot[]>([]);
  const [sessions, setSessions] = useState<SurfSession[]>([]);

  const [spotFilter, setSpotFilter] = useState('all');
  const [sessionSpotId, setSessionSpotId] = useState('');
  const [durationMin, setDurationMin] = useState('90');
  const [rating, setRating] = useState('4');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    const [nextSpots, nextSessions] = await Promise.all([
      fetchSurfSpots(),
      fetchSurfSessions({
        spotId: spotFilter === 'all' ? undefined : spotFilter,
        limit: 200,
      }),
    ]);
    setSpots(nextSpots);
    setSessions(nextSessions);
    if (!sessionSpotId && nextSpots[0]) {
      setSessionSpotId(nextSpots[0].id);
    }
  }, [sessionSpotId, spotFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const averageRating = useMemo(() => {
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, session) => sum + session.rating, 0) / sessions.length;
  }, [sessions]);

  const totalMinutes = useMemo(
    () => sessions.reduce((sum, session) => sum + session.durationMin, 0),
    [sessions],
  );

  const handleCreate = async () => {
    if (!sessionSpotId) return;
    await doCreateSurfSession(crypto.randomUUID(), {
      spotId: sessionSpotId,
      sessionDate: new Date().toISOString(),
      durationMin: Math.max(15, Number(durationMin) || 60),
      rating: Math.min(5, Math.max(1, Number(rating) || 3)),
      notes: notes.trim() || undefined,
    });
    setNotes('');
    await loadData();
  };

  return (
    <SurfShell subtitle="Session journal, history, and trend metrics">
      <div style={styles.summaryGrid}>
        <MetricCard label="Sessions" value={String(sessions.length)} />
        <MetricCard label="Avg Rating" value={sessions.length ? averageRating.toFixed(1) : '--'} />
        <MetricCard label="Water Time" value={`${Math.round(totalMinutes / 60)} h`} />
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Log Session</h2>
        <div style={styles.formRow}>
          <select
            value={sessionSpotId}
            onChange={(event) => setSessionSpotId(event.target.value)}
            style={styles.select}
          >
            {spots.map((spot) => (
              <option key={spot.id} value={spot.id}>{spot.name}</option>
            ))}
          </select>
          <input
            style={styles.input}
            value={durationMin}
            onChange={(event) => setDurationMin(event.target.value)}
            placeholder="Duration (min)"
          />
          <input
            style={styles.input}
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            placeholder="Rating (1-5)"
          />
          <input
            style={styles.input}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
          />
          <button
            style={styles.primaryButton}
            disabled={!sessionSpotId}
            onClick={() => void handleCreate()}
          >
            Save Session
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.headerRow}>
          <h2 style={styles.heading}>Session Feed</h2>
          <select
            value={spotFilter}
            onChange={(event) => setSpotFilter(event.target.value)}
            style={styles.selectSmall}
          >
            <option value="all">All spots</option>
            {spots.map((spot) => (
              <option key={spot.id} value={spot.id}>{spot.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.list}>
          {sessions.map((session) => {
            const spot = spots.find((item) => item.id === session.spotId);
            return (
              <div key={session.id} style={styles.item}>
                <div>
                  <div style={styles.itemTitle}>
                    {new Date(session.sessionDate).toLocaleDateString()} · {session.durationMin} min · {session.rating}/5
                  </div>
                  <div style={styles.meta}>
                    {spot ? (
                      <Link href={`/surf/spot/${spot.id}`} style={styles.link}>{spot.name}</Link>
                    ) : (
                      'Unknown spot'
                    )}
                    {session.notes ? ` · ${session.notes}` : ''}
                  </div>
                </div>
                <button
                  style={styles.dangerButton}
                  onClick={() => void doDeleteSurfSession(session.id).then(loadData)}
                >
                  Delete
                </button>
              </div>
            );
          })}
          {sessions.length === 0 && (
            <div style={styles.empty}>No sessions logged yet.</div>
          )}
        </div>
      </div>
    </SurfShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },
  metricCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 14,
  },
  metricLabel: {
    color: 'var(--text-tertiary)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricValue: {
    marginTop: 6,
    color: '#3B82F6',
    fontWeight: 700,
    fontSize: 20,
  },
  section: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    padding: 16,
  },
  heading: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 600,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  formRow: {
    marginTop: 10,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  input: {
    minWidth: 120,
    flex: 1,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  select: {
    minWidth: 170,
    flex: 1,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  selectSmall: {
    minWidth: 170,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  primaryButton: {
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    padding: '8px 12px',
    background: '#3B82F6',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  list: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-elevated)',
    padding: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    color: 'var(--text)',
    fontWeight: 600,
  },
  meta: {
    marginTop: 2,
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  link: {
    color: '#3B82F6',
    textDecoration: 'none',
  },
  dangerButton: {
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    padding: '8px 12px',
    background: 'var(--danger)',
    color: '#fff',
    cursor: 'pointer',
  },
  empty: {
    padding: 14,
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
  },
};
