import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, DEFAULT_DECK_SEED, SEED_SETTINGS } from './db/schema';

const FLASH_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Create flash decks, cards, review logs, and settings',
  up: [...ALL_TABLES, ...CREATE_INDEXES, ...SEED_SETTINGS, DEFAULT_DECK_SEED],
  down: [
    'DROP TABLE IF EXISTS fl_settings',
    'DROP TABLE IF EXISTS fl_review_logs',
    'DROP TABLE IF EXISTS fl_cards',
    'DROP TABLE IF EXISTS fl_decks',
  ],
};

export const FLASH_MODULE: ModuleDefinition = {
  id: 'flash',
  name: 'MyFlash',
  tagline: 'Spaced repetition flashcards',
  icon: '⚡',
  accentColor: '#FBBF24',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [FLASH_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'fl_',
  navigation: {
    tabs: [
      { key: 'study', label: 'Study', icon: 'play-circle' },
      { key: 'decks', label: 'Decks', icon: 'layers' },
      { key: 'stats', label: 'Stats', icon: 'bar-chart-2' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'deck-detail', title: 'Deck' },
      { name: 'card-editor', title: 'Edit Card' },
      { name: 'review', title: 'Review' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
