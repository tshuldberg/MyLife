'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createWorkoutLog,
  getWorkoutLogs,
  deleteWorkoutLog,
  createWorkoutProgram,
  getWorkoutPrograms,
  setActiveWorkoutProgram,
  deleteWorkoutProgram,
  getWorkoutMetrics,
} from '@mylife/workouts';
import type { WorkoutFocus, WorkoutLog, WorkoutProgram } from '@mylife/workouts';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('workouts');
  return adapter;
}

export async function fetchWorkoutOverview(days = 30): Promise<{
  workouts: number;
  totalMinutes: number;
  totalCalories: number;
  averageRpe: number;
}> {
  return getWorkoutMetrics(db(), days);
}

export async function fetchWorkoutPrograms(): Promise<WorkoutProgram[]> {
  return getWorkoutPrograms(db());
}

export async function fetchWorkoutLogs(input?: {
  focus?: WorkoutFocus;
  limit?: number;
}): Promise<WorkoutLog[]> {
  return getWorkoutLogs(db(), input);
}

export async function doCreateWorkoutProgram(
  id: string,
  input: {
    name: string;
    goal: string;
    weeks: number;
    sessionsPerWeek: number;
    isActive?: boolean;
  },
): Promise<void> {
  createWorkoutProgram(db(), id, input);
}

export async function doSetActiveWorkoutProgram(id: string | null): Promise<void> {
  setActiveWorkoutProgram(db(), id);
}

export async function doDeleteWorkoutProgram(id: string): Promise<void> {
  deleteWorkoutProgram(db(), id);
}

export async function doCreateWorkoutLog(
  id: string,
  input: {
    name: string;
    focus: WorkoutFocus;
    durationMin: number;
    calories?: number;
    rpe?: number;
    completedAt: string;
    notes?: string;
  },
): Promise<void> {
  createWorkoutLog(db(), id, input);
}

export async function doDeleteWorkoutLog(id: string): Promise<void> {
  deleteWorkoutLog(db(), id);
}
