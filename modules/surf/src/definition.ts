import type { ModuleDefinition } from '@mylife/module-registry';
import type { Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

const SURF_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial surf schema — spots and sessions',
  up: [...ALL_TABLES, ...CREATE_INDEXES],
  down: [
    'DROP TABLE IF EXISTS sf_sessions',
    'DROP TABLE IF EXISTS sf_spots',
  ],
};

export const SURF_MODULE: ModuleDefinition = {
  id: 'surf',
  name: 'MySurf',
  tagline: 'Surf forecasts and spot intel',
  icon: '\u{1F3C4}',
  accentColor: '#3B82F6',
  tier: 'premium',
  storageType: 'supabase',
  migrations: [SURF_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'sf_',
  navigation: {
    tabs: [
      { key: 'forecast', label: 'Forecast', icon: 'cloud' },
      { key: 'map', label: 'Map', icon: 'map' },
      { key: 'spots', label: 'Spots', icon: 'map-pin' },
      { key: 'alerts', label: 'Alerts', icon: 'bell' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'spot-detail', title: 'Spot Details' },
      { name: 'buoy-detail', title: 'Buoy Data' },
      { name: 'session-log', title: 'Session Log' },
    ],
  },
  requiresAuth: true,
  requiresNetwork: false,
  version: '0.1.0',
};
