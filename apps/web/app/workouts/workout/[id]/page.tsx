'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type {
  WorkoutDefinition,
  WorkoutExerciseEntry,
  CompletedExercise,
} from '@mylife/workouts';
import {
  fetchWorkout,
  doCreateWorkoutSession,
  doCompleteWorkoutSession,
} from '../../actions';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function WorkoutPlayerPage() {
  const params = useParams();
  const id = params.id as string;

  const [workout, setWorkout] = useState<WorkoutDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  // Session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);

  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchWorkout(id);
      if (!cancelled) {
        setWorkout(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Elapsed timer
  useEffect(() => {
    if (sessionStarted && !sessionCompleted) {
      elapsedRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [sessionStarted, sessionCompleted]);

  // Rest countdown
  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      restRef.current = setInterval(() => {
        setRestTimeLeft((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restRef.current) clearInterval(restRef.current);
    };
  }, [isResting, restTimeLeft]);

  const handleStart = useCallback(async () => {
    const sid = crypto.randomUUID();
    setSessionId(sid);
    setSessionStarted(true);
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setElapsedSeconds(0);
    setCompletedExercises([]);
    await doCreateWorkoutSession(sid, { workoutId: id });
  }, [id]);

  const recordExercise = useCallback(
    (exercise: WorkoutExerciseEntry, skipped: boolean) => {
      const completed: CompletedExercise = {
        exerciseId: exercise.exerciseId,
        setsCompleted: skipped ? 0 : exercise.sets,
        repsCompleted: exercise.reps,
        durationActual: exercise.duration,
        skipped,
      };
      setCompletedExercises((prev) => [...prev, completed]);
    },
    [],
  );

  const advanceToNext = useCallback(
    async (exercise: WorkoutExerciseEntry, skipped: boolean) => {
      if (!workout) return;
      recordExercise(exercise, skipped);

      const nextIndex = currentExerciseIndex + 1;
      if (nextIndex >= workout.exercises.length) {
        // Session complete
        const finalCompleted = [
          ...completedExercises,
          {
            exerciseId: exercise.exerciseId,
            setsCompleted: skipped ? 0 : exercise.sets,
            repsCompleted: exercise.reps,
            durationActual: exercise.duration,
            skipped,
          },
        ];
        setSessionCompleted(true);
        await doCompleteWorkoutSession(sessionId, {
          exercisesCompleted: finalCompleted,
        });
      } else if (!skipped && exercise.restAfter > 0) {
        setIsResting(true);
        setRestTimeLeft(exercise.restAfter);
        setCurrentExerciseIndex(nextIndex);
        setCurrentSet(1);
      } else {
        setCurrentExerciseIndex(nextIndex);
        setCurrentSet(1);
      }
    },
    [workout, currentExerciseIndex, completedExercises, sessionId, recordExercise],
  );

  const handleCompleteSet = useCallback(() => {
    if (!workout) return;
    const exercise = workout.exercises[currentExerciseIndex];
    if (currentSet >= exercise.sets) {
      advanceToNext(exercise, false);
    } else {
      setCurrentSet((prev) => prev + 1);
      if (exercise.restAfter > 0) {
        setIsResting(true);
        setRestTimeLeft(exercise.restAfter);
      }
    }
  }, [workout, currentExerciseIndex, currentSet, advanceToNext]);

  const handleSkip = useCallback(() => {
    if (!workout) return;
    const exercise = workout.exercises[currentExerciseIndex];
    setIsResting(false);
    advanceToNext(exercise, true);
  }, [workout, currentExerciseIndex, advanceToNext]);

  const skipRest = useCallback(() => {
    setIsResting(false);
    setRestTimeLeft(0);
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Loading workout...</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Workout not found</p>
        <Link href="/workouts" style={styles.backLinkCenter}>Back to Workouts</Link>
      </div>
    );
  }

  // Completion screen
  if (sessionCompleted) {
    const totalCompleted = completedExercises.filter((e) => !e.skipped).length;
    return (
      <div style={styles.container}>
        <div style={styles.completionCard}>
          <div style={styles.completionIcon}>&#10003;</div>
          <h1 style={styles.completionTitle}>Workout Complete!</h1>
          <p style={styles.completionSubtitle}>{workout.title}</p>
          <div style={styles.completionStats}>
            <div style={styles.statBlock}>
              <span style={styles.statValue}>{formatTime(elapsedSeconds)}</span>
              <span style={styles.statLabel}>Total Time</span>
            </div>
            <div style={styles.statBlock}>
              <span style={styles.statValue}>{totalCompleted}</span>
              <span style={styles.statLabel}>Exercises</span>
            </div>
            <div style={styles.statBlock}>
              <span style={styles.statValue}>{workout.exercises.length - totalCompleted}</span>
              <span style={styles.statLabel}>Skipped</span>
            </div>
          </div>
          <Link href="/workouts" style={styles.doneBtn}>
            Back to Workouts
          </Link>
        </div>
      </div>
    );
  }

  // Pre-start screen
  if (!sessionStarted) {
    return (
      <div style={styles.container}>
        <Link href="/workouts" style={styles.backLink}>&larr; Back</Link>
        <div style={styles.preStartCard}>
          <h1 style={styles.preStartTitle}>{workout.title}</h1>
          {workout.description && (
            <p style={styles.preStartDesc}>{workout.description}</p>
          )}
          <div style={styles.preStartMeta}>
            <div style={styles.metaItem}>
              <span style={styles.metaValue}>{workout.exercises.length}</span>
              <span style={styles.metaLabel}>Exercises</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaValue}>{workout.estimatedDuration}m</span>
              <span style={styles.metaLabel}>Est. Duration</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaValue}>
                {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
              </span>
              <span style={styles.metaLabel}>Difficulty</span>
            </div>
          </div>
          <div style={styles.exercisePreview}>
            {workout.exercises.map((ex, i) => (
              <div key={`${ex.exerciseId}-${i}`} style={styles.previewItem}>
                <span style={styles.previewOrder}>{i + 1}</span>
                <span style={styles.previewName}>{ex.name}</span>
                <span style={styles.previewDetail}>
                  {ex.sets} sets
                  {ex.reps ? ` x ${ex.reps} reps` : ''}
                  {ex.duration ? ` x ${ex.duration}s` : ''}
                </span>
              </div>
            ))}
          </div>
          <button onClick={handleStart} style={styles.startBtn}>
            Start Workout
          </button>
        </div>
      </div>
    );
  }

  // Active workout
  const currentExercise = workout.exercises[currentExerciseIndex];

  return (
    <div style={styles.container}>
      <div style={styles.playerHeader}>
        <span style={styles.timerDisplay}>{formatTime(elapsedSeconds)}</span>
        <span style={styles.progressText}>
          Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
        </span>
      </div>

      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${((currentExerciseIndex + 1) / workout.exercises.length) * 100}%`,
          }}
        />
      </div>

      {isResting ? (
        <div style={styles.restCard}>
          <p style={styles.restLabel}>Rest</p>
          <p style={styles.restTimer}>{restTimeLeft}</p>
          <p style={styles.restUnit}>seconds</p>
          <button onClick={skipRest} style={styles.skipRestBtn}>
            Skip Rest
          </button>
        </div>
      ) : (
        <div style={styles.exerciseDisplay}>
          <h2 style={styles.currentExerciseName}>{currentExercise.name}</h2>
          <span style={styles.currentCategory}>{currentExercise.category}</span>

          <div style={styles.setInfo}>
            <span style={styles.setLabel}>Set</span>
            <span style={styles.setCurrent}>{currentSet}</span>
            <span style={styles.setTotal}>of {currentExercise.sets}</span>
          </div>

          <div style={styles.targetInfo}>
            {currentExercise.reps && (
              <div style={styles.targetItem}>
                <span style={styles.targetValue}>{currentExercise.reps}</span>
                <span style={styles.targetLabel}>reps</span>
              </div>
            )}
            {currentExercise.duration && (
              <div style={styles.targetItem}>
                <span style={styles.targetValue}>{currentExercise.duration}s</span>
                <span style={styles.targetLabel}>duration</span>
              </div>
            )}
          </div>

          <div style={styles.actionRow}>
            <button onClick={handleSkip} style={styles.skipBtn}>
              Skip
            </button>
            <button onClick={handleCompleteSet} style={styles.completeSetBtn}>
              {currentSet >= currentExercise.sets ? 'Complete Exercise' : 'Complete Set'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const ACCENT = '#EF4444';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '24px',
  },
  loadingText: {
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    padding: '64px 0',
  },
  backLink: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '16px',
  },
  backLinkCenter: {
    color: ACCENT,
    fontSize: '14px',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center' as const,
    marginTop: '12px',
  },

  // Pre-start
  preStartCard: {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '32px 24px',
    textAlign: 'center' as const,
  },
  preStartTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 8px',
  },
  preStartDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: '0 0 24px',
  },
  preStartMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '24px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  metaValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: ACCENT,
  },
  metaLabel: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
  },
  exercisePreview: {
    textAlign: 'left' as const,
    marginBottom: '24px',
  },
  previewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  previewOrder: {
    width: '22px',
    height: '22px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    color: '#fff',
    backgroundColor: ACCENT,
    borderRadius: '50%',
    flexShrink: 0,
  },
  previewName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
  },
  previewDetail: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  startBtn: {
    padding: '14px 48px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
    backgroundColor: ACCENT,
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  },

  // Player
  playerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  timerDisplay: {
    fontSize: '28px',
    fontWeight: 700,
    color: ACCENT,
    fontVariantNumeric: 'tabular-nums',
  },
  progressText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  progressBar: {
    height: '4px',
    backgroundColor: 'var(--border)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '32px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },

  // Rest screen
  restCard: {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '48px 24px',
    textAlign: 'center' as const,
  },
  restLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px',
    letterSpacing: '1px',
  },
  restTimer: {
    fontSize: '72px',
    fontWeight: 700,
    color: ACCENT,
    margin: '0',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  restUnit: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
    margin: '4px 0 24px',
  },
  skipRestBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  },

  // Active exercise
  exerciseDisplay: {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '32px 24px',
    textAlign: 'center' as const,
  },
  currentExerciseName: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 4px',
  },
  currentCategory: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    textTransform: 'capitalize' as const,
  },
  setInfo: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '8px',
    margin: '24px 0',
  },
  setLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
  },
  setCurrent: {
    fontSize: '48px',
    fontWeight: 700,
    color: ACCENT,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  setTotal: {
    fontSize: '18px',
    color: 'var(--text-tertiary)',
  },
  targetInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '32px',
  },
  targetItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px',
  },
  targetValue: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  targetLabel: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  skipBtn: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  },
  completeSetBtn: {
    padding: '12px 32px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#fff',
    backgroundColor: ACCENT,
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  },

  // Completion
  completionCard: {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '48px 24px',
    textAlign: 'center' as const,
    marginTop: '32px',
  },
  completionIcon: {
    width: '64px',
    height: '64px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 700,
    color: '#fff',
    backgroundColor: ACCENT,
    borderRadius: '50%',
    marginBottom: '16px',
  },
  completionTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 4px',
  },
  completionSubtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: '0 0 24px',
  },
  completionStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '32px',
  },
  statBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: ACCENT,
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
  },
  doneBtn: {
    display: 'inline-block',
    padding: '12px 32px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: ACCENT,
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
  },
};
