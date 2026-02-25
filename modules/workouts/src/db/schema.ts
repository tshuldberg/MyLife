export const CREATE_WORKOUT_LOGS = `
CREATE TABLE IF NOT EXISTS wk_workout_logs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  focus TEXT NOT NULL DEFAULT 'full_body',
  duration_min INTEGER NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  rpe INTEGER NOT NULL DEFAULT 7,
  completed_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_WORKOUT_PROGRAMS = `
CREATE TABLE IF NOT EXISTS wk_programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  weeks INTEGER NOT NULL,
  sessions_per_week INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS wk_workout_logs_focus_idx ON wk_workout_logs(focus)`,
  `CREATE INDEX IF NOT EXISTS wk_workout_logs_completed_idx ON wk_workout_logs(completed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS wk_programs_active_idx ON wk_programs(is_active)`,
];

export const ALL_TABLES = [CREATE_WORKOUT_LOGS, CREATE_WORKOUT_PROGRAMS];
