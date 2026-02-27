'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchWorkoutDashboard, fetchWorkoutHistory } from '../actions';
import type { WorkoutSession } from '@mylife/workouts';

interface DashboardData {
  dashboard: { workouts: number; exercises: number; sessions: number; streakDays: number; totalMinutes30d: number };
  metrics: { workouts: number; totalMinutes: number; totalCalories: number; averageRpe: number };
  categories: { category: string; count: number }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function computeDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return 'In progress';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const mins = Math.round((end - start) / 60000);
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export default function WorkoutsProgressPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [dash, hist] = await Promise.all([
      fetchWorkoutDashboard(),
      fetchWorkoutHistory(50),
    ]);
    setDashboardData(dash);
    setSessions(hist);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>Progress</h1>
          <p style={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  const dash = dashboardData?.dashboard;
  const metrics = dashboardData?.metrics;

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Progress</h1>
            <p style={styles.subtitle}>Your workout history and stats</p>
          </div>
          <Link href="/workouts" style={styles.backLink}>
            Back to Workouts
          </Link>
        </div>
      </div>

      {/* Overview stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{dash?.streakDays ?? 0}</span>
          <span style={styles.statLabel}>Day Streak</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{dash?.sessions ?? 0}</span>
          <span style={styles.statLabel}>Total Sessions</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{metrics?.totalMinutes ?? 0}</span>
          <span style={styles.statLabel}>Total Minutes</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{metrics?.totalCalories ?? 0}</span>
          <span style={styles.statLabel}>Calories Burned</span>
        </div>
      </div>

      {/* 30-day summary */}
      <div style={styles.summaryCard}>
        <h2 style={styles.sectionTitle}>Last 30 Days</h2>
        <div style={styles.summaryRow}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryValue}>{dash?.totalMinutes30d ?? 0}</span>
            <span style={styles.summaryLabel}>Minutes</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryValue}>{metrics?.workouts ?? 0}</span>
            <span style={styles.summaryLabel}>Workouts</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryValue}>
              {metrics?.averageRpe ? metrics.averageRpe.toFixed(1) : '--'}
            </span>
            <span style={styles.summaryLabel}>Avg RPE</span>
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Sessions</h2>

        {sessions.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>No sessions yet</p>
            <p style={styles.emptyText}>
              Complete a workout to start tracking your progress.
            </p>
            <Link href="/workouts" style={styles.primaryLink}>
              Start a Workout
            </Link>
          </div>
        ) : (
          <div style={styles.sessionList}>
            {sessions.map((session) => (
              <div key={session.id} style={styles.sessionCard}>
                <div style={styles.sessionHeader}>
                  <span style={styles.sessionDate}>
                    {formatDate(session.startedAt)}
                  </span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(session.completedAt ? styles.statusComplete : styles.statusActive),
                    }}
                  >
                    {session.completedAt ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div style={styles.sessionMeta}>
                  <span>Started {formatTime(session.startedAt)}</span>
                  <span>{computeDuration(session.startedAt, session.completedAt)}</span>
                  <span>
                    {session.exercisesCompleted?.length ?? 0} exercises completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ACCENT = '#EF4444';

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  backLink: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '16px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: ACCENT,
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  summaryCard: {
    padding: '20px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    gap: '32px',
    marginTop: '16px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  summaryLabel: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
    marginBottom: '4px',
  },
  emptyState: {
    padding: '48px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    textAlign: 'center' as const,
    marginTop: '16px',
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
    marginBottom: '24px',
  },
  primaryLink: {
    padding: '10px 24px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: ACCENT,
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginTop: '16px',
  },
  sessionCard: {
    padding: '14px 18px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  sessionDate: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '3px 10px',
    borderRadius: 'var(--radius-sm)',
  },
  statusComplete: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#22C55E',
  },
  statusActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: ACCENT,
  },
  sessionMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: 'var(--text-tertiary)',
  },
};
