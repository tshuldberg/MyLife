'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  countHabits,
  recordCompletion,
  getCompletionsForDate,
  deleteCompletion,
  getStreaks,
} from '@mylife/habits';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('habits');
  return adapter;
}

export async function fetchHabits(opts?: { isArchived?: boolean }) {
  return getHabits(db(), opts);
}

export async function fetchHabitById(id: string) {
  return getHabitById(db(), id);
}

export async function doCreateHabit(
  id: string,
  input: {
    name: string;
    frequency?: string;
    targetCount?: number;
    icon?: string;
    color?: string;
  },
) {
  createHabit(db(), id, input);
}

export async function doUpdateHabit(
  id: string,
  updates: Partial<{
    name: string;
    frequency: string;
    targetCount: number;
    icon: string;
    color: string;
    isArchived: boolean;
    sortOrder: number;
  }>,
) {
  updateHabit(db(), id, updates);
}

export async function doDeleteHabit(id: string) {
  deleteHabit(db(), id);
}

export async function fetchHabitCount() {
  return countHabits(db());
}

export async function doRecordCompletion(
  id: string,
  habitId: string,
  completedAt: string,
  value?: number,
) {
  recordCompletion(db(), id, habitId, completedAt, value);
}

export async function fetchCompletionsForDate(date: string) {
  return getCompletionsForDate(db(), date);
}

export async function doDeleteCompletion(id: string) {
  deleteCompletion(db(), id);
}

export async function fetchStreaks(habitId: string) {
  return getStreaks(db(), habitId);
}
