// ── Module definition ─────────────────────────────────────────────────────
export { HABITS_MODULE } from './definition';

// ── Types & schemas ──────────────────────────────────────────────────────
export type {
  Habit,
  Frequency,
  HabitType,
  TimeOfDay,
  DayOfWeek,
  Completion,
  TimedSession,
  Measurement,
  StreakInfo,
  NegativeStreakInfo,
  HeatmapDay,
  HabitStats,
  OverallStats,
  CyclePeriod,
  CycleSymptom,
  CyclePrediction,
} from './types';
export {
  HabitSchema,
  FrequencySchema,
  HabitTypeSchema,
  TimeOfDaySchema,
  DayOfWeekSchema,
  CompletionSchema,
  TimedSessionSchema,
  MeasurementSchema,
  CyclePeriodSchema,
  CycleSymptomSchema,
  CyclePredictionSchema,
} from './types';

// ── Habit CRUD ───────────────────────────────────────────────────────────
export {
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
} from './db';
export type { CreateHabitInput, UpdateHabitInput } from './db';

// ── Enhanced streaks ─────────────────────────────────────────────────────
export {
  getStreaksWithGrace,
  getNegativeStreaks,
  getMeasurableStreaks,
} from './db';

// ── Timed sessions ──────────────────────────────────────────────────────
export {
  startSession,
  endSession,
  getSessionsForHabit,
  getSessionsForDate,
  deleteSession,
} from './db';

// ── Measurements ────────────────────────────────────────────────────────
export {
  recordMeasurement,
  getMeasurementsForHabit,
  getMeasurementsForDate,
  deleteMeasurement,
} from './db';

// ── Heatmap ─────────────────────────────────────────────────────────────
export { getHeatmapData, getHeatmapRange } from './heatmap';

// ── Statistics ──────────────────────────────────────────────────────────
export {
  getCompletionRateByDayOfWeek,
  getCompletionRateByTimeOfDay,
  getMonthlyCompletionRate,
  getYearlyStats,
  getOverallStats,
} from './stats';

// ── CSV export ──────────────────────────────────────────────────────────
export { exportHabitsCSV, exportCompletionsCSV, exportAllCSV } from './export';

// ── Cycle tracking ──────────────────────────────────────────────────────
export {
  logPeriod,
  updatePeriod,
  deletePeriod,
  getPeriods,
  getPeriodsInRange,
  PREDEFINED_SYMPTOMS,
  logSymptom,
  getSymptoms,
  updateSymptom,
  deleteSymptom,
  predictNextPeriod,
  getLatestPrediction,
  estimateFertilityWindow,
} from './cycle';
