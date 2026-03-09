import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { NUTRITION_MODULE } from '../definition';
import {
  createFood,
  getFoodById,
  getFoodByBarcode,
  searchFoods,
  updateFood,
  deleteFood,
  createFoodFromAIEstimate,
} from '../db/foods';
import { getSetting, setSetting, deleteSetting, getAllSettings } from '../db/settings';
import { getCachedBarcode, setCachedBarcode, deleteCachedBarcode, purgeExpiredCache } from '../db/barcode-cache';

describe('foods CRUD', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('nutrition', NUTRITION_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
  });

  it('creates and retrieves a food', () => {
    createFood(adapter, 'f1', {
      name: 'Test Food',
      servingSize: 100,
      servingUnit: 'g',
      calories: 200,
      proteinG: 10,
      carbsG: 20,
      fatG: 8,
    });
    const food = getFoodById(adapter, 'f1');
    expect(food).not.toBeNull();
    expect(food!.name).toBe('Test Food');
    expect(food!.calories).toBe(200);
    expect(food!.proteinG).toBe(10);
    expect(food!.source).toBe('custom');
  });

  it('looks up food by barcode', () => {
    createFood(adapter, 'f1', {
      name: 'Barcode Food',
      servingSize: 100,
      servingUnit: 'g',
      calories: 150,
      barcode: '1234567890123',
    });
    const food = getFoodByBarcode(adapter, '1234567890123');
    expect(food).not.toBeNull();
    expect(food!.name).toBe('Barcode Food');
  });

  it('returns null for nonexistent barcode', () => {
    expect(getFoodByBarcode(adapter, '9999999')).toBeNull();
  });

  it('searches foods by name (LIKE)', () => {
    createFood(adapter, 'f1', { name: 'Xyloberry Jam', servingSize: 100, servingUnit: 'g', calories: 192 });
    createFood(adapter, 'f2', { name: 'Xyloberry Sauce', servingSize: 100, servingUnit: 'g', calories: 192 });
    createFood(adapter, 'f3', { name: 'Broccoli', servingSize: 100, servingUnit: 'g', calories: 34 });
    const results = searchFoods(adapter, 'xyloberry');
    expect(results).toHaveLength(2);
  });

  it('updates a food', () => {
    createFood(adapter, 'f1', { name: 'Old', servingSize: 100, servingUnit: 'g', calories: 100 });
    updateFood(adapter, 'f1', { name: 'New', calories: 200 });
    const food = getFoodById(adapter, 'f1');
    expect(food!.name).toBe('New');
    expect(food!.calories).toBe(200);
  });

  it('deletes a food', () => {
    createFood(adapter, 'f1', { name: 'Gone', servingSize: 100, servingUnit: 'g', calories: 100 });
    deleteFood(adapter, 'f1');
    expect(getFoodById(adapter, 'f1')).toBeNull();
  });

  it('creates food from AI estimate', () => {
    const food = createFoodFromAIEstimate(adapter, {
      name: 'AI Grilled Chicken',
      servingSize: '150',
      servingUnit: 'g',
      calories: 250,
      proteinG: 46,
      carbsG: 0,
      fatG: 5.5,
    });
    expect(food.name).toBe('AI Grilled Chicken');
    expect(food.source).toBe('ai_photo');
    expect(food.calories).toBe(250);
  });
});

describe('settings', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('nutrition', NUTRITION_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
  });

  it('reads seeded setting', () => {
    expect(getSetting(adapter, 'calorieGoal')).toBe('2000');
  });

  it('sets and retrieves a setting', () => {
    setSetting(adapter, 'theme', 'dark');
    expect(getSetting(adapter, 'theme')).toBe('dark');
  });

  it('upserts existing setting', () => {
    setSetting(adapter, 'calorieGoal', '2500');
    expect(getSetting(adapter, 'calorieGoal')).toBe('2500');
  });

  it('deletes a setting', () => {
    setSetting(adapter, 'temp', 'val');
    deleteSetting(adapter, 'temp');
    expect(getSetting(adapter, 'temp')).toBeUndefined();
  });

  it('gets all settings', () => {
    const all = getAllSettings(adapter);
    expect(all.defaultMealType).toBe('lunch');
    expect(all.calorieGoal).toBe('2000');
  });
});

describe('barcode cache', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('nutrition', NUTRITION_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
  });

  it('caches and retrieves barcode', () => {
    setCachedBarcode(adapter, '123456', { source: 'open_food_facts', rawJson: '{}' });
    const cached = getCachedBarcode(adapter, '123456');
    expect(cached).not.toBeNull();
    expect(cached!.source).toBe('open_food_facts');
  });

  it('returns null for expired cache entry', () => {
    setCachedBarcode(adapter, '999', {
      source: 'test',
      expiresAt: '2020-01-01T00:00:00.000Z',
    });
    expect(getCachedBarcode(adapter, '999')).toBeNull();
  });

  it('deletes cached barcode', () => {
    setCachedBarcode(adapter, '111', { source: 'test' });
    deleteCachedBarcode(adapter, '111');
    expect(getCachedBarcode(adapter, '111')).toBeNull();
  });
});
