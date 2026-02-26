import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import {
  ALL_TABLES,
  CREATE_BOOKS_FTS,
  CREATE_FTS_TRIGGERS,
  CREATE_INDEXES,
  CREATE_SHARE_EVENTS,
  CREATE_SHARE_INDEXES,
  CREATE_READER_DOCUMENTS,
  CREATE_READER_NOTES,
  CREATE_READER_PREFERENCES,
  CREATE_READER_INDEXES,
  SEED_SYSTEM_SHELVES,
} from './db/schema';

const BOOKS_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial books schema — 11 tables, FTS5, triggers, indexes, system shelves',
  up: [
    ...ALL_TABLES,
    CREATE_BOOKS_FTS,
    ...CREATE_FTS_TRIGGERS,
    ...CREATE_INDEXES,
    ...SEED_SYSTEM_SHELVES,
  ],
  down: [
    'DROP TABLE IF EXISTS bk_books_fts',
    'DROP TABLE IF EXISTS bk_book_tags',
    'DROP TABLE IF EXISTS bk_book_shelves',
    'DROP TABLE IF EXISTS bk_reading_sessions',
    'DROP TABLE IF EXISTS bk_reviews',
    'DROP TABLE IF EXISTS bk_reading_goals',
    'DROP TABLE IF EXISTS bk_import_log',
    'DROP TABLE IF EXISTS bk_ol_cache',
    'DROP TABLE IF EXISTS bk_settings',
    'DROP TABLE IF EXISTS bk_tags',
    'DROP TABLE IF EXISTS bk_shelves',
    'DROP TABLE IF EXISTS bk_books',
  ],
};

const BOOKS_MIGRATION_V2: Migration = {
  version: 2,
  description: 'Add sharing primitives for visibility-based social events',
  up: [
    CREATE_SHARE_EVENTS,
    ...CREATE_SHARE_INDEXES,
  ],
  down: [
    'DROP TABLE IF EXISTS bk_share_events',
  ],
};

const BOOKS_MIGRATION_V3: Migration = {
  version: 3,
  description: 'Add local e-reader documents, highlights, and reader preferences',
  up: [
    CREATE_READER_DOCUMENTS,
    CREATE_READER_NOTES,
    CREATE_READER_PREFERENCES,
    ...CREATE_READER_INDEXES,
  ],
  down: [
    'DROP TABLE IF EXISTS bk_reader_preferences',
    'DROP TABLE IF EXISTS bk_reader_notes',
    'DROP TABLE IF EXISTS bk_reader_documents',
  ],
};

export const BOOKS_MODULE: ModuleDefinition = {
  id: 'books',
  name: 'MyBooks',
  tagline: 'Track your reading life',
  icon: '\uD83D\uDCDA',
  accentColor: '#C9894D',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [BOOKS_MIGRATION_V1, BOOKS_MIGRATION_V2, BOOKS_MIGRATION_V3],
  schemaVersion: 3,
  tablePrefix: 'bk_',
  navigation: {
    tabs: [
      { key: 'home', label: 'Home', icon: 'home' },
      { key: 'library', label: 'Library', icon: 'book' },
      { key: 'search', label: 'Search', icon: 'search' },
      { key: 'reader', label: 'Reader', icon: 'book-open' },
      { key: 'stats', label: 'Stats', icon: 'bar-chart' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'book-detail', title: 'Book Details' },
      { name: 'add-book', title: 'Add Book' },
      { name: 'edit-review', title: 'Edit Review' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
