import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './db/schema';

const HABITS_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial habits schema — habits, completions, settings + indexes + seeds',
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

export const HABITS_MODULE: ModuleDefinition = {
  id: 'habits',
  name: 'MyHabits',
  tagline: 'Build habits that stick',
  icon: '\u{2705}',
  accentColor: '#8B5CF6',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [HABITS_MIGRATION_V1],
  schemaVersion: 1,
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
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
