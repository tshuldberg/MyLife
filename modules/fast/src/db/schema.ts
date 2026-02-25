/**
 * SQLite schema for MyFast module.
 * All table names use the ft_ prefix to avoid collisions in the shared hub database.
 *
 * UUIDs stored as TEXT.
 * Dates stored as TEXT in ISO datetime format.
 * Booleans stored as INTEGER (0/1).
 */

// -- 1. Fasts --
export const CREATE_FASTS = `
CREATE TABLE IF NOT EXISTS ft_fasts (
    id TEXT PRIMARY KEY,
    protocol TEXT NOT NULL,
    target_hours REAL NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER,
    hit_target INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 2. Weight Entries --
export const CREATE_WEIGHT_ENTRIES = `
CREATE TABLE IF NOT EXISTS ft_weight_entries (
    id TEXT PRIMARY KEY,
    weight_value REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'lbs',
    date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 3. Protocols --
export const CREATE_PROTOCOLS = `
CREATE TABLE IF NOT EXISTS ft_protocols (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fasting_hours REAL NOT NULL,
    eating_hours REAL NOT NULL,
    description TEXT,
    is_custom INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
)`;

// -- 4. Streak Cache --
export const CREATE_STREAK_CACHE = `
CREATE TABLE IF NOT EXISTS ft_streak_cache (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 5. Active Fast (singleton) --
export const CREATE_ACTIVE_FAST = `
CREATE TABLE IF NOT EXISTS ft_active_fast (
    id TEXT PRIMARY KEY DEFAULT 'current',
    fast_id TEXT NOT NULL REFERENCES ft_fasts(id) ON DELETE CASCADE,
    protocol TEXT NOT NULL,
    target_hours REAL NOT NULL,
    started_at TEXT NOT NULL
)`;

// -- 6. Settings --
export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS ft_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
)`;

// -- Indexes --
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS ft_fasts_started_idx ON ft_fasts(started_at)`,
  `CREATE INDEX IF NOT EXISTS ft_fasts_protocol_idx ON ft_fasts(protocol)`,
  `CREATE INDEX IF NOT EXISTS ft_fasts_hit_target_idx ON ft_fasts(hit_target)`,
  `CREATE INDEX IF NOT EXISTS ft_weight_date_idx ON ft_weight_entries(date)`,
];

/** All table creation statements in dependency order */
export const ALL_TABLES = [
  CREATE_FASTS,
  CREATE_WEIGHT_ENTRIES,
  CREATE_PROTOCOLS,
  CREATE_STREAK_CACHE,
  CREATE_ACTIVE_FAST,
  CREATE_SETTINGS,
];

/** Seed SQL for the 6 preset fasting protocols */
export const SEED_PROTOCOLS = [
  `INSERT OR IGNORE INTO ft_protocols (id, name, fasting_hours, eating_hours, description, sort_order, is_default) VALUES ('16:8', 'Lean Gains (16:8)', 16, 8, 'Fast 16 hours, eat within an 8-hour window. Most popular protocol for beginners.', 1, 1)`,
  `INSERT OR IGNORE INTO ft_protocols (id, name, fasting_hours, eating_hours, description, sort_order, is_default) VALUES ('18:6', 'Daily 18:6', 18, 6, 'Fast 18 hours, eat within a 6-hour window. Moderate intensity.', 2, 0)`,
  `INSERT OR IGNORE INTO ft_protocols (id, name, fasting_hours, eating_hours, description, sort_order, is_default) VALUES ('20:4', 'Warrior (20:4)', 20, 4, 'Fast 20 hours, eat within a 4-hour window. One main meal with snacks.', 3, 0)`,
  `INSERT OR IGNORE INTO ft_protocols (id, name, fasting_hours, eating_hours, description, sort_order, is_default) VALUES ('23:1', 'OMAD (23:1)', 23, 1, 'One Meal A Day. Fast 23 hours, single eating hour.', 4, 0)`,
  `INSERT OR IGNORE INTO ft_protocols (id, name, fasting_hours, eating_hours, description, sort_order, is_default) VALUES ('36:0', 'Alternate Day (36h)', 36, 0, 'Full 36-hour fast. Skip an entire day of eating.', 5, 0)`,
  `INSERT OR IGNORE INTO ft_protocols (id, name, fasting_hours, eating_hours, description, sort_order, is_default) VALUES ('48:0', 'Extended (48h)', 48, 0, 'Full 48-hour fast. Two days without eating.', 6, 0)`,
];

/** Seed SQL for default settings */
export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO ft_settings (key, value) VALUES ('defaultProtocol', '16:8')`,
  `INSERT OR IGNORE INTO ft_settings (key, value) VALUES ('notifyFastComplete', 'false')`,
  `INSERT OR IGNORE INTO ft_settings (key, value) VALUES ('notifyEatingWindowClosing', 'false')`,
  `INSERT OR IGNORE INTO ft_settings (key, value) VALUES ('weightTrackingEnabled', 'false')`,
  `INSERT OR IGNORE INTO ft_settings (key, value) VALUES ('weightUnit', 'lbs')`,
];
