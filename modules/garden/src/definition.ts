import type { ModuleDefinition } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

export const GARDEN_MODULE: ModuleDefinition = {
  id: 'garden',
  name: 'MyGarden',
  tagline: 'Plant care and garden planner',
  icon: '🌱',
  accentColor: '#22C55E',
  tier: 'premium',
  storageType: 'sqlite',
  schemaVersion: 1,
  tablePrefix: 'gd_',
  migrations: [
    {
      version: 1,
      description: 'Create garden tables: plants, entries, zones, seeds, settings',
      up: [...ALL_TABLES, ...CREATE_INDEXES],
      down: [
        'DROP TABLE IF EXISTS gd_settings',
        'DROP TABLE IF EXISTS gd_seeds',
        'DROP TABLE IF EXISTS gd_zones',
        'DROP TABLE IF EXISTS gd_entries',
        'DROP TABLE IF EXISTS gd_plants',
      ],
    },
  ],
  navigation: {
    tabs: [
      { key: 'garden', label: 'Garden', icon: 'flower-2' },
      { key: 'tasks', label: 'Tasks', icon: 'check-circle' },
      { key: 'journal', label: 'Journal', icon: 'book-open' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'plant-detail', title: 'Plant' },
      { name: 'add-plant', title: 'Add Plant' },
      { name: 'journal-entry', title: 'Journal Entry' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
