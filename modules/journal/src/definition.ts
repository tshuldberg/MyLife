import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { BASE_INDEXES, BASE_TABLES, SEED_SETTINGS, V2_UP } from './db/schema';

const JOURNAL_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Create journal entries, tags, links, and settings',
  up: [...BASE_TABLES, ...BASE_INDEXES, ...SEED_SETTINGS],
  down: [
    'DROP TABLE IF EXISTS jn_settings',
    'DROP TABLE IF EXISTS jn_entry_tags',
    'DROP TABLE IF EXISTS jn_tags',
    'DROP TABLE IF EXISTS jn_entries',
  ],
};

const JOURNAL_MIGRATION_V2: Migration = {
  version: 2,
  description: 'Add multiple journals and notebook-aware entry indexing',
  up: V2_UP,
  down: ['DROP TABLE IF EXISTS jn_journals'],
};

export const JOURNAL_MODULE: ModuleDefinition = {
  id: 'journal',
  name: 'MyJournal',
  tagline: 'Private daily journal',
  icon: '📓',
  accentColor: '#A78BFA',
  tier: 'free',
  storageType: 'sqlite',
  migrations: [JOURNAL_MIGRATION_V1, JOURNAL_MIGRATION_V2],
  schemaVersion: 2,
  tablePrefix: 'jn_',
  navigation: {
    tabs: [
      { key: 'today', label: 'Today', icon: 'edit-3' },
      { key: 'entries', label: 'Entries', icon: 'book-open' },
      { key: 'search', label: 'Search', icon: 'search' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'entry-detail', title: 'Entry' },
      { name: 'new-entry', title: 'New Entry' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
