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

export const WorkoutCategorySchema = z.enum([
  'cardio',
  'strength',
  'mobility',
  'fascia',
  'recovery',
  'flexibility',
  'balance',
]);
export type WorkoutCategory = z.infer<typeof WorkoutCategorySchema>;

export const MuscleGroupSchema = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'hip_flexors',
  'neck',
  'full_body',
]);
export type MuscleGroup = z.infer<typeof MuscleGroupSchema>;

export const WorkoutDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type WorkoutDifficulty = z.infer<typeof WorkoutDifficultySchema>;

export const WorkoutAudioCueSchema = z.object({
  timestamp: z.number().nonnegative(),
  text: z.string().min(1),
  type: z.enum(['instruction', 'encouragement', 'countdown']).default('instruction'),
});
export type WorkoutAudioCue = z.infer<typeof WorkoutAudioCueSchema>;

export const WorkoutExerciseLibraryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: WorkoutCategorySchema,
  muscleGroups: z.array(MuscleGroupSchema),
  difficulty: WorkoutDifficultySchema,
  defaultSets: z.number().int().positive(),
  defaultReps: z.number().int().positive().nullable(),
  defaultDuration: z.number().int().positive().nullable(),
  videoUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  audioCues: z.array(WorkoutAudioCueSchema),
  isPremium: z.boolean().default(false),
  createdAt: z.string().datetime(),
});
export type WorkoutExerciseLibraryItem = z.infer<typeof WorkoutExerciseLibraryItemSchema>;

export const WorkoutExerciseEntrySchema = z.object({
  exerciseId: z.string().min(1),
  name: z.string().min(1),
  category: WorkoutCategorySchema,
  sets: z.number().int().positive(),
  reps: z.number().int().positive().nullable(),
  duration: z.number().int().positive().nullable(),
  restAfter: z.number().int().nonnegative(),
  order: z.number().int().nonnegative(),
});
export type WorkoutExerciseEntry = z.infer<typeof WorkoutExerciseEntrySchema>;

export const WorkoutDefinitionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  difficulty: WorkoutDifficultySchema,
  exercises: z.array(WorkoutExerciseEntrySchema),
  estimatedDuration: z.number().int().nonnegative(),
  isPremium: z.boolean(),
  createdAt: z.string().datetime(),
});
export type WorkoutDefinition = z.infer<typeof WorkoutDefinitionSchema>;

export const CompletedExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  setsCompleted: z.number().int().nonnegative(),
  repsCompleted: z.number().int().nonnegative().nullable(),
  durationActual: z.number().nonnegative().nullable(),
  skipped: z.boolean(),
});
export type CompletedExercise = z.infer<typeof CompletedExerciseSchema>;

export const WorkoutSessionSchema = z.object({
  id: z.string().min(1),
  workoutId: z.string().min(1),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  exercisesCompleted: z.array(CompletedExerciseSchema),
  voiceCommandsUsed: z.array(z.object({
    command: z.string(),
    timestamp: z.number().nonnegative(),
    recognized: z.boolean(),
  })),
  paceAdjustments: z.array(z.object({
    timestamp: z.number().nonnegative(),
    speed: z.number().positive(),
    source: z.enum(['voice', 'manual']),
  })),
  createdAt: z.string().datetime(),
});
export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;

export const WorkoutFormRecordingSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  videoUrl: z.string().min(1),
  timestampStart: z.number().nonnegative(),
  timestampEnd: z.number().nonnegative(),
  coachFeedback: z.array(z.object({
    timestamp: z.number().nonnegative(),
    comment: z.string().min(1),
    coachId: z.string().min(1),
    createdAt: z.string().datetime(),
  })),
  createdAt: z.string().datetime(),
});
export type WorkoutFormRecording = z.infer<typeof WorkoutFormRecordingSchema>;

export interface WorkoutExerciseFilters {
  search?: string;
  category?: WorkoutCategory | null;
  difficulty?: WorkoutDifficulty | null;
  muscleGroups?: MuscleGroup[];
  limit?: number;
}

export interface WorkoutMetrics {
  workouts: number;
  totalMinutes: number;
  totalCalories: number;
  averageRpe: number;
}

export interface WorkoutDashboard {
  workouts: number;
  exercises: number;
  sessions: number;
  streakDays: number;
  totalMinutes30d: number;
}

export interface WorkoutSeedItem {
  name: string;
  description: string;
  category: WorkoutCategory;
  muscleGroups: MuscleGroup[];
  difficulty: WorkoutDifficulty;
  defaultSets: number;
  defaultReps: number | null;
  defaultDuration?: number;
  audioCueText: string;
}

// Legacy shapes kept exported for compatibility with existing callers.
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

export interface WorkoutCategoryCount {
  category: WorkoutCategory;
  count: number;
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  core: 'Core',
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  hip_flexors: 'Hip Flexors',
  neck: 'Neck',
  full_body: 'Full Body',
};

export const WORKOUT_CATEGORIES: readonly WorkoutCategory[] = WorkoutCategorySchema.options;
export const MUSCLE_GROUPS: readonly MuscleGroup[] = MuscleGroupSchema.options;
export const WORKOUT_DIFFICULTIES: readonly WorkoutDifficulty[] = WorkoutDifficultySchema.options;
