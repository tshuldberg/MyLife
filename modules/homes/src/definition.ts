import type { ModuleDefinition } from '@mylife/module-registry';
import type { Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

const HOMES_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial homes schema — listings and tours',
  up: [...ALL_TABLES, ...CREATE_INDEXES],
  down: [
    'DROP TABLE IF EXISTS hm_tours',
    'DROP TABLE IF EXISTS hm_listings',
  ],
};

export const HOMES_MODULE: ModuleDefinition = {
  id: 'homes',
  name: 'MyHomes',
  tagline: 'Real estate, reimagined',
  icon: '\u{1F3E0}',
  accentColor: '#D97706',
  tier: 'premium',
  storageType: 'drizzle',
  migrations: [HOMES_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'hm_',
  navigation: {
    tabs: [
      { key: 'search', label: 'Search', icon: 'search' },
      { key: 'map', label: 'Map', icon: 'map' },
      { key: 'saved', label: 'Saved', icon: 'heart' },
      { key: 'alerts', label: 'Alerts', icon: 'bell' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'listing-detail', title: 'Listing' },
      { name: 'agent-profile', title: 'Agent' },
      { name: 'mortgage-calc', title: 'Mortgage Calculator' },
    ],
  },
  requiresAuth: true,
  requiresNetwork: false,
  version: '0.1.0',
};
