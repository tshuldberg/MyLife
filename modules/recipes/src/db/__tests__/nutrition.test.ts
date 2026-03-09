import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { RECIPES_MODULE } from '../../definition';
import {
  createNutritionData,
  getNutritionForItem,
  getNutritionByBarcode,
  updateNutritionData,
  deleteNutritionData,
} from '../nutrition';
import { createPantryItem } from '../pantry';

describe('nutrition', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('recipes', RECIPES_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
  });

  describe('createNutritionData', () => {
    it('creates nutrition data with all fields', () => {
      const item = createPantryItem(adapter, { name: 'Milk', storage_location: 'fridge' });

      const nutrition = createNutritionData(adapter, 'nut-1', {
        pantry_item_id: item.id,
        barcode: '049000042566',
        product_name: 'Whole Milk',
        brand: 'Organic Valley',
        serving_size_text: '1 cup (240ml)',
        calories: 150,
        fat_g: 8,
        saturated_fat_g: 5,
        carbs_g: 12,
        fiber_g: 0,
        sugar_g: 12,
        protein_g: 8,
        sodium_mg: 120,
        source: 'manual',
      });

      expect(nutrition.id).toBe('nut-1');
      expect(nutrition.pantry_item_id).toBe(item.id);
      expect(nutrition.barcode).toBe('049000042566');
      expect(nutrition.product_name).toBe('Whole Milk');
      expect(nutrition.brand).toBe('Organic Valley');
      expect(nutrition.serving_size_text).toBe('1 cup (240ml)');
      expect(nutrition.calories).toBe(150);
      expect(nutrition.fat_g).toBe(8);
      expect(nutrition.saturated_fat_g).toBe(5);
      expect(nutrition.carbs_g).toBe(12);
      expect(nutrition.fiber_g).toBe(0);
      expect(nutrition.sugar_g).toBe(12);
      expect(nutrition.protein_g).toBe(8);
      expect(nutrition.sodium_mg).toBe(120);
      expect(nutrition.source).toBe('manual');
      expect(nutrition.fetched_at).toBeDefined();
    });

    it('defaults optional fields to null', () => {
      const nutrition = createNutritionData(adapter, 'nut-1', { source: 'manual' });

      expect(nutrition.pantry_item_id).toBeNull();
      expect(nutrition.barcode).toBeNull();
      expect(nutrition.product_name).toBeNull();
      expect(nutrition.brand).toBeNull();
      expect(nutrition.calories).toBeNull();
      expect(nutrition.protein_g).toBeNull();
    });
  });

  describe('getNutritionForItem', () => {
    it('returns nutrition for a pantry item', () => {
      const item = createPantryItem(adapter, { name: 'Eggs', storage_location: 'fridge' });
      createNutritionData(adapter, 'nut-1', {
        pantry_item_id: item.id,
        source: 'manual',
        calories: 70,
        protein_g: 6,
      });

      const result = getNutritionForItem(adapter, item.id);
      expect(result).not.toBeNull();
      expect(result!.calories).toBe(70);
      expect(result!.protein_g).toBe(6);
    });

    it('returns null when no nutrition data exists', () => {
      const item = createPantryItem(adapter, { name: 'Water', storage_location: 'fridge' });

      const result = getNutritionForItem(adapter, item.id);
      expect(result).toBeNull();
    });
  });

  describe('getNutritionByBarcode', () => {
    it('returns cached nutrition by barcode', () => {
      createNutritionData(adapter, 'nut-1', {
        barcode: '049000042566',
        product_name: 'Whole Milk',
        source: 'open_food_facts',
        calories: 150,
      });

      const result = getNutritionByBarcode(adapter, '049000042566');
      expect(result).not.toBeNull();
      expect(result!.product_name).toBe('Whole Milk');
      expect(result!.calories).toBe(150);
    });

    it('returns null when barcode not found', () => {
      const result = getNutritionByBarcode(adapter, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateNutritionData', () => {
    it('partial update of calories and protein', () => {
      const nutrition = createNutritionData(adapter, 'nut-1', {
        source: 'manual',
        calories: 100,
        protein_g: 5,
        fat_g: 3,
      });

      updateNutritionData(adapter, nutrition.id, {
        calories: 120,
        protein_g: 8,
      });

      const rows = adapter.query<{ calories: number; protein_g: number; fat_g: number }>(
        'SELECT calories, protein_g, fat_g FROM rc_nutrition_data WHERE id = ?',
        [nutrition.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].calories).toBe(120);
      expect(rows[0].protein_g).toBe(8);
      expect(rows[0].fat_g).toBe(3); // unchanged
    });
  });

  describe('deleteNutritionData', () => {
    it('removes the record', () => {
      const nutrition = createNutritionData(adapter, 'nut-1', {
        source: 'manual',
        calories: 200,
      });

      deleteNutritionData(adapter, nutrition.id);

      const rows = adapter.query(
        'SELECT * FROM rc_nutrition_data WHERE id = ?',
        [nutrition.id],
      );
      expect(rows).toHaveLength(0);
    });
  });
});
