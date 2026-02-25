import type { ModuleDefinition } from '@mylife/module-registry';

export const HOMES_MODULE: ModuleDefinition = {
  id: 'homes',
  name: 'MyHomes',
  tagline: 'Real estate, reimagined',
  icon: '\u{1F3E0}',
  accentColor: '#D97706',
  tier: 'premium',
  storageType: 'drizzle',
  navigation: {
    tabs: [
      { key: 'search', label: 'Search', icon: 'search' },
      { key: 'map', label: 'Map', icon: 'map' },
      { key: 'saved', label: 'Saved', icon: 'heart' },
      { key: 'alerts', label: 'Alerts', icon: 'bell' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'listing-detail', title: 'Listing' },
      { name: 'agent-profile', title: 'Agent' },
      { name: 'mortgage-calc', title: 'Mortgage Calculator' },
    ],
  },
  requiresAuth: true,
  requiresNetwork: true,
  version: '0.1.0',
};
