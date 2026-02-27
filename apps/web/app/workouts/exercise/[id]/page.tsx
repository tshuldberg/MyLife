'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { MuscleGroup, WorkoutExerciseLibraryItem } from '@mylife/workouts';
import { MUSCLE_GROUP_LABELS } from '@mylife/workouts';
import { fetchWorkoutExercise } from '../../actions';

const Model = dynamic(() => import('react-body-highlighter'), { ssr: false });

const MUSCLE_GROUP_TO_WEB_SLUGS: Record<string, string[]> = {
  chest: ['chest'],
  back: ['upper-back', 'lower-back', 'trapezius'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  core: ['abs', 'obliques'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal'],
  calves: ['calves'],
  hip_flexors: ['adductor', 'abductors'],
  neck: ['neck'],
  full_body: [
    'chest', 'upper-back', 'lower-back', 'trapezius', 'front-deltoids',
    'back-deltoids', 'biceps', 'triceps', 'forearm', 'abs', 'obliques',
    'quadriceps', 'hamstring', 'gluteal', 'calves', 'adductor', 'abductors', 'neck',
  ],
};

const DIFFICULTY_DOTS: Record<string, string> = {
  beginner: '\u25CF\u25CB\u25CB',
  intermediate: '\u25CF\u25CF\u25CB',
  advanced: '\u25CF\u25CF\u25CF',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<WorkoutExerciseLibraryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchWorkoutExercise(id).then((data) => {
      if (!active) return;
      setExercise(data);
      setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div style={styles.center}>
        <span style={styles.loadingText}>Loading exercise...</span>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div style={styles.center}>
        <span style={styles.loadingText}>Exercise not found.</span>
        <Link href="/workouts/explore" style={styles.backLink}>Back to Explore</Link>
      </div>
    );
  }

  const primaryMuscles = exercise.muscleGroups.slice(0, 1);
  const secondaryMuscles = exercise.muscleGroups.slice(1);

  const highlightData = exercise.muscleGroups.flatMap((group, i) => {
    const slugs = MUSCLE_GROUP_TO_WEB_SLUGS[group] ?? [];
    return slugs.map((slug) => ({
      name: i === 0 ? 'Primary' : 'Secondary',
      muscles: [slug],
      frequency: i === 0 ? 2 : 1,
    }));
  });

  return (
    <div style={styles.page}>
      <Link href="/workouts/explore" style={styles.backLink}>
        &larr; Back to Explore
      </Link>

      <h1 style={styles.title}>{exercise.name}</h1>
      <div style={styles.metaRow}>
        <span style={styles.categoryBadge}>{capitalize(exercise.category)}</span>
        <span style={styles.difficultyText}>
          {DIFFICULTY_DOTS[exercise.difficulty]} {capitalize(exercise.difficulty)}
        </span>
      </div>

      {/* Description */}
      <div style={styles.section}>
        <h3 style={styles.sectionLabel}>Description</h3>
        <p style={styles.description}>{exercise.description}</p>
      </div>

      {/* Muscle groups */}
      <div style={styles.muscleColumns}>
        <div>
          <h3 style={styles.sectionLabel}>Primary</h3>
          <div style={styles.tagRow}>
            {primaryMuscles.map((m) => (
              <span key={m} style={styles.muscleTag}>
                {MUSCLE_GROUP_LABELS[m] ?? m}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 style={styles.sectionLabel}>Secondary</h3>
          <div style={styles.tagRow}>
            {secondaryMuscles.length > 0 ? (
              secondaryMuscles.map((m) => (
                <span key={m} style={styles.muscleTagSecondary}>
                  {MUSCLE_GROUP_LABELS[m] ?? m}
                </span>
              ))
            ) : (
              <span style={styles.noneText}>None</span>
            )}
          </div>
        </div>
      </div>

      {/* Body map visualization (read-only) */}
      <div style={styles.bodyMapRow}>
        <div style={styles.bodyMapCol}>
          <span style={styles.bodyMapLabel}>Front</span>
          <Model
            type="anterior"
            data={highlightData as any}
            bodyColor="#E5E7EB"
            highlightedColors={['#f87171', '#EF4444']}
            style={{ width: '100%', pointerEvents: 'none' as const }}
          />
        </div>
        <div style={styles.bodyMapCol}>
          <span style={styles.bodyMapLabel}>Back</span>
          <Model
            type="posterior"
            data={highlightData as any}
            bodyColor="#E5E7EB"
            highlightedColors={['#f87171', '#EF4444']}
            style={{ width: '100%', pointerEvents: 'none' as const }}
          />
        </div>
      </div>

      {/* Defaults */}
      {(exercise.defaultSets || exercise.defaultReps || exercise.defaultDuration) && (
        <div style={styles.section}>
          <h3 style={styles.sectionLabel}>Defaults</h3>
          <div style={styles.defaultsRow}>
            {exercise.defaultSets > 0 && (
              <span style={styles.defaultChip}>{exercise.defaultSets} sets</span>
            )}
            {exercise.defaultReps && (
              <span style={styles.defaultChip}>{exercise.defaultReps} reps</span>
            )}
            {exercise.defaultDuration && (
              <span style={styles.defaultChip}>{exercise.defaultDuration}s</span>
            )}
          </div>
        </div>
      )}

      {/* Action */}
      <Link href="/workouts/builder" style={styles.addButton}>
        Add to Workout
      </Link>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    maxWidth: 680,
  },
  center: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 300,
  },
  loadingText: {
    color: 'var(--text-tertiary)',
    fontSize: 14,
  },
  backLink: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    textDecoration: 'none',
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--text)',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#EF4444',
    padding: '3px 10px',
    borderRadius: '999px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.08)',
  },
  difficultyText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  sectionLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--text-tertiary)',
  },
  description: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
  },
  muscleColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 6,
  },
  muscleTag: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '999px',
    border: '1px solid #EF4444',
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#EF4444',
  },
  muscleTagSecondary: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
  },
  noneText: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    marginTop: 6,
  },
  bodyMapRow: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
  },
  bodyMapCol: {
    width: 120,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  },
  bodyMapLabel: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  defaultsRow: {
    display: 'flex',
    gap: 8,
  },
  defaultChip: {
    fontSize: 13,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
  },
  addButton: {
    display: 'block',
    textAlign: 'center' as const,
    padding: '12px 0',
    borderRadius: 'var(--radius-md)',
    background: '#EF4444',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    textDecoration: 'none',
  },
};
