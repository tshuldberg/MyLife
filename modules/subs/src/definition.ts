import type { ModuleDefinition } from '@mylife/module-registry';

export const SUBS_MODULE: ModuleDefinition = {
  id: 'subs',
  name: 'MySubs',
  tagline: 'Subscription cost tracker',
  icon: '💳',
  accentColor: '#10B981',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [],
  schemaVersion: 0,
  tablePrefix: 'sb_',
  navigation: {
    tabs: [
      { key: 'dashboard', label: 'Dashboard', icon: 'credit-card' },
      { key: 'subscriptions', label: 'Subs', icon: 'list' },
      { key: 'calendar', label: 'Calendar', icon: 'calendar' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'sub-detail', title: 'Subscription' },
      { name: 'add-sub', title: 'Add Subscription' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
