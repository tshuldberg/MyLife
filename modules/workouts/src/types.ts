import { z } from 'zod';

export const WorkoutFocusSchema = z.enum([
  'full_body',
  'upper_body',
  'lower_body',
  'push',
  'pull',
  'legs',
  'cardio',
  'mobility',
  'custom',
]);
export type WorkoutFocus = z.infer<typeof WorkoutFocusSchema>;

export const WorkoutLogSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  focus: WorkoutFocusSchema,
  durationMin: z.number().int().positive(),
  calories: z.number().int().nonnegative(),
  rpe: z.number().int().min(1).max(10),
  completedAt: z.string().datetime(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type WorkoutLog = z.infer<typeof WorkoutLogSchema>;

export const WorkoutProgramSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  goal: z.string().min(1),
  weeks: z.number().int().positive(),
  sessionsPerWeek: z.number().int().positive(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});
export type WorkoutProgram = z.infer<typeof WorkoutProgramSchema>;

export interface WorkoutMetrics {
  workouts: number;
  totalMinutes: number;
  totalCalories: number;
  averageRpe: number;
}
