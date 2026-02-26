'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  countRecipes,
  addIngredient,
  getIngredients,
  deleteIngredient,
  addTag,
  getTags,
  deleteTag,
} from '@mylife/recipes';
import type {
  CreateRecipe,
  UpdateRecipe,
  CreateIngredient,
  RecipeFilters,
} from '@mylife/recipes';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('recipes');
  return adapter;
}

// ── Recipes ──────────────────────────────────────────────────────────

export async function fetchRecipes(filters?: RecipeFilters) {
  return getRecipes(db(), filters);
}

export async function fetchRecipeById(id: string) {
  return getRecipeById(db(), id);
}

export async function doCreateRecipe(id: string, input: CreateRecipe) {
  return createRecipe(db(), id, input);
}

export async function doUpdateRecipe(id: string, updates: UpdateRecipe) {
  return updateRecipe(db(), id, updates);
}

export async function doDeleteRecipe(id: string) {
  return deleteRecipe(db(), id);
}

export async function fetchRecipeCount(filters?: RecipeFilters) {
  return countRecipes(db(), filters);
}

// ── Ingredients ──────────────────────────────────────────────────────

export async function fetchIngredients(recipeId: string) {
  return getIngredients(db(), recipeId);
}

export async function doAddIngredient(id: string, input: CreateIngredient) {
  return addIngredient(db(), id, input);
}

export async function doDeleteIngredient(id: string) {
  return deleteIngredient(db(), id);
}

// ── Tags ─────────────────────────────────────────────────────────────

export async function fetchTags(recipeId: string) {
  return getTags(db(), recipeId);
}

export async function doAddTag(id: string, recipeId: string, tag: string) {
  return addTag(db(), id, recipeId, tag);
}

export async function doDeleteTag(id: string) {
  return deleteTag(db(), id);
}
