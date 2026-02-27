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

// -- 6. Bank Connections --
export const CREATE_BANK_CONNECTIONS = `
CREATE TABLE IF NOT EXISTS bg_bank_connections (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL
      CHECK (provider IN ('plaid', 'mx', 'truelayer', 'tink', 'belvo', 'basiq', 'akoya', 'finicity', 'other')),
    provider_item_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    institution_id TEXT,
    institution_name TEXT,
    status TEXT NOT NULL
      CHECK (status IN ('active', 'requires_reauth', 'disconnected', 'error')),
    last_successful_sync TEXT,
    last_attempted_sync TEXT,
    error_code TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(provider, provider_item_id)
)`;

// -- 7. Bank Accounts --
export const CREATE_BANK_ACCOUNTS = `
CREATE TABLE IF NOT EXISTS bg_bank_accounts (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL REFERENCES bg_bank_connections(id) ON DELETE CASCADE,
    provider_account_id TEXT NOT NULL,
    mask TEXT,
    name TEXT NOT NULL,
    official_name TEXT,
    type TEXT NOT NULL
      CHECK (type IN ('checking', 'savings', 'credit', 'loan', 'investment', 'other')),
    subtype TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    current_balance INTEGER,
    available_balance INTEGER,
    local_account_id TEXT REFERENCES bg_accounts(id) ON DELETE SET NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(connection_id, provider_account_id)
)`;

// -- 8. Bank Transactions Raw --
export const CREATE_BANK_TRANSACTIONS_RAW = `
CREATE TABLE IF NOT EXISTS bg_bank_transactions_raw (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL REFERENCES bg_bank_connections(id) ON DELETE CASCADE,
    bank_account_id TEXT NOT NULL REFERENCES bg_bank_accounts(id) ON DELETE CASCADE,
    provider_transaction_id TEXT NOT NULL,
    pending_transaction_id TEXT,
    date_posted TEXT NOT NULL,
    date_authorized TEXT,
    payee TEXT,
    memo TEXT,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    raw_category TEXT,
    raw_json TEXT,
    is_pending INTEGER NOT NULL DEFAULT 0 CHECK (is_pending IN (0, 1)),
    synced_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(connection_id, provider_transaction_id)
)`;

// -- 9. Bank Sync State --
export const CREATE_BANK_SYNC_STATE = `
CREATE TABLE IF NOT EXISTS bg_bank_sync_state (
    connection_id TEXT PRIMARY KEY REFERENCES bg_bank_connections(id) ON DELETE CASCADE,
    cursor TEXT,
    last_webhook_cursor TEXT,
    sync_status TEXT NOT NULL DEFAULT 'idle'
      CHECK (sync_status IN ('idle', 'running', 'error')),
    last_successful_sync TEXT,
    last_attempted_sync TEXT,
    last_error TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 10. Bank Webhook Events --
export const CREATE_BANK_WEBHOOK_EVENTS = `
CREATE TABLE IF NOT EXISTS bg_bank_webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    connection_id TEXT REFERENCES bg_bank_connections(id) ON DELETE SET NULL,
    payload TEXT NOT NULL,
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'processed', 'failed', 'ignored')),
    error_message TEXT,
    UNIQUE(provider, event_id)
)`;

// -- Indexes --
export const BANK_SYNC_INDEXES = [
  `CREATE INDEX IF NOT EXISTS bg_bank_connections_status_idx ON bg_bank_connections(status)`,
  `CREATE INDEX IF NOT EXISTS bg_bank_accounts_connection_idx ON bg_bank_accounts(connection_id)`,
  `CREATE INDEX IF NOT EXISTS bg_bank_accounts_local_account_idx ON bg_bank_accounts(local_account_id)`,
  `CREATE INDEX IF NOT EXISTS bg_bank_transactions_raw_account_date_idx ON bg_bank_transactions_raw(bank_account_id, date_posted DESC)`,
  `CREATE INDEX IF NOT EXISTS bg_bank_transactions_raw_pending_idx ON bg_bank_transactions_raw(is_pending, date_posted DESC)`,
  `CREATE INDEX IF NOT EXISTS bg_bank_sync_state_status_idx ON bg_bank_sync_state(sync_status)`,
  `CREATE INDEX IF NOT EXISTS bg_bank_webhook_events_status_received_idx ON bg_bank_webhook_events(status, received_at DESC)`,
  `CREATE INDEX IF NOT EXISTS bg_bank_webhook_events_connection_idx ON bg_bank_webhook_events(connection_id)`,
];

export const CORE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS bg_envelopes_archived_idx ON bg_envelopes(archived, sort_order)`,
  `CREATE INDEX IF NOT EXISTS bg_accounts_archived_idx ON bg_accounts(archived, sort_order)`,
  `CREATE INDEX IF NOT EXISTS bg_transactions_date_idx ON bg_transactions(occurred_on DESC)`,
  `CREATE INDEX IF NOT EXISTS bg_transactions_envelope_idx ON bg_transactions(envelope_id)`,
  `CREATE INDEX IF NOT EXISTS bg_transactions_account_idx ON bg_transactions(account_id)`,
  `CREATE INDEX IF NOT EXISTS bg_transactions_direction_idx ON bg_transactions(direction)`,
  `CREATE INDEX IF NOT EXISTS bg_goals_envelope_idx ON bg_goals(envelope_id)`,
];

export const CREATE_INDEXES = [
  ...CORE_INDEXES,
  ...BANK_SYNC_INDEXES,
];

/** All table creation statements in dependency order. */
export const BANK_SYNC_TABLES = [
  CREATE_BANK_CONNECTIONS,
  CREATE_BANK_ACCOUNTS,
  CREATE_BANK_TRANSACTIONS_RAW,
  CREATE_BANK_SYNC_STATE,
  CREATE_BANK_WEBHOOK_EVENTS,
];

export const CORE_TABLES = [
  CREATE_ENVELOPES,
  CREATE_ACCOUNTS,
  CREATE_TRANSACTIONS,
  CREATE_GOALS,
  CREATE_SETTINGS,
];

export const ALL_TABLES = [
  ...CORE_TABLES,
  ...BANK_SYNC_TABLES,
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
