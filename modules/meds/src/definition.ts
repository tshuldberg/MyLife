import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './db/schema';

const MEDS_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial meds schema — medications, doses, settings + indexes + seeds',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_SETTINGS,
  ],
  down: [
    'DROP TABLE IF EXISTS md_doses',
    'DROP TABLE IF EXISTS md_settings',
    'DROP TABLE IF EXISTS md_medications',
  ],
};

export const MEDS_MODULE: ModuleDefinition = {
  id: 'meds',
  name: 'MyMeds',
  tagline: 'Never miss a dose',
  icon: '\u{1F48A}',
  accentColor: '#06B6D4',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [MEDS_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'md_',
  navigation: {
    tabs: [
      { key: 'today', label: 'Today', icon: 'clock' },
      { key: 'medications', label: 'Medications', icon: 'pill' },
      { key: 'history', label: 'History', icon: 'calendar' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'med-detail', title: 'Medication' },
      { name: 'add-med', title: 'Add Medication' },
      { name: 'schedule', title: 'Schedule' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
