import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────
// Difficulty enum
// ─────────────────────────────────────────────────────────────────────────

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;

// ─────────────────────────────────────────────────────────────────────────
// Recipe
// ─────────────────────────────────────────────────────────────────────────

export const RecipeSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().nullable(),
  servings: z.number().int().positive().nullable(),
  prep_time_mins: z.number().int().nonnegative().nullable(),
  cook_time_mins: z.number().int().nonnegative().nullable(),
  total_time_mins: z.number().int().nonnegative().nullable(),
  difficulty: DifficultySchema.nullable(),
  source_url: z.string().nullable(),
  image_uri: z.string().nullable(),
  is_favorite: z.number().int().min(0).max(1),
  rating: z.number().int().min(0).max(5),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Recipe = z.infer<typeof RecipeSchema>;

export const CreateRecipeSchema = RecipeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  description: true,
  servings: true,
  prep_time_mins: true,
  cook_time_mins: true,
  total_time_mins: true,
  difficulty: true,
  source_url: true,
  image_uri: true,
  is_favorite: true,
  rating: true,
  notes: true,
});

export type CreateRecipe = z.infer<typeof CreateRecipeSchema>;

export const UpdateRecipeSchema = CreateRecipeSchema.partial();
export type UpdateRecipe = z.infer<typeof UpdateRecipeSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Ingredient
// ─────────────────────────────────────────────────────────────────────────

export const IngredientSchema = z.object({
  id: z.string(),
  recipe_id: z.string(),
  name: z.string().min(1),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  sort_order: z.number().int(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

export const CreateIngredientSchema = IngredientSchema.omit({ id: true }).partial({
  quantity: true,
  unit: true,
  sort_order: true,
});

export type CreateIngredient = z.infer<typeof CreateIngredientSchema>;

// ─────────────────────────────────────────────────────────────────────────
// RecipeTag (simple tag string per recipe — no separate tags table for MVP)
// ─────────────────────────────────────────────────────────────────────────

export const RecipeTagSchema = z.object({
  id: z.string(),
  recipe_id: z.string(),
  tag: z.string().min(1),
});

export type RecipeTag = z.infer<typeof RecipeTagSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Filter options
// ─────────────────────────────────────────────────────────────────────────

export interface RecipeFilters {
  search?: string;
  is_favorite?: boolean;
  difficulty?: Difficulty;
  tag?: string;
  limit?: number;
  offset?: number;
}
