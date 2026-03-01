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

export const StepSchema = z.object({
  id: z.string(),
  recipe_id: z.string(),
  step_number: z.number().int().positive(),
  instruction: z.string().min(1),
  timer_minutes: z.number().int().positive().nullable(),
  sort_order: z.number().int(),
});
export type Step = z.infer<typeof StepSchema>;

export const MealSlotSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export type MealSlot = z.infer<typeof MealSlotSchema>;

export const MealPlanSchema = z.object({
  id: z.string(),
  week_start_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type MealPlan = z.infer<typeof MealPlanSchema>;

export const MealPlanItemSchema = z.object({
  id: z.string(),
  meal_plan_id: z.string(),
  recipe_id: z.string(),
  day_of_week: z.number().int().min(0).max(6),
  meal_slot: MealSlotSchema,
  servings: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type MealPlanItem = z.infer<typeof MealPlanItemSchema>;

export const PlantLocationSchema = z.enum(['indoor', 'outdoor', 'raised_bed', 'container']);
export type PlantLocation = z.infer<typeof PlantLocationSchema>;

export const GardenPlantSchema = z.object({
  id: z.string(),
  species: z.string(),
  location: PlantLocationSchema,
  planting_date: z.string(),
  watering_interval_days: z.number().int().positive(),
  last_watered_at: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type GardenPlant = z.infer<typeof GardenPlantSchema>;

export const EventResponseSchema = z.enum(['attending', 'maybe', 'declined']);
export type EventResponse = z.infer<typeof EventResponseSchema>;

export const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  event_date: z.string(),
  event_time: z.string(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  capacity: z.number().int().nullable(),
  invite_token: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Event = z.infer<typeof EventSchema>;
