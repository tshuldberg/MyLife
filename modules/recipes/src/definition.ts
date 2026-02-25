import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './db/schema';

const RECIPES_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial recipes schema — recipes, ingredients, recipe_tags, settings + indexes + seeds',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_SETTINGS,
  ],
  down: [
    'DROP TABLE IF EXISTS rc_recipe_tags',
    'DROP TABLE IF EXISTS rc_ingredients',
    'DROP TABLE IF EXISTS rc_settings',
    'DROP TABLE IF EXISTS rc_recipes',
  ],
};

export const RECIPES_MODULE: ModuleDefinition = {
  id: 'recipes',
  name: 'MyRecipes',
  tagline: 'Your personal cookbook',
  icon: '\u{1F468}\u{200D}\u{1F373}',
  accentColor: '#F97316',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [RECIPES_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'rc_',
  navigation: {
    tabs: [
      { key: 'home', label: 'Home', icon: 'home' },
      { key: 'recipes', label: 'Recipes', icon: 'book-open' },
      { key: 'grocery', label: 'Grocery', icon: 'shopping-cart' },
      { key: 'meal-plan', label: 'Meal Plan', icon: 'calendar' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'recipe-detail', title: 'Recipe' },
      { name: 'add-recipe', title: 'Add Recipe' },
      { name: 'import-url', title: 'Import from URL' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
