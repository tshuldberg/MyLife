import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './db/schema';

const SUBS_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial subs schema — subscriptions, price_history, settings + indexes + seeds',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_SETTINGS,
  ],
  down: [
    'DROP TABLE IF EXISTS sb_price_history',
    'DROP TABLE IF EXISTS sb_settings',
    'DROP TABLE IF EXISTS sb_subscriptions',
  ],
};

export const SUBS_MODULE: ModuleDefinition = {
  id: 'subs',
  name: 'MySubs',
  tagline: 'Track every subscription',
  icon: '\uD83D\uDD01',
  accentColor: '#F59E0B',
  tier: 'free',
  storageType: 'sqlite',
  migrations: [SUBS_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'sb_',
  navigation: {
    tabs: [
      { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { key: 'subscriptions', label: 'Subs', icon: 'list' },
      { key: 'calendar', label: 'Calendar', icon: 'calendar' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
