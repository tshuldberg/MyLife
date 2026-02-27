'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchWorkoutRecording, fetchWorkoutExercise, doDeleteWorkoutRecording } from '../../actions';
import type { WorkoutFormRecording } from '@mylife/workouts';

export default function RecordingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recording, setRecording] = React.useState<WorkoutFormRecording | null>(null);
  const [exerciseName, setExerciseName] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    fetchWorkoutRecording(id)
      .then(async (rec) => {
        setRecording(rec);
        if (rec) {
          const ex = await fetchWorkoutExercise(rec.exerciseId);
          setExerciseName(ex?.name ?? rec.exerciseId);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!recording) return;
    if (!window.confirm('Delete this recording? This cannot be undone.')) return;
    await doDeleteWorkoutRecording(recording.id);
    window.location.href = '/workouts/recordings';
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimestamp = (ts: number): string => {
    const mins = Math.floor(ts / 60);
    const secs = Math.round(ts % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Loading recording...</p>
      </div>
    );
  }

  if (!recording) {
    return (
      <div style={styles.container}>
        <Link href="/workouts/recordings" style={styles.backLink}>&larr; Recordings</Link>
        <div style={styles.notFound}>
          <p style={styles.notFoundText}>Recording not found</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Link href="/workouts/recordings" style={styles.backLink}>&larr; Recordings</Link>

      <div style={styles.header}>
        <h1 style={styles.title}>{exerciseName || recording.exerciseId}</h1>
        <p style={styles.date}>{formatDate(recording.createdAt)}</p>
      </div>

      <div style={styles.infoGrid}>
        <div style={styles.infoCard}>
          <span style={styles.infoLabel}>Duration</span>
          <span style={styles.infoValue}>
            {formatDuration(recording.timestampStart, recording.timestampEnd)}
          </span>
        </div>
        <div style={styles.infoCard}>
          <span style={styles.infoLabel}>Session</span>
          <span style={styles.infoValue}>{recording.sessionId.slice(0, 8)}...</span>
        </div>
        <div style={styles.infoCard}>
          <span style={styles.infoLabel}>Feedback</span>
          <span style={styles.infoValue}>{recording.coachFeedback.length}</span>
        </div>
      </div>

      <div style={styles.videoPlaceholder}>
        <span style={styles.videoIcon}>🎥</span>
        <p style={styles.videoText}>Video playback not available in hub</p>
      </div>

      {recording.coachFeedback.length > 0 && (
        <div style={styles.feedbackSection}>
          <h2 style={styles.sectionTitle}>Coach Feedback</h2>
          <div style={styles.timeline}>
            {recording.coachFeedback.map((fb, i) => (
              <div key={i} style={styles.feedbackItem}>
                <div style={styles.feedbackDot} />
                <div style={styles.feedbackContent}>
                  <div style={styles.feedbackHeader}>
                    <span style={styles.feedbackTime}>{formatTimestamp(fb.timestamp)}</span>
                    <span style={styles.feedbackCoach}>{fb.coachId}</span>
                  </div>
                  <p style={styles.feedbackComment}>{fb.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={handleDelete} style={styles.deleteBtn}>
        Delete Recording
      </button>
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
  backLink: {
    color: '#EF4444',
    textDecoration: 'none',
    fontSize: 14,
    display: 'inline-block',
    marginBottom: 16,
  },
  notFound: {
    textAlign: 'center' as const,
    padding: '64px 24px',
  },
  notFoundText: {
    fontSize: 16,
    color: 'var(--text-tertiary)',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  date: {
    fontSize: 14,
    color: 'var(--text-tertiary)',
    margin: '4px 0 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
  },
  videoPlaceholder: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '40px 24px',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  videoIcon: {
    fontSize: 36,
    display: 'block',
    marginBottom: 8,
  },
  videoText: {
    fontSize: 14,
    color: 'var(--text-tertiary)',
    margin: 0,
  },
  feedbackSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 16px',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
    borderLeft: '2px solid var(--border)',
    marginLeft: 8,
    paddingLeft: 20,
  },
  feedbackItem: {
    display: 'flex',
    alignItems: 'flex-start' as const,
    position: 'relative' as const,
    paddingBottom: 20,
  },
  feedbackDot: {
    position: 'absolute' as const,
    left: -27,
    top: 6,
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#EF4444',
    border: '2px solid var(--surface)',
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackHeader: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 4,
  },
  feedbackTime: {
    fontSize: 13,
    fontWeight: 600,
    color: '#EF4444',
    fontVariantNumeric: 'tabular-nums',
  },
  feedbackCoach: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
  },
  feedbackComment: {
    fontSize: 14,
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.5,
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid var(--danger)',
    color: 'var(--danger)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
  },
};
