import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

const PETS_MIGRATION_V1: Migration = {
  version: 1,
  description:
    'Create pet profiles, care history, medication reminders, feeding schedules, and expenses',
  up: [...ALL_TABLES, ...CREATE_INDEXES],
  down: [
    'DROP TABLE IF EXISTS pt_expenses',
    'DROP TABLE IF EXISTS pt_feeding_schedules',
    'DROP TABLE IF EXISTS pt_weight_entries',
    'DROP TABLE IF EXISTS pt_medication_logs',
    'DROP TABLE IF EXISTS pt_medications',
    'DROP TABLE IF EXISTS pt_vaccinations',
    'DROP TABLE IF EXISTS pt_vet_visits',
    'DROP TABLE IF EXISTS pt_pets',
  ],
};

export const PETS_MODULE: ModuleDefinition = {
  id: 'pets',
  name: 'MyPets',
  tagline: 'Pet health records and care tracker',
  icon: '🐾',
  accentColor: '#F59E0B',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [PETS_MIGRATION_V1],
  schemaVersion: 1,
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
