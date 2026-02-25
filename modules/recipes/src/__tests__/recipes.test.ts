import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import type { DatabaseAdapter } from '@mylife/db';
import { initializeHubDatabase, runModuleMigrations } from '@mylife/db';
import { RECIPES_MODULE } from '../definition';
import {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  countRecipes,
  addIngredient,
  getIngredients,
  updateIngredient,
  deleteIngredient,
  addTag,
  getTags,
  deleteTag,
  getSetting,
  setSetting,
} from '../db/crud';

function createTestAdapter(): DatabaseAdapter {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return {
    execute(sql: string, params?: unknown[]): void {
      db.prepare(sql).run(...(params ?? []));
    },
    query<T>(sql: string, params?: unknown[]): T[] {
      return db.prepare(sql).all(...(params ?? [])) as T[];
    },
    transaction(fn: () => void): void {
      db.transaction(fn)();
    },
  };
}

describe('@mylife/recipes', () => {
  let adapter: DatabaseAdapter;

  beforeEach(() => {
    adapter = createTestAdapter();
    initializeHubDatabase(adapter);
    runModuleMigrations(adapter, 'recipes', RECIPES_MODULE.migrations!);
  });

  describe('RECIPES_MODULE definition', () => {
    it('has correct metadata', () => {
      expect(RECIPES_MODULE.id).toBe('recipes');
      expect(RECIPES_MODULE.tier).toBe('premium');
      expect(RECIPES_MODULE.storageType).toBe('sqlite');
      expect(RECIPES_MODULE.tablePrefix).toBe('rc_');
    });

    it('has 5 navigation tabs', () => {
      expect(RECIPES_MODULE.navigation.tabs).toHaveLength(5);
    });
  });

  describe('recipes CRUD', () => {
    it('starts empty', () => {
      expect(countRecipes(adapter)).toBe(0);
    });

    it('creates and retrieves a recipe', () => {
      const r = createRecipe(adapter, 'r1', { title: 'Pasta Carbonara' });
      expect(r.title).toBe('Pasta Carbonara');
      expect(r.is_favorite).toBe(0);
      const found = getRecipeById(adapter, 'r1');
      expect(found).not.toBeNull();
      expect(found!.title).toBe('Pasta Carbonara');
    });

    it('creates recipe with full details', () => {
      const r = createRecipe(adapter, 'r1', {
        title: 'Steak', servings: 2, prep_time_mins: 10,
        cook_time_mins: 15, total_time_mins: 25, difficulty: 'medium',
        rating: 4, is_favorite: 1,
      });
      expect(r.servings).toBe(2);
      expect(r.difficulty).toBe('medium');
      expect(r.rating).toBe(4);
    });

    it('lists recipes newest first', () => {
      createRecipe(adapter, 'r1', { title: 'First' });
      createRecipe(adapter, 'r2', { title: 'Second' });
      const recipes = getRecipes(adapter);
      expect(recipes).toHaveLength(2);
      expect(recipes[0].id).toBe('r2');
    });

    it('filters by difficulty', () => {
      createRecipe(adapter, 'r1', { title: 'Easy', difficulty: 'easy' });
      createRecipe(adapter, 'r2', { title: 'Hard', difficulty: 'hard' });
      const results = getRecipes(adapter, { difficulty: 'easy' });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Easy');
    });

    it('filters by search', () => {
      createRecipe(adapter, 'r1', { title: 'Pasta Carbonara' });
      createRecipe(adapter, 'r2', { title: 'Steak Frites' });
      const results = getRecipes(adapter, { search: 'Pasta' });
      expect(results).toHaveLength(1);
    });

    it('updates a recipe', () => {
      createRecipe(adapter, 'r1', { title: 'Old' });
      updateRecipe(adapter, 'r1', { title: 'New' });
      expect(getRecipeById(adapter, 'r1')!.title).toBe('New');
    });

    it('deletes a recipe', () => {
      createRecipe(adapter, 'r1', { title: 'Test' });
      deleteRecipe(adapter, 'r1');
      expect(countRecipes(adapter)).toBe(0);
    });
  });

  describe('ingredients', () => {
    it('adds and retrieves ingredients', () => {
      createRecipe(adapter, 'r1', { title: 'Pasta' });
      addIngredient(adapter, 'i1', { recipe_id: 'r1', name: 'Spaghetti', quantity: '200', unit: 'g' });
      addIngredient(adapter, 'i2', { recipe_id: 'r1', name: 'Eggs', quantity: '3' });
      const ingredients = getIngredients(adapter, 'r1');
      expect(ingredients).toHaveLength(2);
      expect(ingredients[0].name).toBe('Spaghetti');
    });

    it('updates an ingredient', () => {
      createRecipe(adapter, 'r1', { title: 'Pasta' });
      addIngredient(adapter, 'i1', { recipe_id: 'r1', name: 'Old' });
      updateIngredient(adapter, 'i1', { name: 'New' });
      const ingredients = getIngredients(adapter, 'r1');
      expect(ingredients[0].name).toBe('New');
    });

    it('deletes an ingredient', () => {
      createRecipe(adapter, 'r1', { title: 'Pasta' });
      addIngredient(adapter, 'i1', { recipe_id: 'r1', name: 'Salt' });
      deleteIngredient(adapter, 'i1');
      expect(getIngredients(adapter, 'r1')).toHaveLength(0);
    });
  });

  describe('tags', () => {
    it('adds and retrieves tags', () => {
      createRecipe(adapter, 'r1', { title: 'Pasta' });
      addTag(adapter, 't1', 'r1', 'italian');
      addTag(adapter, 't2', 'r1', 'quick');
      expect(getTags(adapter, 'r1')).toHaveLength(2);
    });

    it('filters recipes by tag', () => {
      createRecipe(adapter, 'r1', { title: 'Pasta' });
      createRecipe(adapter, 'r2', { title: 'Sushi' });
      addTag(adapter, 't1', 'r1', 'italian');
      addTag(adapter, 't2', 'r2', 'japanese');
      const results = getRecipes(adapter, { tag: 'italian' });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Pasta');
    });

    it('deletes a tag', () => {
      createRecipe(adapter, 'r1', { title: 'Pasta' });
      addTag(adapter, 't1', 'r1', 'test');
      deleteTag(adapter, 't1');
      expect(getTags(adapter, 'r1')).toHaveLength(0);
    });
  });

  describe('settings', () => {
    it('sets and gets a setting', () => {
      setSetting(adapter, 'measurement', 'metric');
      expect(getSetting(adapter, 'measurement')).toBe('metric');
    });
  });
});
