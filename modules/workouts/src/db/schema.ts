// Legacy tables (v1) retained for backward compatibility with prior hub releases.
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

export const CREATE_EXERCISES = `
CREATE TABLE IF NOT EXISTS wk_exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  muscle_groups_json TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  video_url TEXT,
  thumbnail_url TEXT,
  audio_cues_json TEXT NOT NULL DEFAULT '[]',
  default_sets INTEGER NOT NULL DEFAULT 3,
  default_reps INTEGER,
  default_duration INTEGER,
  is_premium INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_WORKOUTS = `
CREATE TABLE IF NOT EXISTS wk_workouts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  exercises_json TEXT NOT NULL DEFAULT '[]',
  estimated_duration INTEGER NOT NULL DEFAULT 0,
  is_premium INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_WORKOUT_SESSIONS = `
CREATE TABLE IF NOT EXISTS wk_workout_sessions (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES wk_workouts(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  exercises_completed_json TEXT NOT NULL DEFAULT '[]',
  voice_commands_used_json TEXT NOT NULL DEFAULT '[]',
  pace_adjustments_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_FORM_RECORDINGS = `
CREATE TABLE IF NOT EXISTS wk_form_recordings (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES wk_workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  timestamp_start REAL NOT NULL,
  timestamp_end REAL NOT NULL,
  coach_feedback_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS wk_workout_logs_focus_idx ON wk_workout_logs(focus)`,
  `CREATE INDEX IF NOT EXISTS wk_workout_logs_completed_idx ON wk_workout_logs(completed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS wk_programs_active_idx ON wk_programs(is_active)`,
  `CREATE INDEX IF NOT EXISTS wk_exercises_category_idx ON wk_exercises(category)`,
  `CREATE INDEX IF NOT EXISTS wk_exercises_difficulty_idx ON wk_exercises(difficulty)`,
  `CREATE INDEX IF NOT EXISTS wk_workouts_created_idx ON wk_workouts(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS wk_workout_sessions_workout_idx ON wk_workout_sessions(workout_id)`,
  `CREATE INDEX IF NOT EXISTS wk_workout_sessions_completed_idx ON wk_workout_sessions(completed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS wk_form_recordings_session_idx ON wk_form_recordings(session_id)`,
];

export const ALL_TABLES = [
  CREATE_WORKOUT_LOGS,
  CREATE_WORKOUT_PROGRAMS,
  CREATE_EXERCISES,
  CREATE_WORKOUTS,
  CREATE_WORKOUT_SESSIONS,
  CREATE_FORM_RECORDINGS,
];
