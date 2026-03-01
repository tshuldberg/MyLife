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

export const CREATE_DOSE_LOGS = `
CREATE TABLE IF NOT EXISTS md_dose_logs (
    id TEXT PRIMARY KEY,
    medication_id TEXT NOT NULL REFERENCES md_medications(id) ON DELETE CASCADE,
    scheduled_time TEXT NOT NULL,
    actual_time TEXT,
    status TEXT NOT NULL DEFAULT 'taken' CHECK (status IN ('taken', 'skipped', 'late', 'snoozed')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_REMINDERS = `
CREATE TABLE IF NOT EXISTS md_reminders (
    id TEXT PRIMARY KEY,
    medication_id TEXT NOT NULL REFERENCES md_medications(id) ON DELETE CASCADE,
    time TEXT NOT NULL,
    days_of_week TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
    is_active INTEGER NOT NULL DEFAULT 1,
    snooze_until TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_REFILLS = `
CREATE TABLE IF NOT EXISTS md_refills (
    id TEXT PRIMARY KEY,
    medication_id TEXT NOT NULL REFERENCES md_medications(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    refill_date TEXT NOT NULL,
    pharmacy TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INTERACTIONS = `
CREATE TABLE IF NOT EXISTS md_interactions (
    id TEXT PRIMARY KEY,
    drug_a TEXT NOT NULL,
    drug_b TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('mild', 'moderate', 'severe')),
    description TEXT NOT NULL,
    source TEXT NOT NULL
)`;

export const CREATE_MEASUREMENTS = `
CREATE TABLE IF NOT EXISTS md_measurements (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('blood_pressure', 'blood_sugar', 'weight', 'temperature', 'custom')),
    value TEXT NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    measured_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_MOOD_ENTRIES = `
CREATE TABLE IF NOT EXISTS md_mood_entries (
    id TEXT PRIMARY KEY,
    mood TEXT NOT NULL,
    energy_level TEXT NOT NULL CHECK (energy_level IN ('high', 'low')),
    pleasantness TEXT NOT NULL CHECK (pleasantness IN ('pleasant', 'unpleasant')),
    intensity INTEGER NOT NULL DEFAULT 3 CHECK (intensity BETWEEN 1 AND 5),
    notes TEXT,
    recorded_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_MOOD_ACTIVITIES = `
CREATE TABLE IF NOT EXISTS md_mood_activities (
    id TEXT PRIMARY KEY,
    mood_entry_id TEXT NOT NULL REFERENCES md_mood_entries(id) ON DELETE CASCADE,
    activity TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SYMPTOMS = `
CREATE TABLE IF NOT EXISTS md_symptoms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SYMPTOM_LOGS = `
CREATE TABLE IF NOT EXISTS md_symptom_logs (
    id TEXT PRIMARY KEY,
    symptom_id TEXT NOT NULL REFERENCES md_symptoms(id) ON DELETE CASCADE,
    severity INTEGER NOT NULL DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
    notes TEXT,
    logged_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS md_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// V1 indexes only (for original 3 tables)
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS md_doses_med_idx ON md_doses(medication_id)`,
  `CREATE INDEX IF NOT EXISTS md_doses_taken_idx ON md_doses(taken_at)`,
  `CREATE INDEX IF NOT EXISTS md_medications_active_idx ON md_medications(is_active)`,
];

// V1 tables (original 3)
export const ALL_TABLES = [CREATE_MEDICATIONS, CREATE_DOSES, CREATE_SETTINGS];

// V2 tables (new tables added in migration v2)
export const V2_TABLES = [
  CREATE_DOSE_LOGS,
  CREATE_REMINDERS,
  CREATE_REFILLS,
  CREATE_INTERACTIONS,
  CREATE_MEASUREMENTS,
  CREATE_MOOD_ENTRIES,
  CREATE_MOOD_ACTIVITIES,
  CREATE_SYMPTOMS,
  CREATE_SYMPTOM_LOGS,
];

// V2 indexes (only the new indexes for v2 tables)
export const V2_INDEXES = [
  `CREATE INDEX IF NOT EXISTS md_dose_logs_med_sched_idx ON md_dose_logs(medication_id, scheduled_time)`,
  `CREATE INDEX IF NOT EXISTS md_reminders_med_idx ON md_reminders(medication_id)`,
  `CREATE INDEX IF NOT EXISTS md_refills_med_idx ON md_refills(medication_id)`,
  `CREATE INDEX IF NOT EXISTS md_interactions_drugs_idx ON md_interactions(drug_a, drug_b)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS md_interactions_pair_idx ON md_interactions(drug_a, drug_b)`,
  `CREATE INDEX IF NOT EXISTS md_measurements_type_date_idx ON md_measurements(type, measured_at)`,
  `CREATE INDEX IF NOT EXISTS md_mood_entries_recorded_idx ON md_mood_entries(recorded_at)`,
  `CREATE INDEX IF NOT EXISTS md_mood_activities_entry_idx ON md_mood_activities(mood_entry_id)`,
  `CREATE INDEX IF NOT EXISTS md_symptom_logs_symptom_date_idx ON md_symptom_logs(symptom_id, logged_at)`,
];

export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO md_settings (key, value) VALUES ('reminderTime', '08:00')`,
];
