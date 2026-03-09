import { z } from 'zod';

// -- Enums -------------------------------------------------------------------

export const MealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export type MealType = z.infer<typeof MealTypeSchema>;

export const FoodSourceSchema = z.enum([
  'usda',
  'open_food_facts',
  'fatsecret',
  'custom',
  'ai_photo',
]);
export type FoodSource = z.infer<typeof FoodSourceSchema>;

export const NutrientCategorySchema = z.enum([
  'vitamin',
  'mineral',
  'amino_acid',
  'fatty_acid',
  'other',
]);
export type NutrientCategory = z.infer<typeof NutrientCategorySchema>;

// -- Food --------------------------------------------------------------------

export const FoodSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  brand: z.string().nullable(),
  servingSize: z.number().positive(),
  servingUnit: z.string().min(1),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  fiberG: z.number().nonnegative(),
  sugarG: z.number().nonnegative(),
  sodiumMg: z.number().nonnegative(),
  source: FoodSourceSchema,
  barcode: z.string().nullable(),
  usdaNdbNumber: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Food = z.infer<typeof FoodSchema>;

export const CreateFoodInputSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string().min(1),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative().default(0),
  carbsG: z.number().nonnegative().default(0),
  fatG: z.number().nonnegative().default(0),
  fiberG: z.number().nonnegative().default(0),
  sugarG: z.number().nonnegative().default(0),
  sodiumMg: z.number().nonnegative().default(0),
  source: FoodSourceSchema.default('custom'),
  barcode: z.string().optional(),
  usdaNdbNumber: z.string().optional(),
});
export type CreateFoodInput = z.infer<typeof CreateFoodInputSchema>;

export const UpdateFoodInputSchema = CreateFoodInputSchema.partial();
export type UpdateFoodInput = z.infer<typeof UpdateFoodInputSchema>;

// -- Nutrient ----------------------------------------------------------------

export const NutrientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  unit: z.string().min(1),
  rdaValue: z.number().nonnegative().nullable(),
  rdaUnit: z.string().nullable(),
  category: NutrientCategorySchema,
  sortOrder: z.number().int().nonnegative(),
});
export type Nutrient = z.infer<typeof NutrientSchema>;

export const CreateNutrientInputSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  rdaValue: z.number().nonnegative().optional(),
  rdaUnit: z.string().optional(),
  category: NutrientCategorySchema,
  sortOrder: z.number().int().nonnegative().default(0),
});
export type CreateNutrientInput = z.infer<typeof CreateNutrientInputSchema>;

// -- Food Nutrient -----------------------------------------------------------

export const FoodNutrientSchema = z.object({
  id: z.string(),
  foodId: z.string(),
  nutrientId: z.string(),
  amount: z.number().nonnegative(),
});
export type FoodNutrient = z.infer<typeof FoodNutrientSchema>;

export const CreateFoodNutrientInputSchema = z.object({
  foodId: z.string(),
  nutrientId: z.string(),
  amount: z.number().nonnegative(),
});
export type CreateFoodNutrientInput = z.infer<typeof CreateFoodNutrientInputSchema>;

// -- Food Log ----------------------------------------------------------------

export const FoodLogEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  mealType: MealTypeSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type FoodLogEntry = z.infer<typeof FoodLogEntrySchema>;

export const CreateFoodLogEntryInputSchema = z.object({
  date: z.string(),
  mealType: MealTypeSchema,
  notes: z.string().optional(),
});
export type CreateFoodLogEntryInput = z.infer<typeof CreateFoodLogEntryInputSchema>;

// -- Food Log Item -----------------------------------------------------------

export const FoodLogItemSchema = z.object({
  id: z.string(),
  logId: z.string(),
  foodId: z.string(),
  servingCount: z.number().positive(),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
});
export type FoodLogItem = z.infer<typeof FoodLogItemSchema>;

export const CreateFoodLogItemInputSchema = z.object({
  logId: z.string(),
  foodId: z.string(),
  servingCount: z.number().positive().default(1),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
});
export type CreateFoodLogItemInput = z.infer<typeof CreateFoodLogItemInputSchema>;

// -- Daily Goals -------------------------------------------------------------

export const DailyGoalsSchema = z.object({
  id: z.string(),
  calories: z.number().positive(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  effectiveDate: z.string(),
});
export type DailyGoals = z.infer<typeof DailyGoalsSchema>;

export const CreateDailyGoalsInputSchema = z.object({
  calories: z.number().positive(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  effectiveDate: z.string(),
});
export type CreateDailyGoalsInput = z.infer<typeof CreateDailyGoalsInputSchema>;

// -- Barcode Cache -----------------------------------------------------------

export const BarcodeCacheSchema = z.object({
  barcode: z.string(),
  foodId: z.string().nullable(),
  source: z.string(),
  rawJson: z.string().nullable(),
  expiresAt: z.string().nullable(),
});
export type BarcodeCache = z.infer<typeof BarcodeCacheSchema>;
