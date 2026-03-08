export const CREATE_ENTRIES = `
CREATE TABLE IF NOT EXISTS jn_entries (
  id TEXT PRIMARY KEY,
  entry_date TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  mood TEXT,
  image_uris_json TEXT NOT NULL DEFAULT '[]',
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_TAGS = `
CREATE TABLE IF NOT EXISTS jn_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_ENTRY_TAGS = `
CREATE TABLE IF NOT EXISTS jn_entry_tags (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES jn_entries(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES jn_tags(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(entry_id, tag_id)
)`;

export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS jn_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS jn_entries_date_idx ON jn_entries(entry_date DESC, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS jn_entries_mood_idx ON jn_entries(mood, entry_date DESC)`,
  `CREATE INDEX IF NOT EXISTS jn_entry_tags_entry_idx ON jn_entry_tags(entry_id)`,
  `CREATE INDEX IF NOT EXISTS jn_entry_tags_tag_idx ON jn_entry_tags(tag_id)`,
];

export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO jn_settings (key, value) VALUES ('editorMode', 'markdown')`,
  `INSERT OR IGNORE INTO jn_settings (key, value) VALUES ('dailyPromptEnabled', 'false')`,
];

export const ALL_TABLES = [
  CREATE_ENTRIES,
  CREATE_TAGS,
  CREATE_ENTRY_TAGS,
  CREATE_SETTINGS,
];
