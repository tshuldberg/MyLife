import type { ModuleDefinition } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

export const MOOD_MODULE: ModuleDefinition = {
  id: 'mood',
  name: 'MyMood',
  tagline: 'Track your emotional wellness',
  icon: '🎭',
  accentColor: '#FB923C',
  tier: 'free',
  storageType: 'sqlite',
  schemaVersion: 1,
  tablePrefix: 'mo_',
  migrations: [
    {
      version: 1,
      description: 'Create mood tables: entries, activities, emotion tags, entry-activities, breathing sessions, settings',
      up: [...ALL_TABLES, ...CREATE_INDEXES],
      down: [
        'DROP TABLE IF EXISTS mo_settings',
        'DROP TABLE IF EXISTS mo_breathing_sessions',
        'DROP TABLE IF EXISTS mo_entry_activities',
        'DROP TABLE IF EXISTS mo_emotion_tags',
        'DROP TABLE IF EXISTS mo_activities',
        'DROP TABLE IF EXISTS mo_entries',
      ],
    },
  ],
  navigation: {
    tabs: [
      { key: 'today', label: 'Today', icon: 'smile' },
      { key: 'history', label: 'History', icon: 'clock' },
      { key: 'insights', label: 'Insights', icon: 'trending-up' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'log-mood', title: 'Log Mood' },
      { name: 'day-detail', title: 'Day Detail' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
