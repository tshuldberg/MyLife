import type { ModuleDefinition } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

export const CYCLE_MODULE: ModuleDefinition = {
  id: 'cycle',
  name: 'MyCycle',
  tagline: 'Private period and fertility tracker',
  icon: '🌙',
  accentColor: '#F472B6',
  tier: 'premium',
  storageType: 'sqlite',
  schemaVersion: 1,
  tablePrefix: 'cy_',
  migrations: [
    {
      version: 1,
      description: 'Create cycle tables: cycles, cycle_days, symptoms',
      up: [...ALL_TABLES, ...CREATE_INDEXES],
      down: [
        'DROP TABLE IF EXISTS cy_symptoms',
        'DROP TABLE IF EXISTS cy_cycle_days',
        'DROP TABLE IF EXISTS cy_cycles',
      ],
    },
  ],
  navigation: {
    tabs: [
      { key: 'today', label: 'Today', icon: 'calendar-check' },
      { key: 'calendar', label: 'Calendar', icon: 'calendar' },
      { key: 'insights', label: 'Insights', icon: 'trending-up' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'log-day', title: 'Log Day' },
      { name: 'cycle-detail', title: 'Cycle Detail' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
