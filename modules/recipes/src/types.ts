import { z } from 'zod';

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;

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

export const IngredientSchema = z.object({
  id: z.string(),
  recipe_id: z.string(),
  name: z.string().min(1),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  sort_order: z.number().int(),
  section: z.string().nullable().optional(),
  quantity_value: z.number().nullable().optional(),
  item: z.string().nullable().optional(),
  prep_note: z.string().nullable().optional(),
  is_optional: z.number().int().min(0).max(1).optional(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

export const CreateIngredientSchema = IngredientSchema.omit({ id: true }).partial({
  quantity: true,
  unit: true,
  sort_order: true,
  section: true,
  quantity_value: true,
  item: true,
  prep_note: true,
  is_optional: true,
});

export type CreateIngredient = z.infer<typeof CreateIngredientSchema>;

export interface StructuredIngredient {
  id: string;
  recipe_id: string;
  section: string | null;
  quantity_value: number | null;
  quantity: string | null;
  unit: string | null;
  item: string;
  name: string;
  prep_note: string | null;
  is_optional: number;
  sort_order: number;
}

export interface ParsedIngredient {
  raw: string;
  quantity: number | null;
  unit: string | null;
  item: string;
  prepNote: string | null;
}

export const RecipeTagSchema = z.object({
  id: z.string(),
  recipe_id: z.string(),
  tag: z.string().min(1),
});

export type RecipeTag = z.infer<typeof RecipeTagSchema>;

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
  section: z.string().nullable().optional(),
});
export type Step = z.infer<typeof StepSchema>;

export interface CookingStepWithTimer extends Step {
  inferred_timer_minutes: number | null;
}

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

export interface MealPlanWeek {
  plan: MealPlan;
  items: Array<MealPlanItem & { recipe_title: string; recipe_image_uri: string | null }>;
}

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

export type PlantCareType = 'watered' | 'fertilized' | 'pruned' | 'repotted' | 'note';

export interface PlantCareLog {
  id: string;
  plant_id: string;
  care_type: PlantCareType;
  performed_at: string;
  notes: string | null;
  created_at: string;
}

export interface GardenLayoutCell {
  x: number;
  y: number;
  plantId: string | null;
  species: string | null;
}

export interface GardenLayout {
  id: string;
  name: string;
  grid_width: number;
  grid_height: number;
  cells_json: string;
  created_at: string;
  updated_at: string;
}

export interface GardenJournalEntry {
  id: string;
  plant_id: string | null;
  photo_path: string;
  note: string | null;
  identified_species: string | null;
  captured_at: string;
  created_at: string;
}

export interface Harvest {
  id: string;
  plant_id: string | null;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  harvested_at: string;
  note: string | null;
  created_at: string;
}

export interface HarvestRecipeLink {
  id: string;
  harvest_id: string;
  recipe_id: string;
  match_reason: string | null;
  created_at: string;
}

export interface GardenPlantDashboard extends GardenPlant {
  next_watering_date: string;
  needs_water: boolean;
  overdue_days: number;
}

export const EventResponseSchema = z.enum(['attending', 'maybe', 'declined']);
export type EventResponse = z.infer<typeof EventResponseSchema>;

export type EventCourse = 'appetizer' | 'main' | 'side' | 'dessert' | 'drink';

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

export interface EventGuest {
  id: string;
  event_id: string;
  name: string;
  contact: string | null;
  dietary_preferences: string | null;
  allergies: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  guest_id: string;
  response: EventResponse;
  note: string | null;
  responded_at: string;
  created_at: string;
  updated_at: string;
}

export interface EventMenuItem {
  id: string;
  event_id: string;
  recipe_id: string;
  course: EventCourse;
  servings: number;
  created_at: string;
  updated_at: string;
}

export interface EventPotluckClaim {
  id: string;
  event_id: string;
  guest_id: string;
  dish_name: string;
  note: string | null;
  claimed_at: string;
  created_at: string;
}

export interface EventTimelineItem {
  id: string;
  event_id: string;
  label: string;
  starts_at: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventAllergyWarning {
  guest_name: string;
  allergy: string;
  recipe_id: string;
  recipe_title: string;
  ingredient: string;
}

export interface EventBundle {
  event: Event;
  guests: EventGuest[];
  rsvps: EventRsvp[];
  menu: EventMenuItem[];
  potluck: EventPotluckClaim[];
  timeline: EventTimelineItem[];
  allergyWarnings: EventAllergyWarning[];
}

export interface EventInviteBundle {
  event: Event;
  menu: Array<{
    recipe_id: string;
    recipe_title: string;
    servings: number;
    course: EventCourse;
  }>;
  timeline: EventTimelineItem[];
  rsvpSummary: {
    attending: number;
    maybe: number;
    declined: number;
  };
}

export interface ParsedRecipe {
  title: string;
  description?: string;
  prep_time_min?: number;
  cook_time_min?: number;
  servings?: number;
  ingredients: string[];
  steps: string[];
}

export type GrocerySection =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'pantry'
  | 'frozen'
  | 'bakery'
  | 'beverages'
  | 'snacks'
  | 'condiments'
  | 'other';

export interface MergedGroceryItem {
  item: string;
  quantity: number | null;
  unit: string | null;
  section: GrocerySection;
  recipeIds: string[];
}

export interface ShoppingListItem {
  item: string;
  quantity: number | null;
  unit: string | null;
  grocerySection: GrocerySection;
  inPantry: boolean;
  pantryQuantity: number | null;
  pantryUnit: string | null;
  needed: number | null;
  recipeIds: string[];
}

export interface ConsolidatedShoppingItem {
  item: string;
  quantity: number | null;
  unit: string | null;
  in_stock: boolean;
  grocery_section?: GrocerySection;
  needed?: number | null;
  recipe_ids?: string[];
}

export type StorageLocation = 'fridge' | 'freezer' | 'pantry' | 'counter' | 'other';
export type ExpirationStatus = 'fresh' | 'expiring_soon' | 'expired' | 'no_date';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  storage_location: StorageLocation;
  expiration_date: string | null;
  purchase_date: string | null;
  barcode: string | null;
  photo_path: string | null;
  notes: string | null;
  grocery_section: GrocerySection;
  is_staple: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePantryItem {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  storage_location: StorageLocation;
  expiration_date?: string | null;
  purchase_date?: string | null;
  barcode?: string | null;
  photo_path?: string | null;
  notes?: string | null;
  grocery_section?: GrocerySection;
  is_staple?: number;
}

export interface UpdatePantryItem {
  name?: string;
  quantity?: number | null;
  unit?: string | null;
  storage_location?: StorageLocation;
  expiration_date?: string | null;
  purchase_date?: string | null;
  barcode?: string | null;
  photo_path?: string | null;
  notes?: string | null;
  grocery_section?: GrocerySection;
  is_staple?: number;
}

export interface PantryFilters {
  search?: string;
  storageLocation?: StorageLocation;
  grocerySection?: GrocerySection;
  expirationStatus?: ExpirationStatus;
  isStaple?: boolean;
  sortBy?: 'name' | 'expiration_date' | 'created_at' | 'storage_location';
  sortDir?: 'ASC' | 'DESC';
}

export interface DeductionResult {
  deducted: Array<{
    pantryItemId: string;
    pantryItemName: string;
    ingredientItem: string;
    previousQuantity: number | null;
    newQuantity: number | null;
    removed: boolean;
  }>;
  unmatched: string[];
}

export interface MatchedIngredient {
  ingredientId: string;
  ingredientItem: string;
  pantryItemId: string | null;
  pantryItemName: string | null;
  matchScore: number;
  quantitySufficient: boolean | null;
  quantityNeeded: number | null;
  quantityAvailable: number | null;
  unit: string | null;
}

export interface RecipeMatch {
  recipeId: string;
  title: string;
  totalIngredients: number;
  matchedIngredients: number;
  missingIngredients: MatchedIngredient[];
  availableIngredients: MatchedIngredient[];
  matchPercentage: number;
  canMake: boolean;
}

export interface MatchOptions {
  minMatchPercent?: number;
  maxResults?: number;
  includeStaplesAsAvailable?: boolean;
}

export interface ExpiringRecipeSuggestion {
  recipe: RecipeMatch;
  expiringItems: Array<{ name: string; daysLeft: number }>;
}

export interface SubstitutionSuggestion {
  substitute: string;
  quantity_hint: string;
  reason: string;
  in_pantry: boolean;
}

// --- Collections ---

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable(),
  cover_recipe_id: z.string().nullable(),
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const CreateCollectionSchema = CollectionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  description: true,
  cover_recipe_id: true,
  sort_order: true,
});
export type CreateCollection = z.infer<typeof CreateCollectionSchema>;

// --- Nutrition ---

export const NutritionSourceSchema = z.enum(['open_food_facts', 'manual']);
export type NutritionSource = z.infer<typeof NutritionSourceSchema>;

export const NutritionDataSchema = z.object({
  id: z.string(),
  pantry_item_id: z.string().nullable(),
  barcode: z.string().nullable(),
  product_name: z.string().nullable(),
  brand: z.string().nullable(),
  serving_size_text: z.string().nullable(),
  calories: z.number().nullable(),
  fat_g: z.number().nullable(),
  saturated_fat_g: z.number().nullable(),
  carbs_g: z.number().nullable(),
  fiber_g: z.number().nullable(),
  sugar_g: z.number().nullable(),
  protein_g: z.number().nullable(),
  sodium_mg: z.number().nullable(),
  source: NutritionSourceSchema,
  fetched_at: z.string(),
});
export type NutritionData = z.infer<typeof NutritionDataSchema>;

export const CreateNutritionDataSchema = NutritionDataSchema.omit({
  id: true,
  fetched_at: true,
}).partial({
  pantry_item_id: true,
  barcode: true,
  product_name: true,
  brand: true,
  serving_size_text: true,
  calories: true,
  fat_g: true,
  saturated_fat_g: true,
  carbs_g: true,
  fiber_g: true,
  sugar_g: true,
  protein_g: true,
  sodium_mg: true,
});
export type CreateNutritionData = z.infer<typeof CreateNutritionDataSchema>;

export const UpdateNutritionDataSchema = CreateNutritionDataSchema.partial();
export type UpdateNutritionData = z.infer<typeof UpdateNutritionDataSchema>;

// --- Import ---

export type ImportSource =
  | 'url'
  | 'text'
  | 'photo'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'share'
  | 'clipboard';

export interface ImportResult {
  source: ImportSource;
  parsed: ParsedRecipe | null;
  metadata?: {
    sourceUrl?: string;
    author?: string;
    thumbnailUrl?: string;
    platform?: string;
  };
  error?: string;
}

// --- Shopping Lists ---

export interface ShoppingList {
  id: string;
  name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItemRow {
  id: string;
  list_id: string;
  item: string;
  quantity: number | null;
  unit: string | null;
  grocery_section: GrocerySection;
  recipe_id: string | null;
  recipe_multiplier: number;
  is_checked: number;
  is_custom: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateShoppingListItem {
  item: string;
  quantity?: number | null;
  unit?: string | null;
  grocery_section?: GrocerySection;
  recipe_id?: string | null;
  recipe_multiplier?: number;
  is_custom?: number;
  sort_order?: number;
}

export interface ShoppingListSummary {
  list: ShoppingList;
  totalItems: number;
  checkedItems: number;
  recipeCount: number;
  customItemCount: number;
}

export interface RecipeForShoppingList {
  recipeId: string;
  title: string;
  multiplier: number;
}
