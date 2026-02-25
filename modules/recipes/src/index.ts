// @mylife/recipes — MyRecipes module

export { RECIPES_MODULE } from './definition';

export type {
  Recipe,
  CreateRecipe,
  UpdateRecipe,
  Ingredient,
  CreateIngredient,
  RecipeTag,
  Difficulty,
  RecipeFilters,
} from './types';

export {
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
} from './db/crud';
