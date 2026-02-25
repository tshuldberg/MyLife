import type { DatabaseAdapter } from '@mylife/db';
import type {
  Recipe,
  CreateRecipe,
  UpdateRecipe,
  Ingredient,
  CreateIngredient,
  RecipeTag,
  RecipeFilters,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────
// Row shapes
// ─────────────────────────────────────────────────────────────────────────

interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  servings: number | null;
  prep_time_mins: number | null;
  cook_time_mins: number | null;
  total_time_mins: number | null;
  difficulty: string | null;
  source_url: string | null;
  image_uri: string | null;
  is_favorite: number;
  rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface IngredientRow {
  id: string;
  recipe_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  sort_order: number;
}

interface RecipeTagRow {
  id: string;
  recipe_id: string;
  tag: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Row mappers
// ─────────────────────────────────────────────────────────────────────────

function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    servings: row.servings,
    prep_time_mins: row.prep_time_mins,
    cook_time_mins: row.cook_time_mins,
    total_time_mins: row.total_time_mins,
    difficulty: row.difficulty as Recipe['difficulty'],
    source_url: row.source_url,
    image_uri: row.image_uri,
    is_favorite: row.is_favorite,
    rating: row.rating,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    sort_order: row.sort_order,
  };
}

function rowToTag(row: RecipeTagRow): RecipeTag {
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    tag: row.tag,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Recipes CRUD
// ─────────────────────────────────────────────────────────────────────────

/** Create a new recipe */
export function createRecipe(
  db: DatabaseAdapter,
  id: string,
  input: CreateRecipe,
): Recipe {
  const now = new Date().toISOString();

  db.execute(
    `INSERT INTO rc_recipes (id, title, description, servings, prep_time_mins, cook_time_mins,
      total_time_mins, difficulty, source_url, image_uri, is_favorite, rating, notes,
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.description ?? null,
      input.servings ?? null,
      input.prep_time_mins ?? null,
      input.cook_time_mins ?? null,
      input.total_time_mins ?? null,
      input.difficulty ?? null,
      input.source_url ?? null,
      input.image_uri ?? null,
      input.is_favorite ?? 0,
      input.rating ?? 0,
      input.notes ?? null,
      now,
      now,
    ],
  );

  return {
    id,
    title: input.title,
    description: input.description ?? null,
    servings: input.servings ?? null,
    prep_time_mins: input.prep_time_mins ?? null,
    cook_time_mins: input.cook_time_mins ?? null,
    total_time_mins: input.total_time_mins ?? null,
    difficulty: input.difficulty ?? null,
    source_url: input.source_url ?? null,
    image_uri: input.image_uri ?? null,
    is_favorite: input.is_favorite ?? 0,
    rating: input.rating ?? 0,
    notes: input.notes ?? null,
    created_at: now,
    updated_at: now,
  };
}

/** Get recipes with optional filters. Newest first by default. */
export function getRecipes(db: DatabaseAdapter, filters?: RecipeFilters): Recipe[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.search) {
    conditions.push(`r.title LIKE ?`);
    params.push(`%${filters.search}%`);
  }
  if (filters?.is_favorite) {
    conditions.push(`r.is_favorite = 1`);
  }
  if (filters?.difficulty) {
    conditions.push(`r.difficulty = ?`);
    params.push(filters.difficulty);
  }
  if (filters?.tag) {
    conditions.push(`r.id IN (SELECT recipe_id FROM rc_recipe_tags WHERE tag = ?)`);
    params.push(filters.tag);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  params.push(limit, offset);

  const rows = db.query<RecipeRow>(
    `SELECT r.* FROM rc_recipes r ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    params,
  );

  return rows.map(rowToRecipe);
}

/** Get a single recipe by ID, or null if not found */
export function getRecipeById(db: DatabaseAdapter, id: string): Recipe | null {
  const rows = db.query<RecipeRow>(
    `SELECT * FROM rc_recipes WHERE id = ?`,
    [id],
  );
  return rows[0] ? rowToRecipe(rows[0]) : null;
}

/** Update a recipe's fields. Only provided fields are changed. */
export function updateRecipe(
  db: DatabaseAdapter,
  id: string,
  updates: UpdateRecipe,
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  const fieldMap: Record<string, keyof UpdateRecipe> = {
    title: 'title',
    description: 'description',
    servings: 'servings',
    prep_time_mins: 'prep_time_mins',
    cook_time_mins: 'cook_time_mins',
    total_time_mins: 'total_time_mins',
    difficulty: 'difficulty',
    source_url: 'source_url',
    image_uri: 'image_uri',
    is_favorite: 'is_favorite',
    rating: 'rating',
    notes: 'notes',
  };

  for (const [col, key] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.execute(`UPDATE rc_recipes SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

/** Delete a recipe by ID. Cascades to ingredients and tags. */
export function deleteRecipe(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM rc_recipes WHERE id = ?`, [id]);
  const rows = db.query<RecipeRow>(`SELECT * FROM rc_recipes WHERE id = ?`, [id]);
  return rows.length === 0;
}

/** Count total recipes, optionally filtered */
export function countRecipes(db: DatabaseAdapter, filters?: RecipeFilters): number {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.search) {
    conditions.push(`title LIKE ?`);
    params.push(`%${filters.search}%`);
  }
  if (filters?.is_favorite) {
    conditions.push(`is_favorite = 1`);
  }
  if (filters?.difficulty) {
    conditions.push(`difficulty = ?`);
    params.push(filters.difficulty);
  }
  if (filters?.tag) {
    conditions.push(`id IN (SELECT recipe_id FROM rc_recipe_tags WHERE tag = ?)`);
    params.push(filters.tag);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM rc_recipes ${where}`,
    params,
  );
  return rows[0]?.count ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────
// Ingredients CRUD
// ─────────────────────────────────────────────────────────────────────────

/** Add an ingredient to a recipe */
export function addIngredient(
  db: DatabaseAdapter,
  id: string,
  input: CreateIngredient,
): Ingredient {
  db.execute(
    `INSERT INTO rc_ingredients (id, recipe_id, name, quantity, unit, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.recipe_id,
      input.name,
      input.quantity ?? null,
      input.unit ?? null,
      input.sort_order ?? 0,
    ],
  );

  return {
    id,
    recipe_id: input.recipe_id,
    name: input.name,
    quantity: input.quantity ?? null,
    unit: input.unit ?? null,
    sort_order: input.sort_order ?? 0,
  };
}

/** Get all ingredients for a recipe, ordered by sort_order */
export function getIngredients(db: DatabaseAdapter, recipeId: string): Ingredient[] {
  const rows = db.query<IngredientRow>(
    `SELECT * FROM rc_ingredients WHERE recipe_id = ? ORDER BY sort_order`,
    [recipeId],
  );
  return rows.map(rowToIngredient);
}

/** Update an ingredient */
export function updateIngredient(
  db: DatabaseAdapter,
  id: string,
  updates: Partial<Pick<Ingredient, 'name' | 'quantity' | 'unit' | 'sort_order'>>,
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(updates.quantity);
  }
  if (updates.unit !== undefined) {
    fields.push('unit = ?');
    values.push(updates.unit);
  }
  if (updates.sort_order !== undefined) {
    fields.push('sort_order = ?');
    values.push(updates.sort_order);
  }

  if (fields.length > 0) {
    values.push(id);
    db.execute(`UPDATE rc_ingredients SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

/** Delete an ingredient by ID */
export function deleteIngredient(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM rc_ingredients WHERE id = ?`, [id]);
}

// ─────────────────────────────────────────────────────────────────────────
// Recipe Tags CRUD
// ─────────────────────────────────────────────────────────────────────────

/** Add a tag to a recipe */
export function addTag(
  db: DatabaseAdapter,
  id: string,
  recipeId: string,
  tag: string,
): RecipeTag {
  db.execute(
    `INSERT INTO rc_recipe_tags (id, recipe_id, tag) VALUES (?, ?, ?)`,
    [id, recipeId, tag],
  );
  return { id, recipe_id: recipeId, tag };
}

/** Get all tags for a recipe */
export function getTags(db: DatabaseAdapter, recipeId: string): RecipeTag[] {
  const rows = db.query<RecipeTagRow>(
    `SELECT * FROM rc_recipe_tags WHERE recipe_id = ?`,
    [recipeId],
  );
  return rows.map(rowToTag);
}

/** Delete a tag by ID */
export function deleteTag(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM rc_recipe_tags WHERE id = ?`, [id]);
}

// ─────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────

/** Get a setting value by key */
export function getSetting(db: DatabaseAdapter, key: string): string | null {
  const rows = db.query<{ value: string }>(
    `SELECT value FROM rc_settings WHERE key = ?`,
    [key],
  );
  return rows[0]?.value ?? null;
}

/** Set a setting value */
export function setSetting(db: DatabaseAdapter, key: string, value: string): void {
  db.execute(
    `INSERT OR REPLACE INTO rc_settings (key, value) VALUES (?, ?)`,
    [key, value],
  );
}
