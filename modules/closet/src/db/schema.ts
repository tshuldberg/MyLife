export const CREATE_ITEMS = `
CREATE TABLE IF NOT EXISTS cl_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT,
  brand TEXT,
  purchase_price_cents INTEGER,
  purchase_date TEXT,
  image_uri TEXT,
  seasons_json TEXT NOT NULL DEFAULT '[]',
  occasions_json TEXT NOT NULL DEFAULT '[]',
  condition TEXT NOT NULL DEFAULT 'good',
  status TEXT NOT NULL DEFAULT 'active',
  laundry_status TEXT NOT NULL DEFAULT 'clean',
  times_worn INTEGER NOT NULL DEFAULT 0,
  last_worn_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_OUTFITS = `
CREATE TABLE IF NOT EXISTS cl_outfits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  occasion TEXT,
  season TEXT,
  image_uri TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_OUTFIT_ITEMS = `
CREATE TABLE IF NOT EXISTS cl_outfit_items (
  id TEXT PRIMARY KEY,
  outfit_id TEXT NOT NULL REFERENCES cl_outfits(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES cl_items(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(outfit_id, item_id)
)`;

export const CREATE_WEAR_LOGS = `
CREATE TABLE IF NOT EXISTS cl_wear_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  outfit_id TEXT REFERENCES cl_outfits(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_WEAR_LOG_ITEMS = `
CREATE TABLE IF NOT EXISTS cl_wear_log_items (
  id TEXT PRIMARY KEY,
  wear_log_id TEXT NOT NULL REFERENCES cl_wear_logs(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES cl_items(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(wear_log_id, item_id)
)`;

export const CREATE_TAGS = `
CREATE TABLE IF NOT EXISTS cl_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_ITEM_TAGS = `
CREATE TABLE IF NOT EXISTS cl_item_tags (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES cl_items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES cl_tags(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(item_id, tag_id)
)`;

export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS cl_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS cl_items_category_idx ON cl_items(category, status)`,
  `CREATE INDEX IF NOT EXISTS cl_items_last_worn_idx ON cl_items(last_worn_date, status)`,
  `CREATE INDEX IF NOT EXISTS cl_outfit_items_outfit_idx ON cl_outfit_items(outfit_id)`,
  `CREATE INDEX IF NOT EXISTS cl_wear_logs_date_idx ON cl_wear_logs(date DESC)`,
  `CREATE INDEX IF NOT EXISTS cl_wear_log_items_log_idx ON cl_wear_log_items(wear_log_id)`,
  `CREATE INDEX IF NOT EXISTS cl_item_tags_item_idx ON cl_item_tags(item_id)`,
  `CREATE INDEX IF NOT EXISTS cl_item_tags_tag_idx ON cl_item_tags(tag_id)`,
];

export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO cl_settings (key, value) VALUES ('donationThresholdDays', '365')`,
];

export const ALL_TABLES = [
  CREATE_ITEMS,
  CREATE_OUTFITS,
  CREATE_OUTFIT_ITEMS,
  CREATE_WEAR_LOGS,
  CREATE_WEAR_LOG_ITEMS,
  CREATE_TAGS,
  CREATE_ITEM_TAGS,
  CREATE_SETTINGS,
];
