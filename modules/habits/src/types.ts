import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────

export const HabitTypeSchema = z.enum(['standard', 'timed', 'negative', 'measurable']);
export type HabitType = z.infer<typeof HabitTypeSchema>;

export const TimeOfDaySchema = z.enum(['morning', 'afternoon', 'evening', 'anytime']);
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

export const FrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'specific_days']);
export type Frequency = z.infer<typeof FrequencySchema>;

export const DayOfWeekSchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;

// ── Habit ───────────────────────────────────────────────────────────────────

export const HabitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  frequency: FrequencySchema,
  targetCount: z.number().int(),
  unit: z.string().nullable(),
  habitType: HabitTypeSchema,
  timeOfDay: TimeOfDaySchema,
  specificDays: z.array(DayOfWeekSchema).nullable(),
  gracePeriod: z.number().int(),
  reminderTime: z.string().nullable(),
  isArchived: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Habit = z.infer<typeof HabitSchema>;

// ── Completion ──────────────────────────────────────────────────────────────

export const CompletionSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  completedAt: z.string(),
  value: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type Completion = z.infer<typeof CompletionSchema>;

// ── Timed Session ───────────────────────────────────────────────────────────

export const TimedSessionSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  startedAt: z.string(),
  durationSeconds: z.number().int(),
  targetSeconds: z.number().int(),
  completed: z.boolean(),
  createdAt: z.string(),
});
export type TimedSession = z.infer<typeof TimedSessionSchema>;

// ── Measurement ─────────────────────────────────────────────────────────────

export const MeasurementSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  measuredAt: z.string(),
  value: z.number(),
  target: z.number(),
  createdAt: z.string(),
});
export type Measurement = z.infer<typeof MeasurementSchema>;

// ── Streak info ─────────────────────────────────────────────────────────────

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

export interface NegativeStreakInfo {
  daysSinceLastSlip: number;
  longestCleanStreak: number;
}

// ── Heatmap ─────────────────────────────────────────────────────────────────

export interface HeatmapDay {
  date: string;
  count: number;
}

// ── Statistics ───────────────────────────────────────────────────────────────

export interface HabitStats {
  totalCompletions: number;
  completionRate: number;
  bestDay: string;
  bestTimeOfDay: string;
  monthlyRates: Record<string, number>;
  averagePerWeek: number;
  bestStreak: number;
}

export interface OverallStats {
  totalHabits: number;
  totalCompletions: number;
  averageCompletionRate: number;
  bestHabit: { id: string; name: string; completionRate: number } | null;
}

// ── Cycle Tracking ──────────────────────────────────────────────────────────

export const CyclePeriodSchema = z.object({
  id: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  cycleLength: z.number().int().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CyclePeriod = z.infer<typeof CyclePeriodSchema>;

export const CycleSymptomSchema = z.object({
  id: z.string(),
  periodId: z.string(),
  date: z.string(),
  symptomType: z.string(),
  severity: z.number().int().min(1).max(5),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type CycleSymptom = z.infer<typeof CycleSymptomSchema>;

export const CyclePredictionSchema = z.object({
  id: z.string(),
  predictedStart: z.string(),
  predictedEnd: z.string(),
  confidenceDays: z.number(),
  algorithmVersion: z.string(),
  createdAt: z.string(),
});
export type CyclePrediction = z.infer<typeof CyclePredictionSchema>;
