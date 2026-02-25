export const CREATE_SPOTS = `
CREATE TABLE IF NOT EXISTS sf_spots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  break_type TEXT NOT NULL DEFAULT 'beach',
  wave_height_ft REAL NOT NULL DEFAULT 0,
  wind_kts REAL NOT NULL DEFAULT 0,
  tide TEXT NOT NULL DEFAULT 'mid',
  swell_direction TEXT NOT NULL DEFAULT 'W',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SESSIONS = `
CREATE TABLE IF NOT EXISTS sf_sessions (
  id TEXT PRIMARY KEY,
  spot_id TEXT NOT NULL REFERENCES sf_spots(id) ON DELETE CASCADE,
  session_date TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS sf_spots_region_idx ON sf_spots(region)`,
  `CREATE INDEX IF NOT EXISTS sf_spots_favorite_idx ON sf_spots(is_favorite)`,
  `CREATE INDEX IF NOT EXISTS sf_sessions_spot_idx ON sf_sessions(spot_id)`,
  `CREATE INDEX IF NOT EXISTS sf_sessions_date_idx ON sf_sessions(session_date DESC)`,
];

export const ALL_TABLES = [CREATE_SPOTS, CREATE_SESSIONS];
