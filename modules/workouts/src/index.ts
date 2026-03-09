export { WORKOUTS_MODULE } from './definition';

// ── Types (re-exported for consumers) ──
export type {
  WorkoutFocus,
  WorkoutCategory,
  MuscleGroup,
  WorkoutDifficulty,
  WorkoutAudioCue,
  WorkoutExerciseLibraryItem,
  WorkoutExerciseEntry,
  WorkoutDefinition,
  WorkoutSession,
  WorkoutFormRecording,
  WorkoutExerciseFilters,
  WorkoutMetrics,
  WorkoutDashboard,
  WorkoutSeedItem,
  WorkoutLog,
  WorkoutProgram,
  WorkoutCategoryCount,
  CompletedExercise,
  // Engine types
  PlayerState,
  PlayerStatus,
  PlayerAction,
  WorkoutExerciseInput,
  EngineCompletedExercise,
  SetType,
  WeightUnit,
  // Calculator types
  OneRMFormula,
  WarmupSet,
  PlateResult,
  // Body map types
  MuscleGroupDefinition,
  MuscleGroupRegion,
  MuscleGroupSide,
  BodyHighlightDatum,
  ExerciseMuscleMapping,
  // Voice types
  VoiceCommandCategory,
  VoiceCommand,
  // Progress types
  StreakInfo,
  VolumeStats,
  PersonalRecord,
  PeriodSummary,
  WorkoutHistoryEntry,
  WeightPR,
  ProgressSession,
  ProgressExercise,
  // Plan types
  WorkoutPlan,
  WorkoutPlanDay,
  WorkoutPlanWeek,
  // DB input/row types
  SetWeightInput,
  SetWeightRow,
  Record1RMInput,
  Exercise1RMRow,
  BodyMeasurementInput,
  BodyMeasurementRow,
  WorkoutPlanInput,
  PlanSubscriptionRow,
} from './types';

// ── Schemas ──
export {
  WorkoutFocusSchema,
  WorkoutCategorySchema,
  MuscleGroupSchema,
  WorkoutDifficultySchema,
  WorkoutExerciseLibraryItemSchema,
  WorkoutExerciseEntrySchema,
  WorkoutDefinitionSchema,
  WorkoutSessionSchema,
  WorkoutFormRecordingSchema,
  WorkoutLogSchema,
  WorkoutProgramSchema,
  PlayerStateSchema,
  SetTypeSchema,
  WeightUnitSchema,
  OneRMFormulaSchema,
  WarmupSetSchema,
  PlateResultSchema,
  MuscleGroupRegionSchema,
  MuscleGroupSideSchema,
  VoiceCommandCategorySchema,
  SetWeightInputSchema,
  Record1RMInputSchema,
  BodyMeasurementInputSchema,
  WorkoutPlanInputSchema,
  WORKOUT_CATEGORIES,
  MUSCLE_GROUPS,
  WORKOUT_DIFFICULTIES,
  MUSCLE_GROUP_LABELS,
} from './types';

// ── DB CRUD ──
export {
  // Exercise library
  seedWorkoutExerciseLibrary,
  getWorkoutExercises,
  getWorkoutExerciseById,
  getWorkoutExerciseCount,
  getWorkoutCategoryCounts,
  // Workout CRUD
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkouts,
  getWorkoutById,
  // Session lifecycle
  createWorkoutSession,
  completeWorkoutSession,
  getWorkoutSessions,
  // Form recordings
  createWorkoutFormRecording,
  getWorkoutFormRecordings,
  deleteWorkoutFormRecording,
  // Dashboard + metrics
  getWorkoutDashboard,
  getWorkoutMetrics,
  // Set weight tracking
  recordSetWeight,
  getSetWeightsForSession,
  getSetWeightsForExercise,
  // 1RM history
  record1RM,
  get1RMHistory,
  getLatest1RM,
  // Body measurements
  createBodyMeasurement,
  getBodyMeasurements,
  deleteBodyMeasurement,
  // Workout plans
  createWorkoutPlan,
  getWorkoutPlans,
  getWorkoutPlanById,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  // Plan subscriptions
  subscribeToPlan,
  unsubscribeFromPlan,
  getActivePlanSubscription,
  // Legacy
  createWorkoutLog,
  getWorkoutLogs,
  deleteWorkoutLog,
  createWorkoutProgram,
  getWorkoutPrograms,
  setActiveWorkoutProgram,
  deleteWorkoutProgram,
} from './db';

// ── Workout Engine ──
export {
  createPlayerStatus,
  reducePlayer,
  playerProgress,
  formatTime,
  buildGroupNavigation,
  SPEED_OPTIONS,
  calculateEpley1RM,
  calculateBrzycki1RM,
  calculate1RM,
  calculateWarmupSets,
  calculatePlates,
  STANDARD_PLATES_LBS,
  STANDARD_PLATES_KG,
  DAY_NAMES,
  getWeekSchedule,
  getCurrentPlanPosition,
  getTodaysWorkout,
  getAllPlanWorkoutIds,
  getPlanProgress,
  getCurrentWeekDay,
  createEmptyWeek,
} from './workout';

// ── Body Map ──
export {
  BODY_MAP_MUSCLE_GROUPS,
  SLUG_TO_MUSCLE_GROUP,
  MUSCLE_GROUP_TO_SLUGS,
  slugToMuscleGroup,
  muscleGroupToSlugs,
  muscleGroupLabel,
  buildHighlightData,
  EXERCISE_MUSCLE_MAPPINGS,
  getExercisesForMuscleGroup,
  getMuscleGroupsByRegion,
} from './body-map';

// ── Voice ──
export { parseVoiceCommand, getSupportedCommands } from './voice';

// ── Progress ──
export {
  calculateStreaks,
  calculateVolume,
  calculatePersonalRecords,
  getWeeklySummaries,
  buildHistory,
  calculateWeightPRs,
} from './progress';
