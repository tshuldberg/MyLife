import type { ModuleDefinition } from '@mylife/module-registry';

export const JOURNAL_MODULE: ModuleDefinition = {
  id: 'journal',
  name: 'MyJournal',
  tagline: 'Private daily journal',
  icon: '📓',
  accentColor: '#A78BFA',
  tier: 'free',
  storageType: 'sqlite',
  migrations: [],
  schemaVersion: 0,
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
