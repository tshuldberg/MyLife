export const DEFAULT_FLASH_DECK_ID = 'fl_deck_default';

export const CREATE_DECKS = `
CREATE TABLE IF NOT EXISTS fl_decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT REFERENCES fl_decks(id) ON DELETE SET NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_CARDS = `
CREATE TABLE IF NOT EXISTS fl_cards (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  deck_id TEXT NOT NULL REFERENCES fl_decks(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL,
  template_ordinal INTEGER NOT NULL DEFAULT 0,
  front TEXT NOT NULL,
  back TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  queue TEXT NOT NULL DEFAULT 'new',
  interval_days REAL NOT NULL DEFAULT 0,
  ease REAL NOT NULL DEFAULT 2.5,
  due_at TEXT,
  last_review_at TEXT,
  review_count INTEGER NOT NULL DEFAULT 0,
  lapse_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_REVIEW_LOGS = `
CREATE TABLE IF NOT EXISTS fl_review_logs (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES fl_cards(id) ON DELETE CASCADE,
  rating TEXT NOT NULL,
  scheduled_before_at TEXT,
  scheduled_after_at TEXT,
  reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS fl_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`;

export const CREATE_EXPORT_RECORDS = `
CREATE TABLE IF NOT EXISTS fl_export_records (
  id TEXT PRIMARY KEY,
  deck_id TEXT REFERENCES fl_decks(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  cards_exported INTEGER NOT NULL DEFAULT 0,
  media_exported INTEGER NOT NULL DEFAULT 0,
  include_scheduling INTEGER NOT NULL DEFAULT 1,
  include_media INTEGER NOT NULL DEFAULT 0,
  include_tags INTEGER NOT NULL DEFAULT 1,
  exported_at TEXT NOT NULL DEFAULT (datetime('now')),
  duration_ms INTEGER NOT NULL DEFAULT 0
)`;

export const BASE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS fl_cards_deck_idx ON fl_cards(deck_id, queue, due_at)`,
  `CREATE INDEX IF NOT EXISTS fl_cards_note_idx ON fl_cards(note_id)`,
  `CREATE INDEX IF NOT EXISTS fl_review_logs_card_idx ON fl_review_logs(card_id, reviewed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS fl_review_logs_date_idx ON fl_review_logs(reviewed_at DESC)`,
];

export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO fl_settings (key, value) VALUES ('dailyNewLimit', '20')`,
  `INSERT OR IGNORE INTO fl_settings (key, value) VALUES ('dailyReviewLimit', '200')`,
  `INSERT OR IGNORE INTO fl_settings (key, value) VALUES ('dailyStudyTarget', '1')`,
];

export const EXPANDED_SETTINGS = [
  `INSERT OR IGNORE INTO fl_settings (key, value) VALUES ('autoBurySiblings', '1')`,
  `INSERT OR IGNORE INTO fl_settings (key, value) VALUES ('dailyReminderEnabled', '0')`,
  `INSERT OR IGNORE INTO fl_settings (key, value) VALUES ('dailyReminderTime', '09:00')`,
  `INSERT OR IGNORE INTO fl_settings (key, value) VALUES ('desiredRetention', '0.90')`,
  `INSERT OR IGNORE INTO fl_settings (key, value) VALUES ('leechThreshold', '8')`,
];

export const DEFAULT_DECK_SEED = `
INSERT OR IGNORE INTO fl_decks (id, name, description, parent_id, is_default, created_at, updated_at)
VALUES ('${DEFAULT_FLASH_DECK_ID}', 'Default', 'Default study deck', NULL, 1, datetime('now'), datetime('now'))`;

export const BASE_TABLES = [
  CREATE_DECKS,
  CREATE_CARDS,
  CREATE_REVIEW_LOGS,
  CREATE_SETTINGS,
];

export const V2_UP = [
  `ALTER TABLE fl_cards ADD COLUMN queue_before_suspend TEXT`,
  `ALTER TABLE fl_cards ADD COLUMN queue_before_bury TEXT`,
  `ALTER TABLE fl_cards ADD COLUMN buried_until TEXT`,
  CREATE_EXPORT_RECORDS,
  `CREATE INDEX IF NOT EXISTS fl_cards_queue_idx ON fl_cards(queue, due_at)`,
  `CREATE INDEX IF NOT EXISTS fl_cards_buried_until_idx ON fl_cards(buried_until)`,
  `CREATE INDEX IF NOT EXISTS fl_export_records_date_idx ON fl_export_records(exported_at DESC)`,
  ...EXPANDED_SETTINGS,
];
