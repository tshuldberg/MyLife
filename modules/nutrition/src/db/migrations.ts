import type { Migration } from '@mylife/module-registry';
import { CREATE_FTS_TRIGGERS, CREATE_PHOTO_LOG } from './schema';
import { getNutrientInserts } from '../data/usda-nutrients';
import { getUSDAFoodInserts, getUSDAFTSInserts } from '../data/usda-seed';

/**
 * Migration V2: Seed USDA nutrients + common foods, add FTS triggers.
 */
export const NUTRITION_MIGRATION_V2: Migration = {
  version: 2,
  description: 'Seed 84 nutrient definitions, ~100 USDA foods, add FTS sync triggers',
  up: [
    ...CREATE_FTS_TRIGGERS,
    ...getNutrientInserts(),
    ...getUSDAFoodInserts(),
    ...getUSDAFTSInserts(),
  ],
  down: [
    'DROP TRIGGER IF EXISTS nu_foods_ai',
    'DROP TRIGGER IF EXISTS nu_foods_ad',
    'DROP TRIGGER IF EXISTS nu_foods_au',
    'DELETE FROM nu_food_nutrients WHERE food_id LIKE \'usda-%\'',
    'DELETE FROM nu_foods WHERE source = \'usda\'',
    'DELETE FROM nu_nutrients',
  ],
};

/**
 * Migration V3: Add photo log table for AI food identification.
 */
export const NUTRITION_MIGRATION_V3: Migration = {
  version: 3,
  description: 'Add nu_photo_log table for AI-powered food identification from photos',
  up: [CREATE_PHOTO_LOG],
  down: ['DROP TABLE IF EXISTS nu_photo_log'],
};
