// MyCycle SQLite schema - table prefix: cy_

export const CREATE_CYCLES = `
CREATE TABLE IF NOT EXISTS cy_cycles (
  id TEXT PRIMARY KEY,
  start_date TEXT NOT NULL,
  end_date TEXT,
  period_end_date TEXT,
  cycle_length INTEGER,
  period_length INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_CYCLE_DAYS = `
CREATE TABLE IF NOT EXISTS cy_cycle_days (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  cycle_id TEXT REFERENCES cy_cycles(id) ON DELETE SET NULL,
  phase TEXT,
  flow_level TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SYMPTOMS = `
CREATE TABLE IF NOT EXISTS cy_symptoms (
  id TEXT PRIMARY KEY,
  cycle_day_id TEXT NOT NULL REFERENCES cy_cycle_days(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  symptom TEXT NOT NULL,
  intensity TEXT NOT NULL DEFAULT 'moderate',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS cy_cycles_start_date_idx ON cy_cycles(start_date DESC)`,
  `CREATE INDEX IF NOT EXISTS cy_cycle_days_date_idx ON cy_cycle_days(date DESC)`,
  `CREATE INDEX IF NOT EXISTS cy_cycle_days_cycle_idx ON cy_cycle_days(cycle_id)`,
  `CREATE INDEX IF NOT EXISTS cy_symptoms_day_idx ON cy_symptoms(cycle_day_id)`,
  `CREATE INDEX IF NOT EXISTS cy_symptoms_category_idx ON cy_symptoms(category)`,
];

export const ALL_TABLES = [
  CREATE_CYCLES,
  CREATE_CYCLE_DAYS,
  CREATE_SYMPTOMS,
];
