import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { RECIPES_MODULE } from '../../definition';
import {
  bulkUpdateQuantities,
  createPantryItem,
  deletePantryItem,
  getExpiringItems,
  getPantryItemByBarcode,
  getPantryItemById,
  getPantryItems,
  getPantryItemsByName,
  updatePantryItem,
} from '../pantry';

describe('recipes pantry db', () => {
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

  it('creates and fetches pantry items', () => {
    const created = createPantryItem(adapter, {
      name: 'Whole Milk',
      quantity: 1,
      unit: 'gallon',
      storage_location: 'fridge',
      grocery_section: 'dairy',
      barcode: '123',
    });

    expect(getPantryItemById(adapter, created.id)?.name).toBe('Whole Milk');
    expect(getPantryItemByBarcode(adapter, '123')?.id).toBe(created.id);
  });

  it('filters and updates pantry items', () => {
    const created = createPantryItem(adapter, {
      name: 'Bread',
      storage_location: 'pantry',
      grocery_section: 'bakery',
    });

    updatePantryItem(adapter, created.id, {
      name: 'Sourdough Bread',
      quantity: 2,
      expiration_date: '2026-03-05',
    });

    expect(getPantryItems(adapter, { grocerySection: 'bakery' })).toHaveLength(1);
    expect(getPantryItemsByName(adapter, 'Sourdough')).toHaveLength(1);
  });

  it('returns expiring items and supports bulk quantity updates', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    const soonString = soon.toISOString().split('T')[0];

    const created = createPantryItem(adapter, {
      name: 'Spinach',
      quantity: 1,
      unit: 'bag',
      storage_location: 'fridge',
      expiration_date: soonString,
      grocery_section: 'produce',
    });

    bulkUpdateQuantities(adapter, [{ id: created.id, quantity: 3 }]);
    expect(getPantryItemById(adapter, created.id)?.quantity).toBe(3);
    expect(getExpiringItems(adapter, 3)).toHaveLength(1);
  });

  it('deletes pantry items', () => {
    const created = createPantryItem(adapter, {
      name: 'Butter',
      storage_location: 'fridge',
      grocery_section: 'dairy',
    });

    deletePantryItem(adapter, created.id);
    expect(getPantryItemById(adapter, created.id)).toBeNull();
  });
});
