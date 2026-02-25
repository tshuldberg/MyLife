import type { ModuleDefinition } from '@mylife/module-registry';
import type { Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

const WORKOUTS_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial workouts schema — programs and workout logs',
  up: [...ALL_TABLES, ...CREATE_INDEXES],
  down: [
    'DROP TABLE IF EXISTS wk_workout_logs',
    'DROP TABLE IF EXISTS wk_programs',
  ],
};

export const WORKOUTS_MODULE: ModuleDefinition = {
  id: 'workouts',
  name: 'MyWorkouts',
  tagline: 'Your AI workout companion',
  icon: '\u{1F4AA}',
  accentColor: '#EF4444',
  tier: 'premium',
  storageType: 'supabase',
  migrations: [WORKOUTS_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'wk_',
  navigation: {
    tabs: [
      { key: 'today', label: 'Today', icon: 'zap' },
      { key: 'programs', label: 'Programs', icon: 'layers' },
      { key: 'history', label: 'History', icon: 'clock' },
      { key: 'stats', label: 'Stats', icon: 'trending-up' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'workout-detail', title: 'Workout' },
      { name: 'exercise-detail', title: 'Exercise' },
      { name: 'active-workout', title: 'In Progress' },
    ],
  },
  requiresAuth: true,
  requiresNetwork: false,
  version: '0.1.0',
};
