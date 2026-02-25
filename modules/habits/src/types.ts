import { z } from 'zod';

// ── Frequency enum ──────────────────────────────────────────────────────────
export const FrequencySchema = z.enum(['daily', 'weekly', 'monthly']);
export type Frequency = z.infer<typeof FrequencySchema>;

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

// ── Streak info ─────────────────────────────────────────────────────────────
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}
