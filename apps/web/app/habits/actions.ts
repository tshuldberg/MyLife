'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  // Habit CRUD
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  countHabits,
  recordCompletion,
  getCompletions,
  getCompletionsForDate,
  deleteCompletion,
  getStreaks,
  getSetting,
  setSetting,
  // Enhanced streaks
  getStreaksWithGrace,
  getNegativeStreaks,
  getMeasurableStreaks,
  // Timed sessions
  startSession,
  endSession,
  getSessionsForHabit,
  getSessionsForDate,
  // Measurements
  recordMeasurement,
  getMeasurementsForHabit,
  getMeasurementsForDate,
  // Heatmap
  getHeatmapData,
  getHeatmapRange,
  // Statistics
  getCompletionRateByDayOfWeek,
  getCompletionRateByTimeOfDay,
  getMonthlyCompletionRate,
  getYearlyStats,
  getOverallStats,
  // Export
  exportHabitsCSV,
  exportCompletionsCSV,
  exportAllCSV,
  // Cycle tracking
  logPeriod,
  updatePeriod,
  deletePeriod,
  getPeriods,
  getPeriodsInRange,
  logSymptom,
  getSymptoms,
  updateSymptom,
  deleteSymptom,
  predictNextPeriod,
  getLatestPrediction,
  estimateFertilityWindow,
} from '@mylife/habits';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('habits');
  return adapter;
}

// ── Habit CRUD ──────────────────────────────────────────────────────────────

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
    description?: string;
    frequency?: string;
    targetCount?: number;
    icon?: string;
    color?: string;
    habitType?: string;
    timeOfDay?: string;
    specificDays?: string[];
    gracePeriod?: number;
    reminderTime?: string;
  },
) {
  createHabit(db(), id, input);
}

export async function doUpdateHabit(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    frequency: string;
    targetCount: number;
    icon: string;
    color: string;
    habitType: string;
    timeOfDay: string;
    specificDays: string[];
    gracePeriod: number;
    reminderTime: string;
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

// ── Settings ────────────────────────────────────────────────────────────────

export async function fetchSetting(key: string) {
  return getSetting(db(), key);
}

export async function doSetSetting(key: string, value: string) {
  setSetting(db(), key, value);
}

// ── Completions ─────────────────────────────────────────────────────────────

export async function doRecordCompletion(
  id: string,
  habitId: string,
  completedAt: string,
  value?: number,
  notes?: string,
) {
  recordCompletion(db(), id, habitId, completedAt, value, notes);
}

export async function fetchCompletions(
  habitId: string,
  opts?: { from?: string; to?: string },
) {
  return getCompletions(db(), habitId, opts);
}

export async function fetchCompletionsForDate(date: string) {
  return getCompletionsForDate(db(), date);
}

export async function doDeleteCompletion(id: string) {
  deleteCompletion(db(), id);
}

// ── Streaks ─────────────────────────────────────────────────────────────────

export async function fetchStreaks(habitId: string) {
  return getStreaks(db(), habitId);
}

export async function fetchStreaksWithGrace(habitId: string, gracePeriod: number) {
  return getStreaksWithGrace(db(), habitId, gracePeriod);
}

export async function fetchNegativeStreaks(habitId: string) {
  return getNegativeStreaks(db(), habitId);
}

export async function fetchMeasurableStreaks(habitId: string, gracePeriod?: number) {
  return getMeasurableStreaks(db(), habitId, gracePeriod);
}

// ── Timed Sessions ──────────────────────────────────────────────────────────

export async function doStartSession(
  id: string,
  habitId: string,
  targetSeconds: number,
) {
  startSession(db(), id, habitId, targetSeconds);
}

export async function doEndSession(id: string, durationSeconds: number) {
  endSession(db(), id, durationSeconds);
}

export async function fetchSessionsForHabit(habitId: string) {
  return getSessionsForHabit(db(), habitId);
}

export async function fetchSessionsForDate(date: string) {
  return getSessionsForDate(db(), date);
}

// ── Measurements ────────────────────────────────────────────────────────────

export async function doRecordMeasurement(
  id: string,
  habitId: string,
  measuredAt: string,
  value: number,
  target: number,
) {
  recordMeasurement(db(), id, habitId, measuredAt, value, target);
}

export async function fetchMeasurementsForHabit(habitId: string) {
  return getMeasurementsForHabit(db(), habitId);
}

export async function fetchMeasurementsForDate(date: string) {
  return getMeasurementsForDate(db(), date);
}

// ── Heatmap ─────────────────────────────────────────────────────────────────

export async function fetchHeatmapData(habitId: string, year?: number) {
  return getHeatmapData(db(), habitId, year);
}

export async function fetchHeatmapRange(habitId: string, from: string, to: string) {
  return getHeatmapRange(db(), habitId, from, to);
}

// ── Statistics ──────────────────────────────────────────────────────────────

export async function fetchDayOfWeekStats(habitId: string) {
  return getCompletionRateByDayOfWeek(db(), habitId);
}

export async function fetchTimeOfDayStats(habitId: string) {
  return getCompletionRateByTimeOfDay(db(), habitId);
}

export async function fetchMonthlyStats(habitId: string, year: number) {
  return getMonthlyCompletionRate(db(), habitId, year);
}

export async function fetchYearlyStats(habitId: string) {
  return getYearlyStats(db(), habitId);
}

export async function fetchOverallStats() {
  return getOverallStats(db());
}

// ── CSV Export ──────────────────────────────────────────────────────────────

export async function fetchExportHabitsCSV() {
  return exportHabitsCSV(db());
}

export async function fetchExportCompletionsCSV() {
  return exportCompletionsCSV(db());
}

export async function fetchExportAllCSV() {
  return exportAllCSV(db());
}

// ── Cycle Tracking ──────────────────────────────────────────────────────────

export async function doLogPeriod(
  id: string,
  input: { startDate: string; endDate?: string; cycleLength?: number; notes?: string },
) {
  logPeriod(db(), id, input);
}

export async function doUpdatePeriod(
  id: string,
  updates: Partial<{ startDate: string; endDate: string; cycleLength: number; notes: string }>,
) {
  updatePeriod(db(), id, updates);
}

export async function doDeletePeriod(id: string) {
  deletePeriod(db(), id);
}

export async function fetchPeriods() {
  return getPeriods(db());
}

export async function fetchPeriodsInRange(from: string, to: string) {
  return getPeriodsInRange(db(), from, to);
}

export async function doLogSymptom(
  id: string,
  input: { periodId: string; date: string; symptomType: string; severity: number; notes?: string },
) {
  logSymptom(db(), id, input);
}

export async function fetchSymptoms(periodId: string) {
  return getSymptoms(db(), periodId);
}

export async function doUpdateSymptom(
  id: string,
  updates: Partial<{ symptomType: string; severity: number; notes: string }>,
) {
  updateSymptom(db(), id, updates);
}

export async function doDeleteSymptom(id: string) {
  deleteSymptom(db(), id);
}

export async function fetchPrediction() {
  return predictNextPeriod(db());
}

export async function fetchLatestPrediction() {
  return getLatestPrediction(db());
}

export async function fetchFertilityWindow() {
  return estimateFertilityWindow(db());
}
