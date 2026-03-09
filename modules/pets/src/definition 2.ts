import type { ModuleDefinition } from '@mylife/module-registry';

export const PETS_MODULE: ModuleDefinition = {
  id: 'pets',
  name: 'MyPets',
  tagline: 'Pet health records and care tracker',
  icon: '🐾',
  accentColor: '#F59E0B',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [],
  schemaVersion: 0,
  tablePrefix: 'pt_',
  navigation: {
    tabs: [
      { key: 'pets', label: 'Pets', icon: 'heart' },
      { key: 'health', label: 'Health', icon: 'activity' },
      { key: 'reminders', label: 'Reminders', icon: 'bell' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'pet-detail', title: 'Pet' },
      { name: 'add-pet', title: 'Add Pet' },
      { name: 'vet-visit', title: 'Vet Visit' },
      { name: 'vaccination', title: 'Vaccination' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
