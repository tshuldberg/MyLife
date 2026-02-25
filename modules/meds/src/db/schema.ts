export const CREATE_MEDICATIONS = `
CREATE TABLE IF NOT EXISTS md_medications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dosage TEXT,
    unit TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily',
    instructions TEXT,
    prescriber TEXT,
    pharmacy TEXT,
    refill_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_DOSES = `
CREATE TABLE IF NOT EXISTS md_doses (
    id TEXT PRIMARY KEY,
    medication_id TEXT NOT NULL REFERENCES md_medications(id) ON DELETE CASCADE,
    taken_at TEXT NOT NULL,
    skipped INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS md_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS md_doses_med_idx ON md_doses(medication_id)`,
  `CREATE INDEX IF NOT EXISTS md_doses_taken_idx ON md_doses(taken_at)`,
  `CREATE INDEX IF NOT EXISTS md_medications_active_idx ON md_medications(is_active)`,
];

export const ALL_TABLES = [CREATE_MEDICATIONS, CREATE_DOSES, CREATE_SETTINGS];

export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO md_settings (key, value) VALUES ('reminderTime', '08:00')`,
];
