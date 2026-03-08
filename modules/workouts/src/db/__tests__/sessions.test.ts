import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { WORKOUTS_MODULE } from '../../definition';
import type { WorkoutExerciseEntry, CompletedExercise } from '../../types';
import {
  createWorkout,
  createWorkoutSession,
  completeWorkoutSession,
  getWorkoutSessions,
} from '../crud';

function seedWorkout(db: DatabaseAdapter, id = 'w-1'): void {
  const exercises: WorkoutExerciseEntry[] = [
    {
      exerciseId: 'ex-1',
      name: 'Push-up',
      category: 'strength',
      sets: 3,
      reps: 10,
      duration: null,
      restAfter: 60,
      order: 0,
    },
    {
      exerciseId: 'ex-2',
      name: 'Squat',
      category: 'strength',
      sets: 3,
      reps: 12,
      duration: null,
      restAfter: 60,
      order: 1,
    },
  ];
  createWorkout(db, id, {
    title: 'Test Workout',
    difficulty: 'beginner',
    exercises,
  });
}

describe('@mylife/workouts - sessions', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('workouts', WORKOUTS_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
    seedWorkout(adapter);
  });

  afterEach(() => {
    closeDb();
  });

  // ── createWorkoutSession ──

  it('creates a session linked to a workout', () => {
    createWorkoutSession(adapter, 's-1', {
      workoutId: 'w-1',
      startedAt: '2026-03-01T08:00:00.000Z',
    });

    const sessions = getWorkoutSessions(adapter);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('s-1');
    expect(sessions[0].workoutId).toBe('w-1');
    expect(sessions[0].startedAt).toBe('2026-03-01T08:00:00.000Z');
    expect(sessions[0].completedAt).toBeNull();
  });

  it('creates a session with default startedAt', () => {
    createWorkoutSession(adapter, 's-default', {
      workoutId: 'w-1',
    });

    const sessions = getWorkoutSessions(adapter);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].startedAt).toBeTruthy();
  });

  it('creates a session with initial exercisesCompleted', () => {
    const completed: CompletedExercise[] = [
      { exerciseId: 'ex-1', setsCompleted: 2, repsCompleted: 10, durationActual: null, skipped: false },
    ];
    createWorkoutSession(adapter, 's-init', {
      workoutId: 'w-1',
      exercisesCompleted: completed,
    });

    const sessions = getWorkoutSessions(adapter);
    expect(sessions[0].exercisesCompleted).toHaveLength(1);
    expect(sessions[0].exercisesCompleted[0].exerciseId).toBe('ex-1');
    expect(sessions[0].exercisesCompleted[0].setsCompleted).toBe(2);
  });

  // ── completeWorkoutSession ──

  it('completes a session with exercisesCompleted array', () => {
    createWorkoutSession(adapter, 's-complete', {
      workoutId: 'w-1',
      startedAt: '2026-03-01T08:00:00.000Z',
    });

    const completed: CompletedExercise[] = [
      { exerciseId: 'ex-1', setsCompleted: 3, repsCompleted: 10, durationActual: null, skipped: false },
      { exerciseId: 'ex-2', setsCompleted: 3, repsCompleted: 12, durationActual: null, skipped: false },
    ];

    completeWorkoutSession(adapter, 's-complete', {
      completedAt: '2026-03-01T08:45:00.000Z',
      exercisesCompleted: completed,
    });

    const sessions = getWorkoutSessions(adapter, { onlyCompleted: true });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completedAt).toBe('2026-03-01T08:45:00.000Z');
    expect(sessions[0].exercisesCompleted).toHaveLength(2);
  });

  it('completes a session with voice commands and pace adjustments', () => {
    createWorkoutSession(adapter, 's-voice', {
      workoutId: 'w-1',
      startedAt: '2026-03-01T09:00:00.000Z',
    });

    completeWorkoutSession(adapter, 's-voice', {
      completedAt: '2026-03-01T09:30:00.000Z',
      exercisesCompleted: [
        { exerciseId: 'ex-1', setsCompleted: 3, repsCompleted: 10, durationActual: null, skipped: false },
      ],
      voiceCommandsUsed: [
        { command: 'next', timestamp: 120, recognized: true },
      ],
      paceAdjustments: [
        { timestamp: 60, speed: 1.5, source: 'voice' },
      ],
    });

    const sessions = getWorkoutSessions(adapter);
    expect(sessions[0].voiceCommandsUsed).toHaveLength(1);
    expect(sessions[0].voiceCommandsUsed[0].command).toBe('next');
    expect(sessions[0].paceAdjustments).toHaveLength(1);
    expect(sessions[0].paceAdjustments[0].speed).toBe(1.5);
  });

  // ── getWorkoutSessions filters ──

  it('filters sessions by workoutId', () => {
    seedWorkout(adapter, 'w-2');
    createWorkoutSession(adapter, 's-w1', { workoutId: 'w-1' });
    createWorkoutSession(adapter, 's-w2', { workoutId: 'w-2' });

    const w1Sessions = getWorkoutSessions(adapter, { workoutId: 'w-1' });
    expect(w1Sessions).toHaveLength(1);
    expect(w1Sessions[0].workoutId).toBe('w-1');
  });

  it('filters sessions by onlyCompleted', () => {
    createWorkoutSession(adapter, 's-incomplete', {
      workoutId: 'w-1',
      startedAt: '2026-03-01T10:00:00.000Z',
    });
    createWorkoutSession(adapter, 's-done', {
      workoutId: 'w-1',
      startedAt: '2026-03-01T11:00:00.000Z',
      completedAt: '2026-03-01T11:30:00.000Z',
      exercisesCompleted: [
        { exerciseId: 'ex-1', setsCompleted: 3, repsCompleted: 10, durationActual: null, skipped: false },
      ],
    });

    const completedOnly = getWorkoutSessions(adapter, { onlyCompleted: true });
    expect(completedOnly).toHaveLength(1);
    expect(completedOnly[0].id).toBe('s-done');
  });

  it('respects limit option', () => {
    for (let i = 0; i < 5; i++) {
      createWorkoutSession(adapter, `s-lim-${i}`, { workoutId: 'w-1' });
    }

    const limited = getWorkoutSessions(adapter, { limit: 2 });
    expect(limited).toHaveLength(2);
  });

  it('returns sessions ordered by most recent first', () => {
    createWorkoutSession(adapter, 's-old', {
      workoutId: 'w-1',
      startedAt: '2026-01-01T08:00:00.000Z',
    });
    createWorkoutSession(adapter, 's-new', {
      workoutId: 'w-1',
      startedAt: '2026-03-01T08:00:00.000Z',
      completedAt: '2026-03-01T09:00:00.000Z',
    });

    const sessions = getWorkoutSessions(adapter);
    expect(sessions[0].id).toBe('s-new');
    expect(sessions[1].id).toBe('s-old');
  });

  it('session has properly parsed JSON arrays', () => {
    createWorkoutSession(adapter, 's-json', {
      workoutId: 'w-1',
      exercisesCompleted: [
        { exerciseId: 'ex-1', setsCompleted: 3, repsCompleted: 10, durationActual: null, skipped: false },
      ],
      voiceCommandsUsed: [{ command: 'pause', timestamp: 30, recognized: true }],
      paceAdjustments: [{ timestamp: 45, speed: 0.8, source: 'manual' }],
    });

    const session = getWorkoutSessions(adapter)[0];
    expect(Array.isArray(session.exercisesCompleted)).toBe(true);
    expect(Array.isArray(session.voiceCommandsUsed)).toBe(true);
    expect(Array.isArray(session.paceAdjustments)).toBe(true);
    expect(session.exercisesCompleted[0].exerciseId).toBe('ex-1');
  });
});
