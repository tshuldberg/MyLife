/**
 * SQLite schema for MyHealth module.
 * All table names use the hl_ prefix to avoid collisions in the shared hub database.
 *
 * MyHealth absorbs data from md_* (meds), ft_* (fast), and cy_* (cycle) tables
 * by reading/writing them directly. These 8 tables are NEW health-specific storage
 * that the absorbed modules never had.
 *
 * UUIDs stored as TEXT.
 * Dates stored as TEXT in ISO datetime format.
 * Booleans stored as INTEGER (0/1).
 * BLOBs stored directly for document content (max 10MB enforced at app layer).
 */

// -- 1. Documents (health records, lab results, prescriptions, insurance cards) --
export const CREATE_DOCUMENTS = `
CREATE TABLE IF NOT EXISTS hl_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('lab_result', 'prescription', 'insurance', 'imaging', 'vaccination', 'referral', 'discharge', 'other')),
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content BLOB NOT NULL,
    thumbnail BLOB,
    notes TEXT,
    document_date TEXT,
    is_starred INTEGER NOT NULL DEFAULT 0,
    tags TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 2. Vitals (wearable + manual measurements beyond what md_measurements covers) --
export const CREATE_VITALS = `
CREATE TABLE IF NOT EXISTS hl_vitals (
    id TEXT PRIMARY KEY,
    vital_type TEXT NOT NULL CHECK (vital_type IN (
        'heart_rate', 'resting_heart_rate', 'hrv', 'blood_oxygen',
        'blood_pressure', 'body_temperature', 'steps', 'active_energy',
        'respiratory_rate', 'vo2_max'
    )),
    value REAL NOT NULL,
    value_secondary REAL,
    unit TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'apple_health', 'health_connect', 'imported')),
    recorded_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 3. Sleep Sessions --
export const CREATE_SLEEP_SESSIONS = `
CREATE TABLE IF NOT EXISTS hl_sleep_sessions (
    id TEXT PRIMARY KEY,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    deep_minutes INTEGER,
    rem_minutes INTEGER,
    light_minutes INTEGER,
    awake_minutes INTEGER,
    quality_score REAL,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'apple_health', 'health_connect', 'imported')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 4. Sync Log (cursor tracking for incremental health data import) --
export const CREATE_SYNC_LOG = `
CREATE TABLE IF NOT EXISTS hl_sync_log (
    data_type TEXT PRIMARY KEY,
    last_sync_at TEXT NOT NULL,
    last_anchor TEXT,
    records_synced INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 5. Goals (cross-domain health goals spanning fasting, weight, steps, sleep, adherence) --
export const CREATE_GOALS = `
CREATE TABLE IF NOT EXISTS hl_goals (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL CHECK (domain IN ('fasting', 'weight', 'steps', 'sleep', 'adherence', 'water', 'vitals', 'custom')),
    metric TEXT NOT NULL,
    target_value REAL NOT NULL,
    unit TEXT,
    period TEXT NOT NULL DEFAULT 'daily' CHECK (period IN ('daily', 'weekly', 'monthly')),
    direction TEXT NOT NULL DEFAULT 'at_least' CHECK (direction IN ('at_least', 'at_most', 'exactly')),
    label TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    start_date TEXT NOT NULL,
    end_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 6. Goal Progress --
export const CREATE_GOAL_PROGRESS = `
CREATE TABLE IF NOT EXISTS hl_goal_progress (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES hl_goals(id) ON DELETE CASCADE,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    current_value REAL NOT NULL,
    target_value REAL NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 7. Emergency Info (singleton ICE card) --
export const CREATE_EMERGENCY_INFO = `
CREATE TABLE IF NOT EXISTS hl_emergency_info (
    id TEXT PRIMARY KEY DEFAULT 'profile',
    full_name TEXT,
    date_of_birth TEXT,
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL)),
    allergies TEXT,
    conditions TEXT,
    emergency_contacts TEXT,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_group_number TEXT,
    primary_physician TEXT,
    physician_phone TEXT,
    organ_donor INTEGER,
    notes TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 8. Settings (consolidated health settings) --
export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS hl_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- Indexes --
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS hl_documents_type_idx ON hl_documents(type)`,
  `CREATE INDEX IF NOT EXISTS hl_documents_starred_idx ON hl_documents(is_starred)`,
  `CREATE INDEX IF NOT EXISTS hl_documents_date_idx ON hl_documents(document_date)`,
  `CREATE INDEX IF NOT EXISTS hl_vitals_type_date_idx ON hl_vitals(vital_type, recorded_at)`,
  `CREATE INDEX IF NOT EXISTS hl_vitals_source_idx ON hl_vitals(source)`,
  `CREATE INDEX IF NOT EXISTS hl_sleep_start_idx ON hl_sleep_sessions(start_time)`,
  `CREATE INDEX IF NOT EXISTS hl_sleep_end_idx ON hl_sleep_sessions(end_time)`,
  `CREATE INDEX IF NOT EXISTS hl_goals_active_idx ON hl_goals(is_active)`,
  `CREATE INDEX IF NOT EXISTS hl_goals_domain_idx ON hl_goals(domain)`,
  `CREATE INDEX IF NOT EXISTS hl_goal_progress_goal_idx ON hl_goal_progress(goal_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS hl_goal_progress_unique_period_idx ON hl_goal_progress(goal_id, period_start, period_end)`,
];

/** All table creation statements in dependency order. */
export const ALL_TABLES = [
  CREATE_DOCUMENTS,
  CREATE_VITALS,
  CREATE_SLEEP_SESSIONS,
  CREATE_SYNC_LOG,
  CREATE_GOALS,
  CREATE_GOAL_PROGRESS,
  CREATE_EMERGENCY_INFO,
  CREATE_SETTINGS,
];

/** Default settings for health module. */
export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.enabled', 'false')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.heartRate', 'true')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.restingHeartRate', 'true')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.hrv', 'true')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.bloodOxygen', 'true')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.bloodPressure', 'false')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.bodyTemperature', 'false')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.steps', 'true')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.activeEnergy', 'true')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.sleep', 'true')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.respiratoryRate', 'false')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('healthSync.weight', 'true')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('units.weight', 'lbs')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('units.temperature', 'F')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('units.height', 'ft')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('sleep.targetHours', '8')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('notifications.medicationReminders', 'true')`,
  `INSERT OR IGNORE INTO hl_settings (key, value) VALUES ('notifications.goalProgress', 'true')`,
];
