// MyStars SQLite schema - table prefix: st_

export const CREATE_BIRTH_PROFILES = `
CREATE TABLE IF NOT EXISTS st_birth_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  birth_time TEXT,
  birth_lat REAL,
  birth_lng REAL,
  birth_place TEXT,
  sun_sign TEXT,
  moon_sign TEXT,
  rising_sign TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_TRANSITS = `
CREATE TABLE IF NOT EXISTS st_transits (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES st_birth_profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  planet TEXT NOT NULL,
  sign TEXT NOT NULL,
  aspect TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_DAILY_READINGS = `
CREATE TABLE IF NOT EXISTS st_daily_readings (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES st_birth_profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  moon_phase TEXT NOT NULL,
  moon_sign TEXT,
  summary TEXT,
  tarot_card TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(profile_id, date)
)`;

export const CREATE_SAVED_CHARTS = `
CREATE TABLE IF NOT EXISTS st_saved_charts (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES st_birth_profiles(id) ON DELETE CASCADE,
  chart_type TEXT NOT NULL,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS st_birth_profiles_name_idx ON st_birth_profiles(name)`,
  `CREATE INDEX IF NOT EXISTS st_transits_profile_idx ON st_transits(profile_id)`,
  `CREATE INDEX IF NOT EXISTS st_transits_date_idx ON st_transits(date)`,
  `CREATE INDEX IF NOT EXISTS st_transits_profile_date_idx ON st_transits(profile_id, date)`,
  `CREATE INDEX IF NOT EXISTS st_daily_readings_profile_idx ON st_daily_readings(profile_id)`,
  `CREATE INDEX IF NOT EXISTS st_daily_readings_date_idx ON st_daily_readings(date)`,
  `CREATE INDEX IF NOT EXISTS st_saved_charts_profile_idx ON st_saved_charts(profile_id)`,
];

export const ALL_TABLES = [
  CREATE_BIRTH_PROFILES,
  CREATE_TRANSITS,
  CREATE_DAILY_READINGS,
  CREATE_SAVED_CHARTS,
];
