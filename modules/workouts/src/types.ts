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

// ── Engine Types ──

export const PlayerStateSchema = z.enum(['idle', 'playing', 'paused', 'rest', 'completed']);
export type PlayerState = z.infer<typeof PlayerStateSchema>;

export const SetTypeSchema = z.enum(['normal', 'superset', 'dropset', 'giant', 'pyramid']);
export type SetType = z.infer<typeof SetTypeSchema>;

export const WeightUnitSchema = z.enum(['lbs', 'kg']);
export type WeightUnit = z.infer<typeof WeightUnitSchema>;

/** Engine input shape -- uses snake_case to match the workout player state machine. */
export interface WorkoutExerciseInput {
  exercise_id: string;
  sets: number;
  reps: number | null;
  duration: number | null;
  rest_after: number;
  order: number;
  weight?: number;
  weightUnit?: WeightUnit;
  setType?: SetType;
  setGroupId?: string;
}

/** Completed exercise as recorded by the engine -- snake_case. */
export interface EngineCompletedExercise {
  exercise_id: string;
  sets_completed: number;
  reps_completed: number | null;
  duration_actual: number | null;
  skipped: boolean;
  weight?: number;
  weightUnit?: WeightUnit;
  estimated1RM?: number;
}

export interface PlayerStatus {
  state: PlayerState;
  currentExerciseIndex: number;
  currentSet: number;
  currentRep: number;
  elapsedTime: number;
  exerciseElapsed: number;
  restRemaining: number;
  speed: number;
  exercises: WorkoutExerciseInput[];
  completed: EngineCompletedExercise[];
  groupNavigation: {
    nextInGroupByIndex: Record<number, number | undefined>;
    firstInGroupById: Record<string, number>;
  };
}

export type PlayerAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'COMPLETE_REP' }
  | { type: 'COMPLETE_SET' }
  | { type: 'SKIP_EXERCISE' }
  | { type: 'PREVIOUS_EXERCISE' }
  | { type: 'ADJUST_SPEED'; direction: 'faster' | 'slower' | 'normal' }
  | { type: 'REST_COMPLETE' };

// ── Calculator Types ──

export const OneRMFormulaSchema = z.enum(['epley', 'brzycki']);
export type OneRMFormula = z.infer<typeof OneRMFormulaSchema>;

export const WarmupSetSchema = z.object({
  weight: z.number(),
  reps: z.number().int().positive(),
  percentage: z.number().nonnegative(),
});
export type WarmupSet = z.infer<typeof WarmupSetSchema>;

export const PlateResultSchema = z.object({
  perSide: z.array(z.object({ weight: z.number(), count: z.number().int().positive() })),
  totalWeight: z.number(),
  remainder: z.number(),
});
export type PlateResult = z.infer<typeof PlateResultSchema>;

// ── Body Map Types ──

export const MuscleGroupRegionSchema = z.enum(['upper', 'core', 'lower']);
export type MuscleGroupRegion = z.infer<typeof MuscleGroupRegionSchema>;

export const MuscleGroupSideSchema = z.enum(['front', 'back', 'both']);
export type MuscleGroupSide = z.infer<typeof MuscleGroupSideSchema>;

export interface MuscleGroupDefinition {
  id: MuscleGroup;
  label: string;
  region: MuscleGroupRegion;
  side: MuscleGroupSide;
}

export interface BodyHighlightDatum {
  slug: string;
  intensity: number;
  color?: string;
}

export interface ExerciseMuscleMapping {
  exerciseName: string;
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
}

// ── Voice Types ──

export const VoiceCommandCategorySchema = z.enum(['playback', 'pacing', 'navigation', 'info', 'recording']);
export type VoiceCommandCategory = z.infer<typeof VoiceCommandCategorySchema>;

export interface VoiceCommand {
  category: VoiceCommandCategory;
  action: string;
  confidence: number;
  raw: string;
}

// ── Progress Types ──

export interface StreakInfo {
  current: number;
  longest: number;
  lastWorkoutDate: string | null;
}

export interface VolumeStats {
  totalSessions: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalDurationMinutes: number;
  byMuscleGroup: Record<string, number>;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxReps: number;
  maxSets: number;
  maxDuration: number | null;
  maxWeight?: number;
  max1RM?: number;
  achievedAt: string;
}

export interface PeriodSummary {
  label: string;
  sessions: number;
  totalMinutes: number;
  totalReps: number;
}

export interface WorkoutHistoryEntry {
  sessionId: string;
  workoutId: string;
  workoutTitle: string;
  date: string;
  durationMinutes: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  totalReps: number;
}

export interface WeightPR {
  maxWeight: number;
  max1RM: number;
  date: string;
}

// ── Plan Types ──

export interface WorkoutPlanDay {
  day_number: number;
  workout_id: string | null;
  rest_day: boolean;
  notes: string | null;
}

export interface WorkoutPlanWeek {
  week_number: number;
  days: WorkoutPlanDay[];
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  creatorId: string | null;
  weeks: WorkoutPlanWeek[];
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── DB Input Types ──

export const SetWeightInputSchema = z.object({
  sessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  setNumber: z.number().int().positive(),
  weight: z.number().positive(),
  reps: z.number().int().positive(),
  unit: WeightUnitSchema.default('lbs'),
  estimated1rm: z.number().nonnegative().optional(),
});
export type SetWeightInput = z.input<typeof SetWeightInputSchema>;

export const Record1RMInputSchema = z.object({
  exerciseId: z.string().min(1),
  maxWeight: z.number().positive(),
  maxReps: z.number().int().positive(),
  estimated1rm: z.number().nonnegative(),
  unit: WeightUnitSchema.default('lbs'),
  achievedAt: z.string().min(1),
});
export type Record1RMInput = z.input<typeof Record1RMInputSchema>;

export const BodyMeasurementInputSchema = z.object({
  type: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  measuredAt: z.string().min(1),
});
export type BodyMeasurementInput = z.infer<typeof BodyMeasurementInputSchema>;

export const WorkoutPlanInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  creatorId: z.string().nullable().default(null),
  weeksJson: z.string(),
  isPremium: z.boolean().default(false),
});
export type WorkoutPlanInput = z.input<typeof WorkoutPlanInputSchema>;

// ── DB Row Types ──

export interface SetWeightRow {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  unit: WeightUnit;
  estimated1rm: number;
  createdAt: string;
}

export interface Exercise1RMRow {
  id: string;
  exerciseId: string;
  maxWeight: number;
  maxReps: number;
  estimated1rm: number;
  unit: WeightUnit;
  achievedAt: string;
  createdAt: string;
}

export interface BodyMeasurementRow {
  id: string;
  type: string;
  value: number;
  unit: string;
  measuredAt: string;
  createdAt: string;
}

export interface PlanSubscriptionRow {
  id: string;
  planId: string;
  startedAt: string;
  isActive: boolean;
  createdAt: string;
}

// ── Progress Engine Input Type ──
// Used by the progress module -- uses snake_case matching standalone session shape.

export interface ProgressSession {
  id: string;
  workout_id: string;
  started_at: string;
  completed_at: string | null;
  exercises_completed: EngineCompletedExercise[];
}

export interface ProgressExercise {
  id: string;
  name: string;
  muscle_groups: MuscleGroup[];
}

export const WORKOUT_CATEGORIES: readonly WorkoutCategory[] = WorkoutCategorySchema.options;
export const MUSCLE_GROUPS: readonly MuscleGroup[] = MuscleGroupSchema.options;
export const WORKOUT_DIFFICULTIES: readonly WorkoutDifficulty[] = WorkoutDifficultySchema.options;
