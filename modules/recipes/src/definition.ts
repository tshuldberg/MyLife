import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import {
  ALL_TABLES,
  CREATE_INDEXES,
  MYGARDEN_INDEXES,
  MYGARDEN_TABLES,
  SEED_SETTINGS,
} from './db/schema';

const RECIPES_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial recipe schema and settings',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_SETTINGS,
  ],
  down: [
    'DROP TABLE IF EXISTS rc_recipe_tags',
    'DROP TABLE IF EXISTS rc_steps',
    'DROP TABLE IF EXISTS rc_ingredients',
    'DROP TABLE IF EXISTS rc_settings',
    'DROP TABLE IF EXISTS rc_recipes',
  ],
};

const RECIPES_MIGRATION_V2: Migration = {
  version: 2,
  description: 'MyGarden expansion: meal planning, garden tracking, and events',
  up: [
    ...MYGARDEN_TABLES,
    ...MYGARDEN_INDEXES,
  ],
  down: [
    'DROP TABLE IF EXISTS ev_event_timeline',
    'DROP TABLE IF EXISTS ev_potluck_claims',
    'DROP TABLE IF EXISTS ev_menu_items',
    'DROP TABLE IF EXISTS ev_rsvps',
    'DROP TABLE IF EXISTS ev_guests',
    'DROP TABLE IF EXISTS ev_events',
    'DROP TABLE IF EXISTS gd_harvest_recipe_links',
    'DROP TABLE IF EXISTS gd_harvests',
    'DROP TABLE IF EXISTS gd_garden_journal',
    'DROP TABLE IF EXISTS gd_garden_layouts',
    'DROP TABLE IF EXISTS gd_plant_care_logs',
    'DROP TABLE IF EXISTS gd_plants',
    'DROP TABLE IF EXISTS rc_meal_plan_items',
    'DROP TABLE IF EXISTS rc_meal_plans',
  ],
};

export const RECIPES_MODULE: ModuleDefinition = {
  id: 'recipes',
  name: 'MyGarden',
  tagline: 'Grow it, cook it, host it',
  icon: '\u{1F331}',
  accentColor: '#22C55E',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [RECIPES_MIGRATION_V1, RECIPES_MIGRATION_V2],
  schemaVersion: 2,
  tablePrefix: 'rc_',
  navigation: {
    tabs: [
      { key: 'home', label: 'Home', icon: 'home' },
      { key: 'recipes', label: 'Recipes', icon: 'book-open' },
      { key: 'meal-plan', label: 'Meal Planner', icon: 'calendar' },
      { key: 'garden', label: 'Garden', icon: 'leaf' },
      { key: 'events', label: 'Events', icon: 'users' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'recipe-detail', title: 'Recipe' },
      { name: 'add-recipe', title: 'Add Recipe' },
      { name: 'cooking-mode', title: 'Cooking Mode' },
      { name: 'garden-journal', title: 'Garden Journal' },
      { name: 'event-detail', title: 'Event' },
      { name: 'import-url', title: 'Import from URL' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
