// MyVoice SQLite schema - table prefix: vc_

export const CREATE_TRANSCRIPTIONS = `
CREATE TABLE IF NOT EXISTS vc_transcriptions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  duration_seconds REAL NOT NULL,
  language TEXT,
  confidence REAL,
  audio_uri TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_VOICE_NOTES = `
CREATE TABLE IF NOT EXISTS vc_voice_notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  transcription_id TEXT REFERENCES vc_transcriptions(id) ON DELETE SET NULL,
  tags TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_VOICE_SETTINGS = `
CREATE TABLE IF NOT EXISTS vc_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS vc_transcriptions_created_idx ON vc_transcriptions(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS vc_transcriptions_language_idx ON vc_transcriptions(language)`,
  `CREATE INDEX IF NOT EXISTS vc_voice_notes_created_idx ON vc_voice_notes(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS vc_voice_notes_favorite_idx ON vc_voice_notes(is_favorite)`,
  `CREATE INDEX IF NOT EXISTS vc_voice_notes_transcription_idx ON vc_voice_notes(transcription_id)`,
];

export const ALL_TABLES = [
  CREATE_TRANSCRIPTIONS,
  CREATE_VOICE_NOTES,
  CREATE_VOICE_SETTINGS,
];
