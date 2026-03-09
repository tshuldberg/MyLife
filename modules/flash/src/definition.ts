import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import {
  BASE_INDEXES,
  BASE_TABLES,
  DEFAULT_DECK_SEED,
  SEED_SETTINGS,
  V2_UP,
} from './db/schema';

const FLASH_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Create flash decks, cards, review logs, and settings',
  up: [...BASE_TABLES, ...BASE_INDEXES, ...SEED_SETTINGS, DEFAULT_DECK_SEED],
  down: [
    'DROP TABLE IF EXISTS fl_settings',
    'DROP TABLE IF EXISTS fl_review_logs',
    'DROP TABLE IF EXISTS fl_cards',
    'DROP TABLE IF EXISTS fl_decks',
  ],
};

const FLASH_MIGRATION_V2: Migration = {
  version: 2,
  description: 'Add browser, queue controls, export history, and reminder settings',
  up: V2_UP,
  down: [
    'DROP TABLE IF EXISTS fl_export_records',
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
  migrations: [FLASH_MIGRATION_V1, FLASH_MIGRATION_V2],
  schemaVersion: 2,
  tablePrefix: 'fl_',
  navigation: {
    tabs: [
      { key: 'study', label: 'Study', icon: 'play-circle' },
      { key: 'decks', label: 'Decks', icon: 'layers' },
      { key: 'browser', label: 'Browse', icon: 'search' },
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
