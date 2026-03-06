# @mylife/workouts

## Overview

Workout tracking module with body-map guided exercises, workout builder, coaching flows, and form recordings. Features an exercise library seeded from a curated JSON dataset, workout composition from library exercises, session tracking with completion state, form recording references, dashboard metrics, and legacy workout log/program support. All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `WORKOUTS_MODULE` | ModuleDefinition | Module registration contract (id: `workouts`, prefix: `wk_`, tier: premium) |
| `WorkoutExerciseLibraryItemSchema` | Zod schema + type | Exercise library entry (name, category, muscle groups, difficulty, equipment) |
| `WorkoutDefinitionSchema` | Zod schema + type | Workout definition with exercise entries |
| `WorkoutSessionSchema` | Zod schema + type | Active workout session with completion tracking |
| `WorkoutFormRecordingSchema` | Zod schema + type | Form recording reference (video URI) |
| `WorkoutLogSchema` | Zod schema + type | Legacy workout log entry (name, focus, duration, calories, RPE) |
| `WorkoutProgramSchema` | Zod schema + type | Legacy workout program (goal, weeks, sessions per week) |
| Exercise library | Functions | `seedWorkoutExerciseLibrary`, `getWorkoutExercises`, `getWorkoutExerciseById`, `getWorkoutExerciseCount`, `getWorkoutCategoryCounts` |
| Workout CRUD | Functions | `createWorkout`, `updateWorkout`, `deleteWorkout`, `getWorkouts`, `getWorkoutById` |
| Session CRUD | Functions | `createWorkoutSession`, `completeWorkoutSession`, `getWorkoutSessions` |
| Form recordings | Functions | `createWorkoutFormRecording`, `getWorkoutFormRecordings`, `deleteWorkoutFormRecording` |
| Dashboard | Functions | `getWorkoutDashboard`, `getWorkoutMetrics` |
| Legacy CRUD | Functions | `createWorkoutLog`, `getWorkoutLogs`, `deleteWorkoutLog`, `createWorkoutProgram`, `getWorkoutPrograms`, `setActiveWorkoutProgram`, `deleteWorkoutProgram` |
| Constants | Data | `WORKOUT_CATEGORIES`, `MUSCLE_GROUPS`, `WORKOUT_DIFFICULTIES`, `MUSCLE_GROUP_LABELS` |

## Storage

- **Type:** sqlite
- **Table prefix:** `wk_`
- **Schema version:** 2
- **Key tables:** `wk_exercises` (exercise library), `wk_workouts` (workout definitions), `wk_workout_sessions` (active sessions), `wk_form_recordings`, `wk_workout_logs` (legacy), `wk_programs` (legacy)

## Engines

- **db/crud.ts** -- Dashboard aggregation (workout count, session stats, category breakdown), metrics calculation, exercise library seeding from JSON dataset

## Schemas

- `WorkoutFocusSchema`, `WorkoutCategorySchema`, `MuscleGroupSchema`, `WorkoutDifficultySchema`
- `WorkoutExerciseLibraryItemSchema`, `WorkoutExerciseEntrySchema`
- `WorkoutDefinitionSchema`, `WorkoutSessionSchema`, `WorkoutFormRecordingSchema`
- `WorkoutLogSchema`, `WorkoutProgramSchema`

## Test Coverage

- **Test files:** 0 (passWithNoTests in test script)
- **Covered:** none
- **Gaps:** All CRUD operations, exercise library seeding, dashboard, metrics, session lifecycle

## Parity Status

- **Standalone repo:** MyWorkouts (exists as standalone submodule)
- **Hub integration:** wired

## Key Files

- `src/definition.ts` -- Module definition (2 migrations, 6 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All Zod schemas, TypeScript types, and constants
- `src/db/crud.ts` -- All CRUD operations, dashboard, metrics
- `src/db/schema.ts` -- CREATE TABLE statements
- `src/data/exercise-seed.json` -- Curated exercise library seed data
