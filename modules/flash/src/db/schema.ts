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

export const CREATE_INDEXES = [
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

export const DEFAULT_DECK_SEED = `
INSERT OR IGNORE INTO fl_decks (id, name, description, parent_id, is_default, created_at, updated_at)
VALUES ('${DEFAULT_FLASH_DECK_ID}', 'Default', 'Default study deck', NULL, 1, datetime('now'), datetime('now'))`;

export const ALL_TABLES = [
  CREATE_DECKS,
  CREATE_CARDS,
  CREATE_REVIEW_LOGS,
  CREATE_SETTINGS,
];
