/**
 * SQLite schema for MyGarden module.
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

export const CREATE_STEPS = `
CREATE TABLE IF NOT EXISTS rc_steps (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES rc_recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    timer_minutes INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0
)`;

export const CREATE_RC_MEAL_PLANS = `
CREATE TABLE IF NOT EXISTS rc_meal_plans (
    id TEXT PRIMARY KEY,
    week_start_date TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_RC_MEAL_PLAN_ITEMS = `
CREATE TABLE IF NOT EXISTS rc_meal_plan_items (
    id TEXT PRIMARY KEY,
    meal_plan_id TEXT NOT NULL REFERENCES rc_meal_plans(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL REFERENCES rc_recipes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
    servings INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (meal_plan_id, day_of_week, meal_slot)
)`;

export const CREATE_GD_PLANTS = `
CREATE TABLE IF NOT EXISTS gd_plants (
    id TEXT PRIMARY KEY,
    species TEXT NOT NULL,
    location TEXT NOT NULL CHECK (location IN ('indoor', 'outdoor', 'raised_bed', 'container')),
    planting_date TEXT NOT NULL,
    watering_interval_days INTEGER NOT NULL DEFAULT 3,
    last_watered_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_GD_PLANT_CARE_LOGS = `
CREATE TABLE IF NOT EXISTS gd_plant_care_logs (
    id TEXT PRIMARY KEY,
    plant_id TEXT NOT NULL REFERENCES gd_plants(id) ON DELETE CASCADE,
    care_type TEXT NOT NULL CHECK (care_type IN ('watered', 'fertilized', 'pruned', 'repotted', 'note')),
    performed_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_GD_GARDEN_LAYOUTS = `
CREATE TABLE IF NOT EXISTS gd_garden_layouts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grid_width INTEGER NOT NULL DEFAULT 8,
    grid_height INTEGER NOT NULL DEFAULT 8,
    cells_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_GD_GARDEN_JOURNAL = `
CREATE TABLE IF NOT EXISTS gd_garden_journal (
    id TEXT PRIMARY KEY,
    plant_id TEXT REFERENCES gd_plants(id) ON DELETE SET NULL,
    photo_path TEXT NOT NULL,
    note TEXT,
    identified_species TEXT,
    captured_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_GD_HARVESTS = `
CREATE TABLE IF NOT EXISTS gd_harvests (
    id TEXT PRIMARY KEY,
    plant_id TEXT REFERENCES gd_plants(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity REAL,
    unit TEXT,
    harvested_at TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_GD_HARVEST_RECIPE_LINKS = `
CREATE TABLE IF NOT EXISTS gd_harvest_recipe_links (
    id TEXT PRIMARY KEY,
    harvest_id TEXT NOT NULL REFERENCES gd_harvests(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL REFERENCES rc_recipes(id) ON DELETE CASCADE,
    match_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_EV_EVENTS = `
CREATE TABLE IF NOT EXISTS ev_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT NOT NULL,
    location TEXT,
    description TEXT,
    capacity INTEGER,
    invite_token TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_EV_GUESTS = `
CREATE TABLE IF NOT EXISTS ev_guests (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES ev_events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact TEXT,
    dietary_preferences TEXT,
    allergies TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_EV_RSVPS = `
CREATE TABLE IF NOT EXISTS ev_rsvps (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES ev_events(id) ON DELETE CASCADE,
    guest_id TEXT NOT NULL REFERENCES ev_guests(id) ON DELETE CASCADE,
    response TEXT NOT NULL CHECK (response IN ('attending', 'maybe', 'declined')),
    note TEXT,
    responded_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (event_id, guest_id)
)`;

export const CREATE_EV_MENU_ITEMS = `
CREATE TABLE IF NOT EXISTS ev_menu_items (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES ev_events(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL REFERENCES rc_recipes(id) ON DELETE CASCADE,
    course TEXT NOT NULL CHECK (course IN ('appetizer', 'main', 'side', 'dessert', 'drink')),
    servings INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_EV_POTLUCK_CLAIMS = `
CREATE TABLE IF NOT EXISTS ev_potluck_claims (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES ev_events(id) ON DELETE CASCADE,
    guest_id TEXT NOT NULL REFERENCES ev_guests(id) ON DELETE CASCADE,
    dish_name TEXT NOT NULL,
    note TEXT,
    claimed_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_EV_EVENT_TIMELINE = `
CREATE TABLE IF NOT EXISTS ev_event_timeline (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES ev_events(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- Indexes --
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS rc_recipes_title_idx ON rc_recipes(title)`,
  `CREATE INDEX IF NOT EXISTS rc_recipes_favorite_idx ON rc_recipes(is_favorite) WHERE is_favorite = 1`,
  `CREATE INDEX IF NOT EXISTS rc_recipes_difficulty_idx ON rc_recipes(difficulty)`,
  `CREATE INDEX IF NOT EXISTS rc_recipes_created_idx ON rc_recipes(created_at)`,
  `CREATE INDEX IF NOT EXISTS rc_ingredients_recipe_idx ON rc_ingredients(recipe_id)`,
  `CREATE INDEX IF NOT EXISTS rc_steps_recipe_idx ON rc_steps(recipe_id)`,
  `CREATE INDEX IF NOT EXISTS rc_recipe_tags_recipe_idx ON rc_recipe_tags(recipe_id)`,
  `CREATE INDEX IF NOT EXISTS rc_recipe_tags_tag_idx ON rc_recipe_tags(tag)`,
];

/** All table creation statements in dependency order */
export const ALL_TABLES = [
  CREATE_RECIPES,
  CREATE_INGREDIENTS,
  CREATE_STEPS,
  CREATE_RECIPE_TAGS,
  CREATE_SETTINGS,
];

export const MYGARDEN_TABLES = [
  CREATE_RC_MEAL_PLANS,
  CREATE_RC_MEAL_PLAN_ITEMS,
  CREATE_GD_PLANTS,
  CREATE_GD_PLANT_CARE_LOGS,
  CREATE_GD_GARDEN_LAYOUTS,
  CREATE_GD_GARDEN_JOURNAL,
  CREATE_GD_HARVESTS,
  CREATE_GD_HARVEST_RECIPE_LINKS,
  CREATE_EV_EVENTS,
  CREATE_EV_GUESTS,
  CREATE_EV_RSVPS,
  CREATE_EV_MENU_ITEMS,
  CREATE_EV_POTLUCK_CLAIMS,
  CREATE_EV_EVENT_TIMELINE,
];

export const MYGARDEN_INDEXES = [
  `CREATE INDEX IF NOT EXISTS rc_meal_plans_week_idx ON rc_meal_plans(week_start_date)`,
  `CREATE INDEX IF NOT EXISTS rc_meal_plan_items_plan_idx ON rc_meal_plan_items(meal_plan_id)`,
  `CREATE INDEX IF NOT EXISTS rc_meal_plan_items_recipe_idx ON rc_meal_plan_items(recipe_id)`,
  `CREATE INDEX IF NOT EXISTS gd_plants_species_idx ON gd_plants(species)`,
  `CREATE INDEX IF NOT EXISTS gd_plants_water_idx ON gd_plants(last_watered_at)`,
  `CREATE INDEX IF NOT EXISTS gd_plant_care_logs_plant_idx ON gd_plant_care_logs(plant_id)`,
  `CREATE INDEX IF NOT EXISTS gd_garden_journal_plant_idx ON gd_garden_journal(plant_id)`,
  `CREATE INDEX IF NOT EXISTS gd_harvests_item_idx ON gd_harvests(item_name)`,
  `CREATE INDEX IF NOT EXISTS ev_events_date_idx ON ev_events(event_date)`,
  `CREATE INDEX IF NOT EXISTS ev_guests_event_idx ON ev_guests(event_id)`,
  `CREATE INDEX IF NOT EXISTS ev_rsvps_event_idx ON ev_rsvps(event_id)`,
  `CREATE INDEX IF NOT EXISTS ev_menu_items_event_idx ON ev_menu_items(event_id)`,
  `CREATE INDEX IF NOT EXISTS ev_potluck_event_idx ON ev_potluck_claims(event_id)`,
  `CREATE INDEX IF NOT EXISTS ev_timeline_event_idx ON ev_event_timeline(event_id)`,
];

/** Seed SQL for default settings */
export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO rc_settings (key, value) VALUES ('defaultServings', '4')`,
  `INSERT OR IGNORE INTO rc_settings (key, value) VALUES ('measurementSystem', 'us')`,
  `INSERT OR IGNORE INTO rc_settings (key, value) VALUES ('defaultDifficulty', 'medium')`,
];
