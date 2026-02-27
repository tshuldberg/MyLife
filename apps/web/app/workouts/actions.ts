'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createWorkout,
  createWorkoutSession,
  completeWorkoutSession,
  deleteWorkout,
  getWorkoutById,
  getWorkoutCategoryCounts,
  getWorkoutDashboard,
  getWorkoutExerciseById,
  getWorkoutExercises,
  getWorkoutFormRecordings,
  getWorkouts,
  getWorkoutSessions,
  getWorkoutMetrics,
  seedWorkoutExerciseLibrary,
  updateWorkout,
  deleteWorkoutFormRecording,
} from '@mylife/workouts';
import type {
  CompletedExercise,
  MuscleGroup,
  WorkoutCategory,
  WorkoutDefinition,
  WorkoutDifficulty,
  WorkoutExerciseEntry,
  WorkoutExerciseLibraryItem,
  WorkoutFormRecording,
  WorkoutSession,
} from '@mylife/workouts';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('workouts');
  seedWorkoutExerciseLibrary(adapter);
  return adapter;
}

export async function fetchWorkoutDashboard() {
  const adapter = db();
  return {
    dashboard: getWorkoutDashboard(adapter),
    metrics: getWorkoutMetrics(adapter, 30),
    categories: getWorkoutCategoryCounts(adapter),
  };
}

export async function fetchWorkoutExercises(input?: {
  search?: string;
  category?: WorkoutCategory | null;
  difficulty?: WorkoutDifficulty | null;
  muscleGroups?: MuscleGroup[];
  limit?: number;
}): Promise<WorkoutExerciseLibraryItem[]> {
  return getWorkoutExercises(db(), input);
}

export async function fetchWorkoutExercise(id: string): Promise<WorkoutExerciseLibraryItem | null> {
  return getWorkoutExerciseById(db(), id);
}

export async function fetchWorkouts(input?: {
  search?: string;
  difficulty?: WorkoutDifficulty | null;
  limit?: number;
}): Promise<WorkoutDefinition[]> {
  return getWorkouts(db(), input);
}

export async function fetchWorkout(id: string): Promise<WorkoutDefinition | null> {
  return getWorkoutById(db(), id);
}

export async function fetchWorkoutHistory(limit = 25): Promise<WorkoutSession[]> {
  return getWorkoutSessions(db(), { onlyCompleted: true, limit });
}

export async function fetchWorkoutRecordings(limit = 50): Promise<WorkoutFormRecording[]> {
  return getWorkoutFormRecordings(db(), { limit });
}

export async function doCreateWorkout(
  id: string,
  input: {
    title: string;
    description?: string;
    difficulty: WorkoutDifficulty;
    exercises: WorkoutExerciseEntry[];
    estimatedDuration?: number;
    isPremium?: boolean;
  },
): Promise<void> {
  createWorkout(db(), id, input);
}

export async function doUpdateWorkout(
  id: string,
  input: {
    title: string;
    description?: string;
    difficulty: WorkoutDifficulty;
    exercises: WorkoutExerciseEntry[];
    estimatedDuration?: number;
    isPremium?: boolean;
  },
): Promise<void> {
  updateWorkout(db(), id, input);
}

export async function doDeleteWorkout(id: string): Promise<void> {
  deleteWorkout(db(), id);
}

export async function doDeleteWorkoutRecording(id: string): Promise<void> {
  deleteWorkoutFormRecording(db(), id);
}

export async function fetchWorkoutRecording(id: string): Promise<WorkoutFormRecording | null> {
  const recordings = getWorkoutFormRecordings(db(), {});
  return recordings.find((r) => r.id === id) ?? null;
}

export async function fetchWorkoutSessions(input?: {
  workoutId?: string;
  onlyCompleted?: boolean;
  limit?: number;
}): Promise<WorkoutSession[]> {
  return getWorkoutSessions(db(), input);
}

export async function doCreateWorkoutSession(
  id: string,
  input: {
    workoutId: string;
    startedAt?: string;
  },
): Promise<void> {
  createWorkoutSession(db(), id, input);
}

export async function doCompleteWorkoutSession(
  id: string,
  input: {
    completedAt?: string;
    exercisesCompleted: CompletedExercise[];
  },
): Promise<void> {
  completeWorkoutSession(db(), id, input);
}
