'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchWorkoutDashboard, fetchWorkouts } from './actions';
import type { WorkoutDefinition } from '@mylife/workouts';

interface DashboardData {
  dashboard: { workouts: number; exercises: number; sessions: number; streakDays: number; totalMinutes30d: number };
  metrics: { workouts: number; totalMinutes: number; totalCalories: number; averageRpe: number };
  categories: { category: string; count: number }[];
}

export default function WorkoutsHomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [dash, wks] = await Promise.all([
      fetchWorkoutDashboard(),
      fetchWorkouts(),
    ]);
    setDashboardData(dash);
    setWorkouts(wks);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>Workouts</h1>
          <p style={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  const dash = dashboardData?.dashboard;

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Workouts</h1>
            <p style={styles.subtitle}>Track your training</p>
          </div>
          <Link href="/workouts/builder" style={styles.newButton}>
            + New Workout
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{dash?.workouts ?? 0}</span>
          <span style={styles.statLabel}>Workouts</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{dash?.exercises ?? 0}</span>
          <span style={styles.statLabel}>Exercises</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{dash?.sessions ?? 0}</span>
          <span style={styles.statLabel}>Sessions</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{dash?.streakDays ?? 0}</span>
          <span style={styles.statLabel}>Day Streak</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{dash?.totalMinutes30d ?? 0}</span>
          <span style={styles.statLabel}>Min (30d)</span>
        </div>
      </div>

      {/* Workout list */}
      {workouts.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>No workouts yet</p>
          <p style={styles.emptyText}>
            Create your first workout or explore exercises to get started.
          </p>
          <div style={styles.emptyActions}>
            <Link href="/workouts/builder" style={styles.primaryLink}>
              Create Workout
            </Link>
            <Link href="/workouts/explore" style={styles.secondaryLink}>
              Explore Exercises
            </Link>
          </div>
        </div>
      ) : (
        <div style={styles.workoutList}>
          {workouts.map((workout) => (
            <Link
              key={workout.id}
              href={`/workouts/workout/${workout.id}`}
              style={styles.workoutCard}
            >
              <div style={styles.workoutHeader}>
                <span style={styles.workoutTitle}>{workout.title}</span>
                <span style={styles.difficultyBadge} data-difficulty={workout.difficulty}>
                  {workout.difficulty}
                </span>
              </div>
              <div style={styles.workoutMeta}>
                <span>{workout.exercises.length} exercises</span>
                {workout.estimatedDuration > 0 && (
                  <span>{workout.estimatedDuration} min</span>
                )}
              </div>
              {workout.description && (
                <p style={styles.workoutDescription}>{workout.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Explore link */}
      {workouts.length > 0 && (
        <div style={styles.footer}>
          <Link href="/workouts/explore" style={styles.secondaryLink}>
            Explore Exercises
          </Link>
          <Link href="/workouts/progress" style={styles.secondaryLink}>
            View Progress
          </Link>
        </div>
      )}
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
  newButton: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: ACCENT,
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
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
    fontSize: '24px',
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
  emptyState: {
    padding: '48px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    textAlign: 'center' as const,
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
  emptyActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
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
  secondaryLink: {
    padding: '10px 24px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  workoutList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '24px',
  },
  workoutCard: {
    padding: '16px 20px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    textDecoration: 'none',
    display: 'block',
    cursor: 'pointer',
  },
  workoutHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  workoutTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  difficultyBadge: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '3px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: ACCENT,
  },
  workoutMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: 'var(--text-tertiary)',
  },
  workoutDescription: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
    marginBottom: 0,
    lineHeight: 1.4,
  },
  footer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
};
