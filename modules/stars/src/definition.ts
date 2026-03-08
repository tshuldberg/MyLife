import type { ModuleDefinition } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

export const STARS_MODULE: ModuleDefinition = {
  id: 'stars',
  name: 'MyStars',
  tagline: 'Private astrology and birth charts',
  icon: '✨',
  accentColor: '#8B5CF6',
  tier: 'premium',
  storageType: 'sqlite',
  schemaVersion: 1,
  tablePrefix: 'st_',
  migrations: [
    {
      version: 1,
      description: 'Create stars tables: birth_profiles, transits, daily_readings, saved_charts',
      up: [...ALL_TABLES, ...CREATE_INDEXES],
      down: [
        'DROP TABLE IF EXISTS st_saved_charts',
        'DROP TABLE IF EXISTS st_daily_readings',
        'DROP TABLE IF EXISTS st_transits',
        'DROP TABLE IF EXISTS st_birth_profiles',
      ],
    },
  ],
  navigation: {
    tabs: [
      { key: 'chart', label: 'Chart', icon: 'compass' },
      { key: 'transits', label: 'Transits', icon: 'sun' },
      { key: 'compatibility', label: 'Match', icon: 'users' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'birth-chart', title: 'Birth Chart' },
      { name: 'add-profile', title: 'Add Profile' },
      { name: 'transit-detail', title: 'Transit Detail' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
