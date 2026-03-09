import type { ModuleDefinition } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

export const TRAILS_MODULE: ModuleDefinition = {
  id: 'trails',
  name: 'MyTrails',
  tagline: 'Offline hiking and trail guide',
  icon: '🥾',
  accentColor: '#65A30D',
  tier: 'premium',
  storageType: 'sqlite',
  schemaVersion: 1,
  tablePrefix: 'tr_',
  migrations: [
    {
      version: 1,
      description: 'Create trails tables: trails, recordings, waypoints, photos',
      up: [...ALL_TABLES, ...CREATE_INDEXES],
      down: [
        'DROP TABLE IF EXISTS tr_photos',
        'DROP TABLE IF EXISTS tr_waypoints',
        'DROP TABLE IF EXISTS tr_recordings',
        'DROP TABLE IF EXISTS tr_trails',
      ],
    },
  ],
  navigation: {
    tabs: [
      { key: 'map', label: 'Map', icon: 'map' },
      { key: 'trails', label: 'Trails', icon: 'navigation' },
      { key: 'recordings', label: 'Recordings', icon: 'activity' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'trail-detail', title: 'Trail' },
      { name: 'recording', title: 'Recording' },
      { name: 'elevation-profile', title: 'Elevation' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
