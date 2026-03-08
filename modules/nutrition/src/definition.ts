import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './db/schema';
import { NUTRITION_MIGRATION_V2, NUTRITION_MIGRATION_V3 } from './db/migrations';

const NUTRITION_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial nutrition schema -- foods, nutrients, food log, goals, settings, barcode cache + FTS + indexes + seeds',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_SETTINGS,
  ],
  down: [
    'DROP TABLE IF EXISTS nu_foods_fts',
    'DROP TABLE IF EXISTS nu_barcode_cache',
    'DROP TABLE IF EXISTS nu_food_log_items',
    'DROP TABLE IF EXISTS nu_food_log',
    'DROP TABLE IF EXISTS nu_food_nutrients',
    'DROP TABLE IF EXISTS nu_daily_goals',
    'DROP TABLE IF EXISTS nu_nutrients',
    'DROP TABLE IF EXISTS nu_settings',
    'DROP TABLE IF EXISTS nu_foods',
  ],
};

export const NUTRITION_MODULE: ModuleDefinition = {
  id: 'nutrition',
  name: 'MyNutrition',
  tagline: 'Track what you eat, hit your macros',
  icon: '\u{1F96C}',
  accentColor: '#F97316',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [NUTRITION_MIGRATION_V1, NUTRITION_MIGRATION_V2, NUTRITION_MIGRATION_V3],
  schemaVersion: 3,
  tablePrefix: 'nu_',
  navigation: {
    tabs: [
      { key: 'diary', label: 'Diary', icon: 'book-open' },
      { key: 'search', label: 'Search', icon: 'search' },
      { key: 'dashboard', label: 'Dashboard', icon: 'pie-chart' },
      { key: 'trends', label: 'Trends', icon: 'trending-up' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'food-detail', title: 'Food Details' },
      { name: 'add-food', title: 'Add Food' },
      { name: 'scan', title: 'Scan Barcode' },
      { name: 'photo', title: 'Photo Log' },
      { name: 'meal-edit', title: 'Edit Meal' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
