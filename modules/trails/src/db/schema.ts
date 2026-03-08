// MyTrails SQLite schema - table prefix: tr_

export const CREATE_TRAILS = `
CREATE TABLE IF NOT EXISTS tr_trails (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'moderate', 'hard', 'expert')),
  distance_meters REAL NOT NULL DEFAULT 0,
  elevation_gain_meters REAL NOT NULL DEFAULT 0,
  estimated_minutes INTEGER,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  region TEXT,
  description TEXT,
  is_saved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_RECORDINGS = `
CREATE TABLE IF NOT EXISTS tr_recordings (
  id TEXT PRIMARY KEY,
  trail_id TEXT REFERENCES tr_trails(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'hike' CHECK(activity_type IN ('hike', 'run', 'bike', 'walk')),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  distance_meters REAL NOT NULL DEFAULT 0,
  elevation_gain_meters REAL NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  gpx_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_WAYPOINTS = `
CREATE TABLE IF NOT EXISTS tr_waypoints (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL REFERENCES tr_recordings(id) ON DELETE CASCADE,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  elevation REAL,
  timestamp TEXT NOT NULL,
  accuracy REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_PHOTOS = `
CREATE TABLE IF NOT EXISTS tr_photos (
  id TEXT PRIMARY KEY,
  recording_id TEXT REFERENCES tr_recordings(id) ON DELETE SET NULL,
  trail_id TEXT REFERENCES tr_trails(id) ON DELETE SET NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  uri TEXT NOT NULL,
  caption TEXT,
  taken_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS tr_trails_name_idx ON tr_trails(name)`,
  `CREATE INDEX IF NOT EXISTS tr_trails_difficulty_idx ON tr_trails(difficulty)`,
  `CREATE INDEX IF NOT EXISTS tr_trails_region_idx ON tr_trails(region)`,
  `CREATE INDEX IF NOT EXISTS tr_trails_saved_idx ON tr_trails(is_saved)`,
  `CREATE INDEX IF NOT EXISTS tr_recordings_trail_idx ON tr_recordings(trail_id)`,
  `CREATE INDEX IF NOT EXISTS tr_recordings_started_idx ON tr_recordings(started_at DESC)`,
  `CREATE INDEX IF NOT EXISTS tr_recordings_activity_idx ON tr_recordings(activity_type)`,
  `CREATE INDEX IF NOT EXISTS tr_waypoints_recording_idx ON tr_waypoints(recording_id)`,
  `CREATE INDEX IF NOT EXISTS tr_waypoints_timestamp_idx ON tr_waypoints(timestamp)`,
  `CREATE INDEX IF NOT EXISTS tr_photos_recording_idx ON tr_photos(recording_id)`,
  `CREATE INDEX IF NOT EXISTS tr_photos_trail_idx ON tr_photos(trail_id)`,
];

export const ALL_TABLES = [
  CREATE_TRAILS,
  CREATE_RECORDINGS,
  CREATE_WAYPOINTS,
  CREATE_PHOTOS,
];
