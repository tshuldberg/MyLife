/**
 * SQLite schema for MyBudget module.
 * All table names use the bg_ prefix to avoid collisions in the shared hub database.
 *
 * Currency values are stored as integer cents.
 * Dates are stored as TEXT (YYYY-MM-DD or ISO datetime).
 * Booleans are stored as INTEGER (0/1).
 */

// -- 1. Envelopes --
export const CREATE_ENVELOPES = `
CREATE TABLE IF NOT EXISTS bg_envelopes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    monthly_budget INTEGER NOT NULL DEFAULT 0 CHECK (monthly_budget >= 0),
    rollover_enabled INTEGER NOT NULL DEFAULT 1 CHECK (rollover_enabled IN (0, 1)),
    archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 2. Accounts --
export const CREATE_ACCOUNTS = `
CREATE TABLE IF NOT EXISTS bg_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'checking'
      CHECK (type IN ('cash', 'checking', 'savings', 'credit', 'other')),
    current_balance INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 3. Transactions --
export const CREATE_TRANSACTIONS = `
CREATE TABLE IF NOT EXISTS bg_transactions (
    id TEXT PRIMARY KEY,
    envelope_id TEXT REFERENCES bg_envelopes(id) ON DELETE SET NULL,
    account_id TEXT REFERENCES bg_accounts(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inflow', 'outflow', 'transfer')),
    merchant TEXT,
    note TEXT,
    occurred_on TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 4. Savings Goals --
export const CREATE_GOALS = `
CREATE TABLE IF NOT EXISTS bg_goals (
    id TEXT PRIMARY KEY,
    envelope_id TEXT NOT NULL REFERENCES bg_envelopes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL CHECK (target_amount >= 0),
    target_date TEXT,
    completed_amount INTEGER NOT NULL DEFAULT 0 CHECK (completed_amount >= 0),
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 5. Settings --
export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS bg_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
)`;

// -- Indexes --
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS bg_envelopes_archived_idx ON bg_envelopes(archived, sort_order)`,
  `CREATE INDEX IF NOT EXISTS bg_accounts_archived_idx ON bg_accounts(archived, sort_order)`,
  `CREATE INDEX IF NOT EXISTS bg_transactions_date_idx ON bg_transactions(occurred_on DESC)`,
  `CREATE INDEX IF NOT EXISTS bg_transactions_envelope_idx ON bg_transactions(envelope_id)`,
  `CREATE INDEX IF NOT EXISTS bg_transactions_account_idx ON bg_transactions(account_id)`,
  `CREATE INDEX IF NOT EXISTS bg_transactions_direction_idx ON bg_transactions(direction)`,
  `CREATE INDEX IF NOT EXISTS bg_goals_envelope_idx ON bg_goals(envelope_id)`,
];

/** All table creation statements in dependency order. */
export const ALL_TABLES = [
  CREATE_ENVELOPES,
  CREATE_ACCOUNTS,
  CREATE_TRANSACTIONS,
  CREATE_GOALS,
  CREATE_SETTINGS,
];

/** Seed SQL for default settings. */
export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO bg_settings (key, value) VALUES ('currency', 'USD')`,
  `INSERT OR IGNORE INTO bg_settings (key, value) VALUES ('monthStartDay', '1')`,
  `INSERT OR IGNORE INTO bg_settings (key, value) VALUES ('quickAddAmounts', '1000,2500,5000')`,
];

/** Seed SQL for starter accounts. */
export const SEED_DEFAULT_ACCOUNTS = [
  `INSERT OR IGNORE INTO bg_accounts (id, name, type, current_balance, sort_order) VALUES ('acct-checking', 'Checking', 'checking', 0, 0)`,
  `INSERT OR IGNORE INTO bg_accounts (id, name, type, current_balance, sort_order) VALUES ('acct-cash', 'Cash', 'cash', 0, 1)`,
];

/** Seed SQL for starter envelopes. */
export const SEED_DEFAULT_ENVELOPES = [
  `INSERT OR IGNORE INTO bg_envelopes (id, name, icon, monthly_budget, sort_order) VALUES ('env-rent', 'Rent', '🏠', 0, 0)`,
  `INSERT OR IGNORE INTO bg_envelopes (id, name, icon, monthly_budget, sort_order) VALUES ('env-groceries', 'Groceries', '🛒', 0, 1)`,
  `INSERT OR IGNORE INTO bg_envelopes (id, name, icon, monthly_budget, sort_order) VALUES ('env-transport', 'Transport', '⛽', 0, 2)`,
  `INSERT OR IGNORE INTO bg_envelopes (id, name, icon, monthly_budget, sort_order) VALUES ('env-fun', 'Fun', '🎉', 0, 3)`,
];

