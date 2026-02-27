'use client';

import React from 'react';
import Link from 'next/link';
import { fetchWorkoutRecordings, fetchWorkoutExercises, doDeleteWorkoutRecording } from '../actions';
import type { WorkoutFormRecording } from '@mylife/workouts';

export default function RecordingsPage() {
  const [recordings, setRecordings] = React.useState<WorkoutFormRecording[]>([]);
  const [exerciseNames, setExerciseNames] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);

  const loadRecordings = React.useCallback(async () => {
    try {
      const [data, exercises] = await Promise.all([
        fetchWorkoutRecordings(),
        fetchWorkoutExercises({ limit: 500 }),
      ]);
      const nameMap: Record<string, string> = {};
      for (const ex of exercises) {
        nameMap[ex.id] = ex.name;
      }
      setExerciseNames(nameMap);
      setRecordings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this recording? This cannot be undone.')) return;
    await doDeleteWorkoutRecording(id);
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const formatDuration = (start: number, end: number): string => {
    const seconds = Math.round(end - start);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Loading recordings...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link href="/workouts" style={styles.backLink}>&larr; Workouts</Link>
        <h1 style={styles.title}>Form Recordings</h1>
        <p style={styles.subtitle}>{recordings.length} recording{recordings.length !== 1 ? 's' : ''}</p>
      </div>

      {recordings.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🎥</div>
          <p style={styles.emptyTitle}>No recordings yet</p>
          <p style={styles.emptySubtitle}>
            Form check recordings will appear here after you record during a workout session.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {recordings.map((rec) => (
            <div key={rec.id} style={styles.card}>
              <Link href={`/workouts/recordings/${rec.id}`} style={styles.cardLink}>
                <div style={styles.cardBody}>
                  <div style={styles.cardMain}>
                    <span style={styles.exerciseId}>{exerciseNames[rec.exerciseId] ?? rec.exerciseId}</span>
                    <span style={styles.cardDate}>{formatDate(rec.createdAt)}</span>
                  </div>
                  <div style={styles.cardMeta}>
                    <span style={styles.duration}>
                      {formatDuration(rec.timestampStart, rec.timestampEnd)}
                    </span>
                    {rec.coachFeedback.length > 0 && (
                      <span style={styles.feedbackBadge}>
                        {rec.coachFeedback.length} feedback{rec.coachFeedback.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => handleDelete(rec.id)}
                style={styles.deleteBtn}
                title="Delete recording"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: 720,
    margin: '0 auto',
  },
  loadingText: {
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    padding: '48px 0',
  },
  header: {
    marginBottom: 24,
  },
  backLink: {
    color: '#EF4444',
    textDecoration: 'none',
    fontSize: 14,
    display: 'inline-block',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-tertiary)',
    margin: '4px 0 0',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '64px 24px',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 8px',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'var(--text-tertiary)',
    margin: 0,
    maxWidth: 320,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  card: {
    display: 'flex',
    alignItems: 'center' as const,
    background: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  cardLink: {
    flex: 1,
    textDecoration: 'none',
    padding: '14px 16px',
  },
  cardBody: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  cardMain: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  exerciseId: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text)',
  },
  cardDate: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 10,
  },
  duration: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontVariantNumeric: 'tabular-nums',
  },
  feedbackBadge: {
    fontSize: 12,
    color: '#EF4444',
    background: 'rgba(239, 68, 68, 0.1)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 500,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '14px 16px',
    fontSize: 14,
    lineHeight: 1,
  },
};
