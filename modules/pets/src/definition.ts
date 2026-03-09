import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import {
  BASE_INDEXES,
  BASE_TABLES,
  EXPANDED_CARE_INDEXES,
  EXPANDED_CARE_TABLES,
} from './db/schema';

const PETS_MIGRATION_V1: Migration = {
  version: 1,
  description:
    'Create pet profiles, care history, medication reminders, feeding schedules, and expenses',
  up: [...BASE_TABLES, ...BASE_INDEXES],
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

const PETS_MIGRATION_V2: Migration = {
  version: 2,
  description:
    'Add emergency contacts, activity logs, grooming tracking, training logs, and local pet photos',
  up: [
    ...EXPANDED_CARE_TABLES,
    ...EXPANDED_CARE_INDEXES,
  ],
  down: [
    'DROP TABLE IF EXISTS pt_pet_photos',
    'DROP TABLE IF EXISTS pt_training_logs',
    'DROP TABLE IF EXISTS pt_grooming_records',
    'DROP TABLE IF EXISTS pt_exercise_logs',
    'DROP TABLE IF EXISTS pt_emergency_contacts',
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
  migrations: [PETS_MIGRATION_V1, PETS_MIGRATION_V2],
  schemaVersion: 2,
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
