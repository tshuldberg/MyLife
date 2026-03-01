import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import {
  ALL_TABLES,
  CREATE_INDEXES,
  SEED_PROTOCOLS,
  SEED_SETTINGS,
  SEED_NOTIFICATIONS_CONFIG,
} from './db/schema';

const FAST_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial fast schema',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_PROTOCOLS,
    ...SEED_SETTINGS,
    ...SEED_NOTIFICATIONS_CONFIG,
  ],
  down: [
    'DROP TABLE IF EXISTS ft_notifications_config',
    'DROP TABLE IF EXISTS ft_goal_progress',
    'DROP TABLE IF EXISTS ft_goals',
    'DROP TABLE IF EXISTS ft_water_intake',
    'DROP TABLE IF EXISTS ft_active_fast',
    'DROP TABLE IF EXISTS ft_streak_cache',
    'DROP TABLE IF EXISTS ft_settings',
    'DROP TABLE IF EXISTS ft_protocols',
    'DROP TABLE IF EXISTS ft_weight_entries',
    'DROP TABLE IF EXISTS ft_fasts',
  ],
};

const FAST_MIGRATION_V2: Migration = {
  version: 2,
  description: 'Feature set 1 additions - water, goals, notifications defaults',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_SETTINGS,
    ...SEED_NOTIFICATIONS_CONFIG,
  ],
  down: [
    'DELETE FROM ft_notifications_config',
  ],
};

export const FAST_MODULE: ModuleDefinition = {
  id: 'fast',
  name: 'MyFast',
  tagline: 'Intermittent fasting timer',
  icon: '\u23F1\uFE0F',
  accentColor: '#14B8A6',
  tier: 'free',
  storageType: 'sqlite',
  migrations: [FAST_MIGRATION_V1, FAST_MIGRATION_V2],
  schemaVersion: 2,
  tablePrefix: 'ft_',
  navigation: {
    tabs: [
      { key: 'timer', label: 'Timer', icon: 'clock' },
      { key: 'history', label: 'History', icon: 'list' },
      { key: 'stats', label: 'Stats', icon: 'bar-chart' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
