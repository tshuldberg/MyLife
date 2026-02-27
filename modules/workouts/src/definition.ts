import type { Migration, ModuleDefinition } from '@mylife/module-registry';
import {
  CREATE_FORM_RECORDINGS,
  CREATE_INDEXES,
  CREATE_WORKOUT_SESSIONS,
  CREATE_WORKOUTS,
  CREATE_EXERCISES,
  CREATE_WORKOUT_LOGS,
  CREATE_WORKOUT_PROGRAMS,
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
    ...CREATE_INDEXES,
  ],
  down: [
    'DROP TABLE IF EXISTS wk_form_recordings',
    'DROP TABLE IF EXISTS wk_workout_sessions',
    'DROP TABLE IF EXISTS wk_workouts',
    'DROP TABLE IF EXISTS wk_exercises',
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
  migrations: [WORKOUTS_MIGRATION_V1, WORKOUTS_MIGRATION_V2],
  schemaVersion: 2,
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
  version: '0.2.0',
};
