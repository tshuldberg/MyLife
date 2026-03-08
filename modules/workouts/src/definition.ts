import type { Migration, ModuleDefinition } from '@mylife/module-registry';
import {
  CREATE_FORM_RECORDINGS,
  CREATE_WORKOUT_SESSIONS,
  CREATE_WORKOUTS,
  CREATE_EXERCISES,
  CREATE_WORKOUT_LOGS,
  CREATE_WORKOUT_PROGRAMS,
  CREATE_WORKOUT_SET_WEIGHTS,
  CREATE_EXERCISE_1RM_HISTORY,
  CREATE_BODY_MEASUREMENTS,
  CREATE_WORKOUT_PLANS,
  CREATE_PLAN_SUBSCRIPTIONS,
} from './db/schema';

const WORKOUTS_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial workouts schema — programs and workout logs',
  up: [
    CREATE_WORKOUT_LOGS,
    CREATE_WORKOUT_PROGRAMS,
    `CREATE INDEX IF NOT EXISTS wk_workout_logs_focus_idx ON wk_workout_logs(focus)`,
    `CREATE INDEX IF NOT EXISTS wk_workout_logs_completed_idx ON wk_workout_logs(completed_at DESC)`,
    `CREATE INDEX IF NOT EXISTS wk_programs_active_idx ON wk_programs(is_active)`,
  ],
  down: [
    'DROP TABLE IF EXISTS wk_workout_logs',
    'DROP TABLE IF EXISTS wk_programs',
  ],
};

const WORKOUTS_MIGRATION_V2: Migration = {
  version: 2,
  description:
    'Merge standalone MyWorkouts feature architecture into MyLife module schema (exercise library, workouts, sessions, recordings)',
  up: [
    CREATE_EXERCISES,
    CREATE_WORKOUTS,
    CREATE_WORKOUT_SESSIONS,
    CREATE_FORM_RECORDINGS,
    // V2 indexes only -- V3 table indexes are in WORKOUTS_MIGRATION_V3
    `CREATE INDEX IF NOT EXISTS wk_exercises_category_idx ON wk_exercises(category)`,
    `CREATE INDEX IF NOT EXISTS wk_exercises_difficulty_idx ON wk_exercises(difficulty)`,
    `CREATE INDEX IF NOT EXISTS wk_workouts_created_idx ON wk_workouts(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS wk_workout_sessions_workout_idx ON wk_workout_sessions(workout_id)`,
    `CREATE INDEX IF NOT EXISTS wk_workout_sessions_completed_idx ON wk_workout_sessions(completed_at DESC)`,
    `CREATE INDEX IF NOT EXISTS wk_form_recordings_session_idx ON wk_form_recordings(session_id)`,
  ],
  down: [
    'DROP TABLE IF EXISTS wk_form_recordings',
    'DROP TABLE IF EXISTS wk_workout_sessions',
    'DROP TABLE IF EXISTS wk_workouts',
    'DROP TABLE IF EXISTS wk_exercises',
  ],
};

const WORKOUTS_MIGRATION_V3: Migration = {
  version: 3,
  description:
    'Add strength tracking (set weights, 1RM history), body measurements, workout plans, and plan subscriptions',
  up: [
    CREATE_WORKOUT_SET_WEIGHTS,
    CREATE_EXERCISE_1RM_HISTORY,
    CREATE_BODY_MEASUREMENTS,
    CREATE_WORKOUT_PLANS,
    CREATE_PLAN_SUBSCRIPTIONS,
    `CREATE INDEX IF NOT EXISTS wk_set_weights_session_exercise_idx ON wk_workout_set_weights(session_id, exercise_id)`,
    `CREATE INDEX IF NOT EXISTS wk_1rm_history_exercise_idx ON wk_exercise_1rm_history(exercise_id)`,
    `CREATE INDEX IF NOT EXISTS wk_body_measurements_type_measured_idx ON wk_body_measurements(type, measured_at DESC)`,
    `CREATE INDEX IF NOT EXISTS wk_workout_plans_created_idx ON wk_workout_plans(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS wk_plan_subscriptions_plan_active_idx ON wk_plan_subscriptions(plan_id, is_active)`,
  ],
  down: [
    'DROP TABLE IF EXISTS wk_plan_subscriptions',
    'DROP TABLE IF EXISTS wk_workout_plans',
    'DROP TABLE IF EXISTS wk_body_measurements',
    'DROP TABLE IF EXISTS wk_exercise_1rm_history',
    'DROP TABLE IF EXISTS wk_workout_set_weights',
  ],
};

export const WORKOUTS_MODULE: ModuleDefinition = {
  id: 'workouts',
  name: 'MyWorkouts',
  tagline: 'Body-map guided workouts, builder, and coaching flows',
  icon: '\u{1F4AA}',
  accentColor: '#EF4444',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [WORKOUTS_MIGRATION_V1, WORKOUTS_MIGRATION_V2, WORKOUTS_MIGRATION_V3],
  schemaVersion: 3,
  tablePrefix: 'wk_',
  navigation: {
    tabs: [
      { key: 'home', label: 'Home', icon: 'home' },
      { key: 'explore', label: 'Explore', icon: 'search' },
      { key: 'workouts', label: 'Workouts', icon: 'layers' },
      { key: 'progress', label: 'Progress', icon: 'trending-up' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'workout-detail', title: 'Workout' },
      { name: 'exercise-detail', title: 'Exercise' },
      { name: 'builder', title: 'Workout Builder' },
      { name: 'recordings', title: 'Form Recordings' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.3.0',
};
