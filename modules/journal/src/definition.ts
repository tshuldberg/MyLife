import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './db/schema';

const JOURNAL_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Create journal entries, tags, links, and settings',
  up: [...ALL_TABLES, ...CREATE_INDEXES, ...SEED_SETTINGS],
  down: [
    'DROP TABLE IF EXISTS jn_settings',
    'DROP TABLE IF EXISTS jn_entry_tags',
    'DROP TABLE IF EXISTS jn_tags',
    'DROP TABLE IF EXISTS jn_entries',
  ],
};

export const JOURNAL_MODULE: ModuleDefinition = {
  id: 'journal',
  name: 'MyJournal',
  tagline: 'Private daily journal',
  icon: '📓',
  accentColor: '#A78BFA',
  tier: 'free',
  storageType: 'sqlite',
  migrations: [JOURNAL_MIGRATION_V1],
  schemaVersion: 1,
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
