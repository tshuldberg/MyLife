import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { RECIPES_MODULE } from '../definition';
import { createRecipe, addIngredient } from '../db/crud';
import {
  createShoppingList,
  getShoppingLists,
  getShoppingListById,
  updateShoppingList,
  deleteShoppingList,
  completeShoppingList,
  addShoppingListItem,
  getShoppingListItems,
  updateShoppingListItem,
  deleteShoppingListItem,
  toggleItemChecked,
  uncheckAllItems,
  addRecipeToShoppingList,
  removeRecipeFromShoppingList,
  addCustomItem,
  addCheckedItemsToPantry,
  getShoppingListSummary,
  getRecipesInShoppingList,
} from '../db/shopping-lists';

describe('shopping lists', () => {
  let db: DatabaseAdapter;
  let closeDb: () => void;
  let idCounter = 0;

  function nextId(): string {
    return `test-id-${++idCounter}`;
  }

  beforeEach(() => {
    const testDb = createModuleTestDatabase('recipes', RECIPES_MODULE.migrations!);
    db = testDb.adapter;
    closeDb = testDb.close;
    idCounter = 0;
  });

  afterEach(() => {
    closeDb();
  });

  describe('list CRUD', () => {
    it('creates and retrieves a shopping list', () => {
      createShoppingList(db, 'list-1', 'Groceries');
      const list = getShoppingListById(db, 'list-1');
      expect(list).not.toBeNull();
      expect(list!.name).toBe('Groceries');
      expect(list!.is_active).toBe(1);
    });

    it('returns null for non-existent list', () => {
      expect(getShoppingListById(db, 'nope')).toBeNull();
    });

    it('gets active-only lists by default', () => {
      createShoppingList(db, 'list-1', 'Active');
      createShoppingList(db, 'list-2', 'Will Complete');
      completeShoppingList(db, 'list-2');

      const active = getShoppingLists(db);
      expect(active).toHaveLength(1);
      expect(active[0].name).toBe('Active');

      const all = getShoppingLists(db, false);
      expect(all).toHaveLength(2);
    });

    it('updates list name', () => {
      createShoppingList(db, 'list-1', 'Old Name');
      updateShoppingList(db, 'list-1', { name: 'New Name' });
      expect(getShoppingListById(db, 'list-1')!.name).toBe('New Name');
    });

    it('deletes a list', () => {
      createShoppingList(db, 'list-1', 'To Delete');
      deleteShoppingList(db, 'list-1');
      expect(getShoppingListById(db, 'list-1')).toBeNull();
    });

    it('completes a list (sets is_active = 0)', () => {
      createShoppingList(db, 'list-1', 'Trip');
      completeShoppingList(db, 'list-1');
      expect(getShoppingListById(db, 'list-1')!.is_active).toBe(0);
    });
  });

  describe('item CRUD', () => {
    beforeEach(() => {
      createShoppingList(db, 'list-1', 'Test List');
    });

    it('adds and retrieves items', () => {
      addShoppingListItem(db, 'item-1', 'list-1', {
        item: 'Milk',
        quantity: 1,
        unit: 'gallon',
        grocery_section: 'dairy',
      });
      addShoppingListItem(db, 'item-2', 'list-1', {
        item: 'Bread',
        grocery_section: 'bakery',
      });

      const items = getShoppingListItems(db, 'list-1');
      expect(items).toHaveLength(2);
    });

    it('updates an item', () => {
      addShoppingListItem(db, 'item-1', 'list-1', {
        item: 'Eggs',
        quantity: 12,
        grocery_section: 'dairy',
      });
      updateShoppingListItem(db, 'item-1', { quantity: 24 });

      const items = getShoppingListItems(db, 'list-1');
      expect(items[0].quantity).toBe(24);
    });

    it('deletes an item', () => {
      addShoppingListItem(db, 'item-1', 'list-1', { item: 'Butter', grocery_section: 'dairy' });
      deleteShoppingListItem(db, 'item-1');
      expect(getShoppingListItems(db, 'list-1')).toHaveLength(0);
    });

    it('toggles item checked state', () => {
      addShoppingListItem(db, 'item-1', 'list-1', { item: 'Flour', grocery_section: 'pantry' });

      const checked = toggleItemChecked(db, 'item-1');
      expect(checked).toBe(true);

      const unchecked = toggleItemChecked(db, 'item-1');
      expect(unchecked).toBe(false);
    });

    it('unchecks all items in a list', () => {
      addShoppingListItem(db, 'item-1', 'list-1', { item: 'A', grocery_section: 'other' });
      addShoppingListItem(db, 'item-2', 'list-1', { item: 'B', grocery_section: 'other' });
      toggleItemChecked(db, 'item-1');
      toggleItemChecked(db, 'item-2');

      uncheckAllItems(db, 'list-1');

      const items = getShoppingListItems(db, 'list-1');
      expect(items.every((i) => !i.is_checked)).toBe(true);
    });
  });

  describe('recipe integration', () => {
    beforeEach(() => {
      createShoppingList(db, 'list-1', 'Meal Prep');

      // Create a recipe with ingredients
      createRecipe(db, 'recipe-1', { title: 'Pasta', servings: 4 });
      addIngredient(db, 'ing-1', {
        recipe_id: 'recipe-1',
        name: 'spaghetti',
        item: 'spaghetti',
        quantity: '400',
        quantity_value: 400,
        unit: 'g',
        sort_order: 0,
      });
      addIngredient(db, 'ing-2', {
        recipe_id: 'recipe-1',
        name: 'olive oil',
        item: 'olive oil',
        quantity: '2',
        quantity_value: 2,
        unit: 'tbsp',
        sort_order: 1,
      });
    });

    it('adds recipe ingredients to shopping list', () => {
      addRecipeToShoppingList(db, 'list-1', 'recipe-1', 1, nextId);

      const items = getShoppingListItems(db, 'list-1');
      expect(items).toHaveLength(2);
      expect(items.some((i) => i.item === 'spaghetti')).toBe(true);
      expect(items.some((i) => i.item === 'olive oil')).toBe(true);
    });

    it('scales ingredient quantities by multiplier', () => {
      addRecipeToShoppingList(db, 'list-1', 'recipe-1', 2, nextId);

      const items = getShoppingListItems(db, 'list-1');
      const spaghetti = items.find((i) => i.item === 'spaghetti');
      expect(spaghetti!.quantity).toBe(800);
    });

    it('removes recipe items from shopping list', () => {
      addRecipeToShoppingList(db, 'list-1', 'recipe-1', 1, nextId);
      expect(getShoppingListItems(db, 'list-1')).toHaveLength(2);

      removeRecipeFromShoppingList(db, 'list-1', 'recipe-1');
      expect(getShoppingListItems(db, 'list-1')).toHaveLength(0);
    });

    it('tracks which recipes are in the list', () => {
      addRecipeToShoppingList(db, 'list-1', 'recipe-1', 2, nextId);

      const recipes = getRecipesInShoppingList(db, 'list-1');
      expect(recipes).toHaveLength(1);
      expect(recipes[0].recipe_title).toBe('Pasta');
      expect(recipes[0].multiplier).toBe(2);
    });
  });

  describe('custom items', () => {
    beforeEach(() => {
      createShoppingList(db, 'list-1', 'Quick Run');
    });

    it('adds a custom item with NLP parsing', () => {
      addCustomItem(db, 'c1', 'list-1', '2 cups flour');

      const items = getShoppingListItems(db, 'list-1');
      expect(items).toHaveLength(1);
      expect(items[0].is_custom).toBe(1);
      expect(items[0].item).toBe('flour');
      expect(items[0].quantity).toBe(2);
      expect(items[0].unit).toBe('cup');
    });

    it('adds a simple item without quantity', () => {
      addCustomItem(db, 'c1', 'list-1', 'bananas');

      const items = getShoppingListItems(db, 'list-1');
      expect(items).toHaveLength(1);
      expect(items[0].item).toBe('bananas');
    });
  });

  describe('pantry sync', () => {
    beforeEach(() => {
      createShoppingList(db, 'list-1', 'Trip');
      addShoppingListItem(db, 'item-1', 'list-1', {
        item: 'Milk',
        quantity: 1,
        unit: 'gallon',
        grocery_section: 'dairy',
      });
      addShoppingListItem(db, 'item-2', 'list-1', {
        item: 'Bread',
        grocery_section: 'bakery',
      });
      // Check both items
      toggleItemChecked(db, 'item-1');
      toggleItemChecked(db, 'item-2');
    });

    it('adds checked items to pantry', () => {
      const count = addCheckedItemsToPantry(db, 'list-1', nextId);
      expect(count).toBe(2);

      // Verify pantry items exist
      const pantryItems = db.query<{ name: string }>(
        `SELECT name FROM rc_pantry_items ORDER BY name`,
      );
      expect(pantryItems).toHaveLength(2);
      expect(pantryItems[0].name).toBe('Bread');
      expect(pantryItems[1].name).toBe('Milk');
    });

    it('skips duplicate pantry items', () => {
      addCheckedItemsToPantry(db, 'list-1', nextId);
      const count2 = addCheckedItemsToPantry(db, 'list-1', nextId);
      expect(count2).toBe(0);
    });
  });

  describe('summary', () => {
    it('returns summary with counts', () => {
      createShoppingList(db, 'list-1', 'Weekly');
      addShoppingListItem(db, 'i1', 'list-1', { item: 'A', grocery_section: 'other', is_custom: 1 });
      addShoppingListItem(db, 'i2', 'list-1', { item: 'B', grocery_section: 'other' });
      addShoppingListItem(db, 'i3', 'list-1', { item: 'C', grocery_section: 'other' });
      toggleItemChecked(db, 'i1');

      const summary = getShoppingListSummary(db, 'list-1');
      expect(summary).not.toBeNull();
      expect(summary!.totalItems).toBe(3);
      expect(summary!.checkedItems).toBe(1);
      expect(summary!.customItemCount).toBe(1);
    });

    it('returns null for non-existent list', () => {
      expect(getShoppingListSummary(db, 'nope')).toBeNull();
    });
  });
});
