import type { ModuleDefinition } from '@mylife/module-registry';
import { HEALTH_MIGRATION_V1 } from './db/migrations';

export const HEALTH_MODULE: ModuleDefinition = {
  id: 'health',
  name: 'MyHealth',
  tagline: 'Your complete health companion',
  icon: '\u{1FA7A}',
  accentColor: '#10B981',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [HEALTH_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'hl_',
  freeSections: ['fasting'],
  navigation: {
    tabs: [
      { key: 'today', label: 'Today', icon: 'activity' },
      { key: 'fasting', label: 'Fasting', icon: 'clock' },
      { key: 'vitals', label: 'Vitals', icon: 'heart' },
      { key: 'insights', label: 'Insights', icon: 'trending-up' },
      { key: 'vault', label: 'Vault', icon: 'shield' },
    ],
    screens: [
      // Fasting screens
      { name: 'fast-detail', title: 'Fast Details' },
      { name: 'choose-plan', title: 'Choose Plan' },
      // Medication screens
      { name: 'med-detail', title: 'Medication' },
      { name: 'add-med', title: 'Add Medication' },
      { name: 'schedule', title: 'Schedule' },
      { name: 'interactions', title: 'Interactions' },
      // Vitals screens
      { name: 'measurement-log', title: 'Log Measurement' },
      { name: 'vital-detail', title: 'Vital Detail' },
      { name: 'cycle-tracker', title: 'Cycle Tracker' },
      { name: 'sleep-detail', title: 'Sleep Detail' },
      // Insights screens
      { name: 'mood-check-in', title: 'Mood Check-In' },
      { name: 'correlation', title: 'Correlations' },
      { name: 'wellness-timeline', title: 'Wellness Timeline' },
      { name: 'export', title: 'Export Data' },
      // Vault screens
      { name: 'add-document', title: 'Add Document' },
      { name: 'document-viewer', title: 'Document' },
      { name: 'emergency-info', title: 'Emergency Info' },
      { name: 'health-sync-settings', title: 'Health Sync' },
      // Goals
      { name: 'goal-detail', title: 'Goal' },
      { name: 'add-goal', title: 'New Goal' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
