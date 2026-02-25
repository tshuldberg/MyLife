/**
 * SQLite schema for MySubs module.
 * All table names use the sb_ prefix to avoid collisions in the shared hub database.
 *
 * All currency amounts stored as integer cents.
 * Dates stored as TEXT in YYYY-MM-DD or ISO datetime format.
 */

// -- 1. Subscriptions --
export const CREATE_SUBSCRIPTIONS = `
CREATE TABLE IF NOT EXISTS sb_subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_cycle TEXT NOT NULL,
    custom_days INTEGER,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    start_date TEXT NOT NULL,
    next_renewal TEXT NOT NULL,
    trial_end_date TEXT,
    cancelled_date TEXT,
    notes TEXT,
    url TEXT,
    icon TEXT,
    color TEXT,
    notify_days INTEGER NOT NULL DEFAULT 1,
    catalog_id TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 2. Price History --
export const CREATE_PRICE_HISTORY = `
CREATE TABLE IF NOT EXISTS sb_price_history (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL REFERENCES sb_subscriptions(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    effective_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 3. Settings --
export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS sb_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
)`;

// -- Indexes --
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS sb_subs_status_idx ON sb_subscriptions(status)`,
  `CREATE INDEX IF NOT EXISTS sb_subs_category_idx ON sb_subscriptions(category)`,
  `CREATE INDEX IF NOT EXISTS sb_subs_renewal_idx ON sb_subscriptions(next_renewal)`,
  `CREATE INDEX IF NOT EXISTS sb_subs_sort_idx ON sb_subscriptions(sort_order)`,
  `CREATE INDEX IF NOT EXISTS sb_price_sub_idx ON sb_price_history(subscription_id)`,
  `CREATE INDEX IF NOT EXISTS sb_price_date_idx ON sb_price_history(effective_date)`,
];

/** All table creation statements in dependency order */
export const ALL_TABLES = [
  CREATE_SUBSCRIPTIONS,
  CREATE_PRICE_HISTORY,
  CREATE_SETTINGS,
];

/** Seed SQL for default settings */
export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO sb_settings (key, value) VALUES ('currency', 'USD')`,
  `INSERT OR IGNORE INTO sb_settings (key, value) VALUES ('defaultNotifyDays', '1')`,
];
