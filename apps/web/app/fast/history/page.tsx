'use client';

import { useState, useEffect } from 'react';
import { fetchFasts, doDeleteFast, fetchFastCount } from '../actions';
import { formatDuration } from '@mylife/fast';

interface FastUI {
  id: string;
  protocol: string;
  targetHours: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  hitTarget: boolean | null;
  notes: string | null;
}

export default function FastHistoryPage() {
  const [fasts, setFasts] = useState<FastUI[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [data, count] = await Promise.all([
        fetchFasts({ limit: 50 }),
        fetchFastCount(),
      ]);
      setFasts(data);
      setTotal(count);
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    await doDeleteFast(id);
    setFasts((prev) => prev.filter((f) => f.id !== id));
    setTotal((prev) => prev - 1);
  };

  if (loading) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>History</h1>
          <p style={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>History</h1>
        <p style={styles.subtitle}>{total} completed fast{total !== 1 ? 's' : ''}</p>
      </div>

      {fasts.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>&#9201;&#65039;</p>
          <p style={styles.emptyTitle}>No fasts yet</p>
          <p style={styles.emptyText}>Complete your first fast to see it here.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {fasts.map((fast) => (
            <div key={fast.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.protocol}>{fast.protocol}</span>
                <span style={{
                  ...styles.badge,
                  backgroundColor: fast.hitTarget ? 'rgba(34, 197, 94, 0.15)' : 'rgba(232, 114, 92, 0.15)',
                  color: fast.hitTarget ? '#22C55E' : '#E8725C',
                }}>
                  {fast.hitTarget ? 'Hit Target' : 'Missed'}
                </span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Duration</span>
                  <span style={styles.metaValue}>
                    {fast.durationSeconds != null ? formatDuration(fast.durationSeconds) : '--'}
                  </span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Target</span>
                  <span style={styles.metaValue}>{fast.targetHours}h</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Started</span>
                  <span style={styles.metaValue}>
                    {new Date(fast.startedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {fast.notes && (
                <p style={styles.notes}>{fast.notes}</p>
              )}
              <button
                onClick={() => handleDelete(fast.id)}
                style={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '64px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyIcon: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  card: {
    padding: '16px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  protocol: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--accent-fast, #14B8A6)',
  },
  badge: {
    padding: '3px 10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: 600,
  },
  cardBody: {
    display: 'flex',
    gap: '24px',
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  metaValue: {
    fontSize: '14px',
    color: 'var(--text)',
  },
  notes: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  deleteButton: {
    marginTop: '8px',
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-tertiary)',
    fontSize: '12px',
    cursor: 'pointer',
  },
};
