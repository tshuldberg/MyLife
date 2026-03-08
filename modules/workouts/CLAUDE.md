# @mylife/workouts

## Overview

Workout tracking module with body-map guided exercises, workout builder, coaching flows, form recordings, workout engine state machine, 1RM/warmup/plate calculators, voice commands, progress analytics, and structured workout plans. Features an exercise library seeded from a curated JSON dataset, workout composition from library exercises, session tracking with set weight logging, form recording references, dashboard metrics, body measurements, and workout plan subscriptions. All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `WORKOUTS_MODULE` | ModuleDefinition | Module registration contract (id: `workouts`, prefix: `wk_`, tier: premium) |
| Schemas | Zod | 18 Zod schemas (exercise, workout, session, recording, log, program, player state, set type, weight unit, 1RM formula, warmup set, plate result, voice command, body map, set weight, 1RM input, body measurement, workout plan) |
| Exercise library | Functions | `seedWorkoutExerciseLibrary`, `getWorkoutExercises`, `getWorkoutExerciseById`, `getWorkoutExerciseCount`, `getWorkoutCategoryCounts` |
| Workout CRUD | Functions | `createWorkout`, `updateWorkout`, `deleteWorkout`, `getWorkouts`, `getWorkoutById` |
| Session CRUD | Functions | `createWorkoutSession`, `completeWorkoutSession`, `getWorkoutSessions` |
| Form recordings | Functions | `createWorkoutFormRecording`, `getWorkoutFormRecordings`, `deleteWorkoutFormRecording` |
| Dashboard | Functions | `getWorkoutDashboard`, `getWorkoutMetrics` |
| Set weight tracking | Functions | `recordSetWeight`, `getSetWeightsForSession`, `getSetWeightsForExercise` |
| 1RM history | Functions | `record1RM`, `get1RMHistory`, `getLatest1RM` |
| Body measurements | Functions | `createBodyMeasurement`, `getBodyMeasurements`, `deleteBodyMeasurement` |
| Workout plans | Functions | `createWorkoutPlan`, `getWorkoutPlans`, `getWorkoutPlanById`, `updateWorkoutPlan`, `deleteWorkoutPlan` |
| Plan subscriptions | Functions | `subscribeToPlan`, `unsubscribeFromPlan`, `getActivePlanSubscription` |
| Workout engine | Functions | `createPlayerStatus`, `reducePlayer`, `playerProgress`, `formatTime`, `buildGroupNavigation`, `SPEED_OPTIONS` |
| Calculators | Functions | `calculateEpley1RM`, `calculateBrzycki1RM`, `calculate1RM`, `calculateWarmupSets`, `calculatePlates` |
| Plan helpers | Functions | `getWeekSchedule`, `getCurrentPlanPosition`, `getTodaysWorkout`, `getAllPlanWorkoutIds`, `getPlanProgress`, `getCurrentWeekDay`, `createEmptyWeek` |
| Body map | Functions + Data | `BODY_MAP_MUSCLE_GROUPS`, `SLUG_TO_MUSCLE_GROUP`, `MUSCLE_GROUP_TO_SLUGS`, `slugToMuscleGroup`, `muscleGroupToSlugs`, `muscleGroupLabel`, `buildHighlightData`, `EXERCISE_MUSCLE_MAPPINGS`, `getExercisesForMuscleGroup`, `getMuscleGroupsByRegion` |
| Voice | Functions | `parseVoiceCommand`, `getSupportedCommands` |
| Progress | Functions | `calculateStreaks`, `calculateVolume`, `calculatePersonalRecords`, `getWeeklySummaries`, `buildHistory`, `calculateWeightPRs` |
| Constants | Data | `WORKOUT_CATEGORIES`, `MUSCLE_GROUPS`, `WORKOUT_DIFFICULTIES`, `MUSCLE_GROUP_LABELS`, `STANDARD_PLATES_LBS`, `STANDARD_PLATES_KG`, `DAY_NAMES` |
| Legacy CRUD | Functions | `createWorkoutLog`, `getWorkoutLogs`, `deleteWorkoutLog`, `createWorkoutProgram`, `getWorkoutPrograms`, `setActiveWorkoutProgram`, `deleteWorkoutProgram` |

## Storage

- **Type:** sqlite
- **Table prefix:** `wk_`
- **Schema version:** 3
- **Key tables:** `wk_exercises` (exercise library), `wk_workouts` (workout definitions), `wk_workout_sessions` (active sessions), `wk_form_recordings`, `wk_workout_set_weights` (per-set weight/rep tracking), `wk_exercise_1rm_history` (1RM trend data), `wk_body_measurements` (weight/body fat/etc.), `wk_workout_plans` (structured multi-week plans), `wk_plan_subscriptions` (active plan following), `wk_workout_logs` (legacy), `wk_programs` (legacy)

## Engines

- **workout/engine.ts** -- Redux-style state machine for workout playback (idle/playing/paused/rest/completed), superset group navigation, speed control (0.5-2.0x), inter-set rest timing
- **workout/oneRM.ts** -- Epley and Brzycki 1RM estimation with edge case handling
- **workout/warmup.ts** -- Progressive warmup set calculator (bar-only, 50%, 70%, 85%)
- **workout/plates.ts** -- Greedy plate-loading algorithm for barbell setup
- **workout/plan-helpers.ts** -- Pure functions for plan position, schedule, progress tracking
- **body-map.ts** -- 14 muscle group definitions with body highlighter slug mappings, exercise-muscle mappings for 12 exercises
- **voice.ts** -- Voice command parser with 20 phrases across 5 categories (playback, pacing, navigation, info, recording)
- **progress.ts** -- Analytics: streaks, volume stats, personal records, weekly summaries, workout history, weight PRs
- **db/crud.ts** -- Dashboard aggregation, metrics calculation, exercise library seeding from JSON dataset

## Schemas

- `WorkoutFocusSchema`, `WorkoutCategorySchema`, `MuscleGroupSchema`, `WorkoutDifficultySchema`
- `WorkoutExerciseLibraryItemSchema`, `WorkoutExerciseEntrySchema`
- `WorkoutDefinitionSchema`, `WorkoutSessionSchema`, `WorkoutFormRecordingSchema`
- `WorkoutLogSchema`, `WorkoutProgramSchema`
- `PlayerStateSchema`, `SetTypeSchema`, `WeightUnitSchema`, `OneRMFormulaSchema`
- `WarmupSetSchema`, `PlateResultSchema`
- `MuscleGroupRegionSchema`, `MuscleGroupSideSchema`, `VoiceCommandCategorySchema`
- `SetWeightInputSchema`, `Record1RMInputSchema`, `BodyMeasurementInputSchema`, `WorkoutPlanInputSchema`

## Test Coverage

- **Test files:** 16
- **Tests:** 284
- **Covered:** Exercise library CRUD + seeding, workout CRUD, session lifecycle, form recordings, dashboard + metrics, set weight tracking, 1RM history, body measurements, workout plans + subscriptions, workout engine state machine (52 tests), 1RM calculators, warmup sets, plate loading, plan helpers, body map, voice parsing, progress analytics

## Parity Status

- **Standalone repo:** MyWorkouts (active standalone workspace)
- **Hub integration:** wired
- **Business logic parity:** All 8 engine modules ported from standalone. Zero-dependency pure functions copied directly with import path adaptation.
- **Parity note:** Standalone remains canonical until archived. Hub module now contains full business logic parity with standalone `packages/shared/src/`.

## Key Files

- `src/definition.ts` -- Module definition (3 migrations, 11 tables)
- `src/index.ts` -- Public API barrel export (100+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, and constants
- `src/db/crud.ts` -- All CRUD operations (40+ functions), dashboard, metrics
- `src/db/schema.ts` -- CREATE TABLE statements (11 tables)
- `src/data/exercise-seed.json` -- Curated exercise library seed data (50 exercises)
- `src/workout/engine.ts` -- Player state machine (reducePlayer, createPlayerStatus)
- `src/workout/oneRM.ts` -- 1RM calculators (Epley, Brzycki)
- `src/workout/warmup.ts` -- Warmup set calculator
- `src/workout/plates.ts` -- Plate loading calculator
- `src/workout/plan-helpers.ts` -- Plan position and progress helpers
- `src/body-map.ts` -- Muscle group definitions and mappings
- `src/voice.ts` -- Voice command parser
- `src/progress.ts` -- Progress analytics (streaks, volume, PRs)
