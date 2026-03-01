// ── V1 Tables ─────────────────────────────────────────────────────────────

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

// ── V2 Schema additions ──────────────────────────────────────────────────

export const ALTER_HABITS_V2 = [
  `ALTER TABLE hb_habits ADD COLUMN habit_type TEXT DEFAULT 'standard'`,
  `ALTER TABLE hb_habits ADD COLUMN time_of_day TEXT DEFAULT 'anytime'`,
  `ALTER TABLE hb_habits ADD COLUMN specific_days TEXT`,
  `ALTER TABLE hb_habits ADD COLUMN grace_period INTEGER DEFAULT 0`,
  `ALTER TABLE hb_habits ADD COLUMN reminder_time TEXT`,
];

export const CREATE_TIMED_SESSIONS = `
CREATE TABLE IF NOT EXISTS hb_timed_sessions (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL REFERENCES hb_habits(id) ON DELETE CASCADE,
    started_at TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    target_seconds INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_MEASUREMENTS = `
CREATE TABLE IF NOT EXISTS hb_measurements (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL REFERENCES hb_habits(id) ON DELETE CASCADE,
    measured_at TEXT NOT NULL,
    value REAL NOT NULL,
    target REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_CY_PERIODS = `
CREATE TABLE IF NOT EXISTS cy_periods (
    id TEXT PRIMARY KEY,
    start_date TEXT NOT NULL,
    end_date TEXT,
    cycle_length INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_CY_SYMPTOMS = `
CREATE TABLE IF NOT EXISTS cy_symptoms (
    id TEXT PRIMARY KEY,
    period_id TEXT NOT NULL REFERENCES cy_periods(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    symptom_type TEXT NOT NULL,
    severity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_CY_PREDICTIONS = `
CREATE TABLE IF NOT EXISTS cy_predictions (
    id TEXT PRIMARY KEY,
    predicted_start TEXT NOT NULL,
    predicted_end TEXT NOT NULL,
    confidence_days REAL NOT NULL DEFAULT 0,
    algorithm_version TEXT NOT NULL DEFAULT 'moving_avg_v1',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_CY_SETTINGS = `
CREATE TABLE IF NOT EXISTS cy_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const V2_INDEXES = [
  `CREATE INDEX IF NOT EXISTS hb_timed_sessions_habit_idx ON hb_timed_sessions(habit_id)`,
  `CREATE INDEX IF NOT EXISTS hb_timed_sessions_date_idx ON hb_timed_sessions(started_at)`,
  `CREATE INDEX IF NOT EXISTS hb_measurements_habit_idx ON hb_measurements(habit_id)`,
  `CREATE INDEX IF NOT EXISTS hb_measurements_date_idx ON hb_measurements(measured_at)`,
  `CREATE INDEX IF NOT EXISTS cy_symptoms_period_idx ON cy_symptoms(period_id)`,
  `CREATE INDEX IF NOT EXISTS cy_symptoms_date_idx ON cy_symptoms(date)`,
  `CREATE INDEX IF NOT EXISTS cy_periods_date_idx ON cy_periods(start_date)`,
];

export const ALL_V2_TABLES = [
  CREATE_TIMED_SESSIONS,
  CREATE_MEASUREMENTS,
  CREATE_CY_PERIODS,
  CREATE_CY_SYMPTOMS,
  CREATE_CY_PREDICTIONS,
  CREATE_CY_SETTINGS,
];
