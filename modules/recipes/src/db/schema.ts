/**
 * SQLite schema for MyRecipes module.
 * All table names use the rc_ prefix to avoid collisions in the shared hub database.
 *
 * UUIDs stored as TEXT.
 * Dates stored as TEXT in ISO datetime format.
 * Booleans stored as INTEGER (0/1).
 */

// -- 1. Recipes --
export const CREATE_RECIPES = `
CREATE TABLE IF NOT EXISTS rc_recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    servings INTEGER,
    prep_time_mins INTEGER,
    cook_time_mins INTEGER,
    total_time_mins INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    source_url TEXT,
    image_uri TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    rating INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 2. Ingredients --
export const CREATE_INGREDIENTS = `
CREATE TABLE IF NOT EXISTS rc_ingredients (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES rc_recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity TEXT,
    unit TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
)`;

// -- 3. Recipe Tags --
export const CREATE_RECIPE_TAGS = `
CREATE TABLE IF NOT EXISTS rc_recipe_tags (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES rc_recipes(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
)`;

// -- 4. Settings --
export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS rc_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
)`;

// -- Indexes --
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS rc_recipes_title_idx ON rc_recipes(title)`,
  `CREATE INDEX IF NOT EXISTS rc_recipes_favorite_idx ON rc_recipes(is_favorite) WHERE is_favorite = 1`,
  `CREATE INDEX IF NOT EXISTS rc_recipes_difficulty_idx ON rc_recipes(difficulty)`,
  `CREATE INDEX IF NOT EXISTS rc_recipes_created_idx ON rc_recipes(created_at)`,
  `CREATE INDEX IF NOT EXISTS rc_ingredients_recipe_idx ON rc_ingredients(recipe_id)`,
  `CREATE INDEX IF NOT EXISTS rc_recipe_tags_recipe_idx ON rc_recipe_tags(recipe_id)`,
  `CREATE INDEX IF NOT EXISTS rc_recipe_tags_tag_idx ON rc_recipe_tags(tag)`,
];

/** All table creation statements in dependency order */
export const ALL_TABLES = [
  CREATE_RECIPES,
  CREATE_INGREDIENTS,
  CREATE_RECIPE_TAGS,
  CREATE_SETTINGS,
];

/** Seed SQL for default settings */
export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO rc_settings (key, value) VALUES ('defaultServings', '4')`,
  `INSERT OR IGNORE INTO rc_settings (key, value) VALUES ('measurementSystem', 'us')`,
  `INSERT OR IGNORE INTO rc_settings (key, value) VALUES ('defaultDifficulty', 'medium')`,
];
