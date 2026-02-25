import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './db/schema';

const CAR_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial car schema — vehicles, maintenance, fuel_logs, settings + indexes + seeds',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_SETTINGS,
  ],
  down: [
    'DROP TABLE IF EXISTS cr_fuel_logs',
    'DROP TABLE IF EXISTS cr_maintenance',
    'DROP TABLE IF EXISTS cr_settings',
    'DROP TABLE IF EXISTS cr_vehicles',
  ],
};

export const CAR_MODULE: ModuleDefinition = {
  id: 'car',
  name: 'MyCar',
  tagline: 'Vehicle maintenance tracker',
  icon: '\u{1F697}',
  accentColor: '#6366F1',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [CAR_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'cr_',
  navigation: {
    tabs: [
      { key: 'dashboard', label: 'Dashboard', icon: 'gauge' },
      { key: 'maintenance', label: 'Maintenance', icon: 'wrench' },
      { key: 'fuel', label: 'Fuel', icon: 'droplet' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'vehicle-detail', title: 'Vehicle' },
      { name: 'add-record', title: 'Add Record' },
      { name: 'service-history', title: 'Service History' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
