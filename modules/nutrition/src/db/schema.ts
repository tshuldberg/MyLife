export const CREATE_FOODS = `
CREATE TABLE IF NOT EXISTS nu_foods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    serving_size REAL NOT NULL,
    serving_unit TEXT NOT NULL,
    calories REAL NOT NULL DEFAULT 0,
    protein_g REAL NOT NULL DEFAULT 0,
    carbs_g REAL NOT NULL DEFAULT 0,
    fat_g REAL NOT NULL DEFAULT 0,
    fiber_g REAL NOT NULL DEFAULT 0,
    sugar_g REAL NOT NULL DEFAULT 0,
    sodium_mg REAL NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'custom' CHECK (source IN ('usda', 'open_food_facts', 'fatsecret', 'custom', 'ai_photo')),
    barcode TEXT,
    usda_ndb_number TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_NUTRIENTS = `
CREATE TABLE IF NOT EXISTS nu_nutrients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL,
    rda_value REAL,
    rda_unit TEXT,
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('vitamin', 'mineral', 'amino_acid', 'fatty_acid', 'other')),
    sort_order INTEGER NOT NULL DEFAULT 0
)`;

export const CREATE_FOOD_NUTRIENTS = `
CREATE TABLE IF NOT EXISTS nu_food_nutrients (
    id TEXT PRIMARY KEY,
    food_id TEXT NOT NULL REFERENCES nu_foods(id) ON DELETE CASCADE,
    nutrient_id TEXT NOT NULL REFERENCES nu_nutrients(id) ON DELETE CASCADE,
    amount REAL NOT NULL DEFAULT 0
)`;

export const CREATE_FOOD_LOG = `
CREATE TABLE IF NOT EXISTS nu_food_log (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_FOOD_LOG_ITEMS = `
CREATE TABLE IF NOT EXISTS nu_food_log_items (
    id TEXT PRIMARY KEY,
    log_id TEXT NOT NULL REFERENCES nu_food_log(id) ON DELETE CASCADE,
    food_id TEXT NOT NULL REFERENCES nu_foods(id) ON DELETE CASCADE,
    serving_count REAL NOT NULL DEFAULT 1,
    calories REAL NOT NULL DEFAULT 0,
    protein_g REAL NOT NULL DEFAULT 0,
    carbs_g REAL NOT NULL DEFAULT 0,
    fat_g REAL NOT NULL DEFAULT 0
)`;

export const CREATE_DAILY_GOALS = `
CREATE TABLE IF NOT EXISTS nu_daily_goals (
    id TEXT PRIMARY KEY,
    calories REAL NOT NULL,
    protein_g REAL NOT NULL DEFAULT 0,
    carbs_g REAL NOT NULL DEFAULT 0,
    fat_g REAL NOT NULL DEFAULT 0,
    effective_date TEXT NOT NULL
)`;

export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS nu_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_BARCODE_CACHE = `
CREATE TABLE IF NOT EXISTS nu_barcode_cache (
    barcode TEXT PRIMARY KEY,
    food_id TEXT REFERENCES nu_foods(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    raw_json TEXT,
    expires_at TEXT
)`;

// -- Photo log (V3) ----------------------------------------------------------

export const CREATE_PHOTO_LOG = `
CREATE TABLE IF NOT EXISTS nu_photo_log (
    id TEXT PRIMARY KEY,
    image_uri TEXT NOT NULL,
    ai_response_json TEXT,
    accepted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- Full-text search --------------------------------------------------------

export const CREATE_FOODS_FTS = `
CREATE VIRTUAL TABLE IF NOT EXISTS nu_foods_fts USING fts5(
    name, brand, content='nu_foods', content_rowid='rowid'
)`;

// -- FTS sync triggers -------------------------------------------------------

export const CREATE_FTS_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS nu_foods_ai AFTER INSERT ON nu_foods BEGIN
    INSERT INTO nu_foods_fts(rowid, name, brand) VALUES (new.rowid, new.name, new.brand);
  END`,
  `CREATE TRIGGER IF NOT EXISTS nu_foods_ad AFTER DELETE ON nu_foods BEGIN
    INSERT INTO nu_foods_fts(nu_foods_fts, rowid, name, brand) VALUES('delete', old.rowid, old.name, old.brand);
  END`,
  `CREATE TRIGGER IF NOT EXISTS nu_foods_au AFTER UPDATE ON nu_foods BEGIN
    INSERT INTO nu_foods_fts(nu_foods_fts, rowid, name, brand) VALUES('delete', old.rowid, old.name, old.brand);
    INSERT INTO nu_foods_fts(rowid, name, brand) VALUES (new.rowid, new.name, new.brand);
  END`,
];

// -- Indexes -----------------------------------------------------------------

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS nu_foods_barcode_idx ON nu_foods(barcode)`,
  `CREATE INDEX IF NOT EXISTS nu_foods_source_idx ON nu_foods(source)`,
  `CREATE INDEX IF NOT EXISTS nu_food_nutrients_food_idx ON nu_food_nutrients(food_id)`,
  `CREATE INDEX IF NOT EXISTS nu_food_nutrients_nutrient_idx ON nu_food_nutrients(nutrient_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS nu_food_nutrients_pair_idx ON nu_food_nutrients(food_id, nutrient_id)`,
  `CREATE INDEX IF NOT EXISTS nu_food_log_date_idx ON nu_food_log(date)`,
  `CREATE INDEX IF NOT EXISTS nu_food_log_meal_idx ON nu_food_log(date, meal_type)`,
  `CREATE INDEX IF NOT EXISTS nu_food_log_items_log_idx ON nu_food_log_items(log_id)`,
  `CREATE INDEX IF NOT EXISTS nu_food_log_items_food_idx ON nu_food_log_items(food_id)`,
  `CREATE INDEX IF NOT EXISTS nu_daily_goals_date_idx ON nu_daily_goals(effective_date)`,
  `CREATE INDEX IF NOT EXISTS nu_barcode_cache_food_idx ON nu_barcode_cache(food_id)`,
];

// -- All tables (V1) ---------------------------------------------------------

export const ALL_TABLES = [
  CREATE_FOODS,
  CREATE_NUTRIENTS,
  CREATE_FOOD_NUTRIENTS,
  CREATE_FOOD_LOG,
  CREATE_FOOD_LOG_ITEMS,
  CREATE_DAILY_GOALS,
  CREATE_SETTINGS,
  CREATE_BARCODE_CACHE,
  CREATE_FOODS_FTS,
];

// -- Seed settings -----------------------------------------------------------

export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO nu_settings (key, value) VALUES ('defaultMealType', 'lunch')`,
  `INSERT OR IGNORE INTO nu_settings (key, value) VALUES ('calorieGoal', '2000')`,
];
