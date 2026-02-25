import type { ModuleDefinition } from '@mylife/module-registry';

export const WORDS_MODULE: ModuleDefinition = {
  id: 'words',
  name: 'MyWords',
  tagline: 'Dictionary + thesaurus in 270 languages',
  icon: '\u{1F4D6}',
  accentColor: '#0EA5E9',
  tier: 'premium',
  storageType: 'sqlite',
  tablePrefix: 'wd_',
  navigation: {
    tabs: [
      { key: 'lookup', label: 'Lookup', icon: 'search' },
      { key: 'helper', label: 'Word Helper', icon: 'sparkles' },
      { key: 'languages', label: 'Languages', icon: 'globe' },
      { key: 'saved', label: 'Saved', icon: 'bookmark' },
      { key: 'settings', label: 'Settings', icon: 'settings' }
    ],
    screens: [
      { name: 'word-detail', title: 'Word' },
      { name: 'saved-word-detail', title: 'Saved Word' }
    ]
  },
  requiresAuth: false,
  requiresNetwork: true,
  version: '0.1.0'
};
