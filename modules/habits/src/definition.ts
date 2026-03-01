import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import {
  ALL_TABLES,
  CREATE_INDEXES,
  SEED_SETTINGS,
  ALTER_HABITS_V2,
  ALL_V2_TABLES,
  V2_INDEXES,
} from './db/schema';

const HABITS_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial habits schema -- habits, completions, settings + indexes + seeds',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_SETTINGS,
  ],
  down: [
    'DROP TABLE IF EXISTS hb_completions',
    'DROP TABLE IF EXISTS hb_settings',
    'DROP TABLE IF EXISTS hb_habits',
  ],
};

const HABITS_MIGRATION_V2: Migration = {
  version: 2,
  description: 'V2 -- habit types, timed sessions, measurements, cycle tracking',
  up: [
    ...ALTER_HABITS_V2,
    ...ALL_V2_TABLES,
    ...V2_INDEXES,
  ],
  down: [
    'DROP TABLE IF EXISTS cy_settings',
    'DROP TABLE IF EXISTS cy_predictions',
    'DROP TABLE IF EXISTS cy_symptoms',
    'DROP TABLE IF EXISTS cy_periods',
    'DROP TABLE IF EXISTS hb_measurements',
    'DROP TABLE IF EXISTS hb_timed_sessions',
    // Note: SQLite does not support DROP COLUMN, so V2 ALTER columns
    // remain in the table on rollback. This is acceptable for local-only data.
  ],
};

export const HABITS_MODULE: ModuleDefinition = {
  id: 'habits',
  name: 'MyHabits',
  tagline: 'Build habits that stick',
  icon: '\u{2705}',
  accentColor: '#8B5CF6',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [HABITS_MIGRATION_V1, HABITS_MIGRATION_V2],
  schemaVersion: 2,
  tablePrefix: 'hb_',
  navigation: {
    tabs: [
      { key: 'today', label: 'Today', icon: 'check-circle' },
      { key: 'habits', label: 'Habits', icon: 'list' },
      { key: 'stats', label: 'Stats', icon: 'bar-chart' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'habit-detail', title: 'Habit' },
      { name: 'add-habit', title: 'New Habit' },
      { name: 'streak-detail', title: 'Streak' },
      { name: 'cycle-tracker', title: 'Cycle Tracker' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.2.0',
};
