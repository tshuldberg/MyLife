export const CREATE_HABITS = `
CREATE TABLE IF NOT EXISTS hb_habits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily',
    target_count INTEGER NOT NULL DEFAULT 1,
    unit TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_COMPLETIONS = `
CREATE TABLE IF NOT EXISTS hb_completions (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL REFERENCES hb_habits(id) ON DELETE CASCADE,
    completed_at TEXT NOT NULL,
    value REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS hb_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS hb_completions_habit_idx ON hb_completions(habit_id)`,
  `CREATE INDEX IF NOT EXISTS hb_completions_date_idx ON hb_completions(completed_at)`,
  `CREATE INDEX IF NOT EXISTS hb_habits_archived_idx ON hb_habits(is_archived)`,
];

export const ALL_TABLES = [CREATE_HABITS, CREATE_COMPLETIONS, CREATE_SETTINGS];

export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO hb_settings (key, value) VALUES ('weekStartsOn', 'monday')`,
];
