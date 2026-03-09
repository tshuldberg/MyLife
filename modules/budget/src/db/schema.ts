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

// -- 11. Subscriptions --
export const CREATE_SUBSCRIPTIONS = `
CREATE TABLE IF NOT EXISTS bg_subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_cycle TEXT NOT NULL
      CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom')),
    custom_days INTEGER,
    status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'paused', 'cancelled', 'trial')),
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

export const SUBSCRIPTION_TABLES = [CREATE_SUBSCRIPTIONS];

export const SUBSCRIPTION_INDEXES = [
  `CREATE INDEX IF NOT EXISTS bg_subscriptions_status_idx ON bg_subscriptions(status)`,
  `CREATE INDEX IF NOT EXISTS bg_subscriptions_next_renewal_idx ON bg_subscriptions(next_renewal)`,
  `CREATE INDEX IF NOT EXISTS bg_subscriptions_catalog_idx ON bg_subscriptions(catalog_id)`,
];

// =====================================================================
// V4 Tables — YNAB-style budget engine, reporting, alerts, multi-currency
// =====================================================================

// -- 12. Category Groups --
export const CREATE_CATEGORY_GROUPS = `
CREATE TABLE IF NOT EXISTS bg_category_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_hidden INTEGER NOT NULL DEFAULT 0 CHECK (is_hidden IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 13. Budget Allocations (per-envelope per-month) --
export const CREATE_BUDGET_ALLOCATIONS = `
CREATE TABLE IF NOT EXISTS bg_budget_allocations (
    id TEXT PRIMARY KEY,
    envelope_id TEXT NOT NULL REFERENCES bg_envelopes(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    allocated INTEGER NOT NULL DEFAULT 0,
    UNIQUE(envelope_id, month)
)`;

// -- 14. Transaction Splits --
export const CREATE_TRANSACTION_SPLITS = `
CREATE TABLE IF NOT EXISTS bg_transaction_splits (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL REFERENCES bg_transactions(id) ON DELETE CASCADE,
    envelope_id TEXT REFERENCES bg_envelopes(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    memo TEXT
)`;

// -- 15. Recurring Templates --
export const CREATE_RECURRING_TEMPLATES = `
CREATE TABLE IF NOT EXISTS bg_recurring_templates (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES bg_accounts(id) ON DELETE CASCADE,
    envelope_id TEXT REFERENCES bg_envelopes(id) ON DELETE SET NULL,
    payee TEXT NOT NULL,
    amount INTEGER NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
    start_date TEXT NOT NULL,
    end_date TEXT,
    next_date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    subscription_id TEXT REFERENCES bg_subscriptions(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 16. Payee Cache --
export const CREATE_PAYEE_CACHE = `
CREATE TABLE IF NOT EXISTS bg_payee_cache (
    payee TEXT PRIMARY KEY NOT NULL,
    last_envelope_id TEXT REFERENCES bg_envelopes(id) ON DELETE SET NULL,
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 17. CSV Import Profiles --
export const CREATE_CSV_PROFILES = `
CREATE TABLE IF NOT EXISTS bg_csv_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date_column INTEGER NOT NULL,
    payee_column INTEGER NOT NULL,
    amount_column INTEGER NOT NULL,
    memo_column INTEGER,
    date_format TEXT NOT NULL,
    amount_sign TEXT NOT NULL CHECK (amount_sign IN ('negative_is_outflow', 'positive_is_outflow', 'separate_columns')),
    debit_column INTEGER,
    credit_column INTEGER,
    skip_rows INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 18. Price History --
export const CREATE_PRICE_HISTORY = `
CREATE TABLE IF NOT EXISTS bg_price_history (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL REFERENCES bg_subscriptions(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    effective_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 19. Notification Log --
export const CREATE_NOTIFICATION_LOG = `
CREATE TABLE IF NOT EXISTS bg_notification_log (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL REFERENCES bg_subscriptions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('renewal', 'trial_expiry', 'monthly_summary')),
    scheduled_for TEXT NOT NULL,
    sent_at TEXT,
    UNIQUE(subscription_id, type, scheduled_for)
)`;

// -- 20. Transaction Rules --
export const CREATE_TRANSACTION_RULES = `
CREATE TABLE IF NOT EXISTS bg_transaction_rules (
    id TEXT PRIMARY KEY,
    payee_pattern TEXT NOT NULL,
    match_type TEXT NOT NULL CHECK (match_type IN ('contains', 'exact', 'starts_with')),
    envelope_id TEXT NOT NULL REFERENCES bg_envelopes(id) ON DELETE CASCADE,
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 21. Net Worth Snapshots --
export const CREATE_NET_WORTH_SNAPSHOTS = `
CREATE TABLE IF NOT EXISTS bg_net_worth_snapshots (
    id TEXT PRIMARY KEY,
    month TEXT NOT NULL,
    assets INTEGER NOT NULL DEFAULT 0,
    liabilities INTEGER NOT NULL DEFAULT 0,
    net_worth INTEGER NOT NULL DEFAULT 0,
    account_balances TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(month)
)`;

// -- 22. Debt Payoff Plans --
export const CREATE_DEBT_PAYOFF_PLANS = `
CREATE TABLE IF NOT EXISTS bg_debt_payoff_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    strategy TEXT NOT NULL CHECK (strategy IN ('snowball', 'avalanche')),
    extra_payment INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 23. Debt Payoff Debts --
export const CREATE_DEBT_PAYOFF_DEBTS = `
CREATE TABLE IF NOT EXISTS bg_debt_payoff_debts (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES bg_debt_payoff_plans(id) ON DELETE CASCADE,
    account_id TEXT REFERENCES bg_accounts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    balance INTEGER NOT NULL,
    interest_rate INTEGER NOT NULL DEFAULT 0,
    minimum_payment INTEGER NOT NULL DEFAULT 0,
    compounding TEXT NOT NULL DEFAULT 'monthly' CHECK (compounding IN ('monthly', 'daily')),
    sort_order INTEGER NOT NULL DEFAULT 0
)`;

// -- 24. Budget Rollovers --
export const CREATE_BUDGET_ROLLOVERS = `
CREATE TABLE IF NOT EXISTS bg_budget_rollovers (
    id TEXT PRIMARY KEY,
    envelope_id TEXT NOT NULL REFERENCES bg_envelopes(id) ON DELETE CASCADE,
    from_month TEXT NOT NULL,
    to_month TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(envelope_id, from_month)
)`;

// -- 25. Budget Alerts --
export const CREATE_BUDGET_ALERTS = `
CREATE TABLE IF NOT EXISTS bg_budget_alerts (
    id TEXT PRIMARY KEY,
    envelope_id TEXT NOT NULL REFERENCES bg_envelopes(id) ON DELETE CASCADE,
    threshold_pct INTEGER NOT NULL DEFAULT 80,
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(envelope_id, threshold_pct)
)`;

// -- 26. Alert History --
export const CREATE_ALERT_HISTORY = `
CREATE TABLE IF NOT EXISTS bg_alert_history (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL REFERENCES bg_budget_alerts(id) ON DELETE CASCADE,
    envelope_id TEXT NOT NULL,
    month TEXT NOT NULL,
    threshold_pct INTEGER NOT NULL,
    spent_pct INTEGER NOT NULL,
    amount_spent INTEGER NOT NULL,
    target_amount INTEGER NOT NULL,
    notified_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(alert_id, month)
)`;

// -- 27. Currencies --
export const CREATE_CURRENCIES = `
CREATE TABLE IF NOT EXISTS bg_currencies (
    code TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL DEFAULT '',
    decimal_places INTEGER NOT NULL DEFAULT 2,
    is_base INTEGER NOT NULL DEFAULT 0 CHECK (is_base IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 28. Exchange Rates --
export const CREATE_EXCHANGE_RATES = `
CREATE TABLE IF NOT EXISTS bg_exchange_rates (
    id TEXT PRIMARY KEY,
    from_currency TEXT NOT NULL REFERENCES bg_currencies(code) ON DELETE CASCADE,
    to_currency TEXT NOT NULL REFERENCES bg_currencies(code) ON DELETE CASCADE,
    rate INTEGER NOT NULL,
    rate_decimal TEXT NOT NULL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(from_currency, to_currency)
)`;

// -- 29. Shared Envelopes (future: household sharing) --
export const CREATE_SHARED_ENVELOPES = `
CREATE TABLE IF NOT EXISTS bg_shared_envelopes (
    id TEXT PRIMARY KEY,
    envelope_id TEXT NOT NULL REFERENCES bg_envelopes(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    partner_device_id TEXT,
    sharing_mode TEXT NOT NULL DEFAULT 'joint' CHECK (sharing_mode IN ('joint', 'split')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(envelope_id)
)`;

// -- V4 Table and Index Groups --
export const V4_BUDGET_ENGINE_TABLES = [
  CREATE_CATEGORY_GROUPS,
  CREATE_BUDGET_ALLOCATIONS,
  CREATE_TRANSACTION_SPLITS,
  CREATE_RECURRING_TEMPLATES,
  CREATE_PAYEE_CACHE,
  CREATE_CSV_PROFILES,
  CREATE_PRICE_HISTORY,
  CREATE_NOTIFICATION_LOG,
];

export const V4_RULES_GOALS_TABLES = [
  CREATE_TRANSACTION_RULES,
];

export const V4_REPORTING_TABLES = [
  CREATE_NET_WORTH_SNAPSHOTS,
  CREATE_DEBT_PAYOFF_PLANS,
  CREATE_DEBT_PAYOFF_DEBTS,
  CREATE_BUDGET_ROLLOVERS,
  CREATE_BUDGET_ALERTS,
  CREATE_ALERT_HISTORY,
  CREATE_CURRENCIES,
  CREATE_EXCHANGE_RATES,
  CREATE_SHARED_ENVELOPES,
];

export const V4_ALL_TABLES = [
  ...V4_BUDGET_ENGINE_TABLES,
  ...V4_RULES_GOALS_TABLES,
  ...V4_REPORTING_TABLES,
];

export const V4_INDEXES = [
  // Category groups
  `CREATE INDEX IF NOT EXISTS bg_category_groups_sort_idx ON bg_category_groups(sort_order)`,
  // Budget allocations
  `CREATE INDEX IF NOT EXISTS bg_budget_allocations_envelope_month_idx ON bg_budget_allocations(envelope_id, month)`,
  // Transaction splits
  `CREATE INDEX IF NOT EXISTS bg_transaction_splits_txn_idx ON bg_transaction_splits(transaction_id)`,
  `CREATE INDEX IF NOT EXISTS bg_transaction_splits_envelope_idx ON bg_transaction_splits(envelope_id)`,
  // Recurring templates
  `CREATE INDEX IF NOT EXISTS bg_recurring_templates_account_idx ON bg_recurring_templates(account_id)`,
  `CREATE INDEX IF NOT EXISTS bg_recurring_templates_next_date_idx ON bg_recurring_templates(next_date)`,
  `CREATE INDEX IF NOT EXISTS bg_recurring_templates_subscription_idx ON bg_recurring_templates(subscription_id)`,
  // Payee cache
  `CREATE INDEX IF NOT EXISTS bg_payee_cache_use_count_idx ON bg_payee_cache(use_count DESC)`,
  // Price history
  `CREATE INDEX IF NOT EXISTS bg_price_history_subscription_idx ON bg_price_history(subscription_id)`,
  // Notification log
  `CREATE INDEX IF NOT EXISTS bg_notification_log_subscription_idx ON bg_notification_log(subscription_id)`,
  `CREATE INDEX IF NOT EXISTS bg_notification_log_scheduled_idx ON bg_notification_log(scheduled_for)`,
  // Transaction rules
  `CREATE INDEX IF NOT EXISTS bg_transaction_rules_enabled_idx ON bg_transaction_rules(is_enabled, priority)`,
  `CREATE INDEX IF NOT EXISTS bg_transaction_rules_envelope_idx ON bg_transaction_rules(envelope_id)`,
  // Net worth
  `CREATE INDEX IF NOT EXISTS bg_net_worth_snapshots_month_idx ON bg_net_worth_snapshots(month)`,
  // Debt payoff
  `CREATE INDEX IF NOT EXISTS bg_debt_payoff_debts_plan_idx ON bg_debt_payoff_debts(plan_id)`,
  // Budget rollovers
  `CREATE INDEX IF NOT EXISTS bg_budget_rollovers_envelope_month_idx ON bg_budget_rollovers(envelope_id, from_month)`,
  // Budget alerts
  `CREATE INDEX IF NOT EXISTS bg_budget_alerts_envelope_idx ON bg_budget_alerts(envelope_id)`,
  `CREATE INDEX IF NOT EXISTS bg_alert_history_alert_idx ON bg_alert_history(alert_id)`,
  `CREATE INDEX IF NOT EXISTS bg_alert_history_month_idx ON bg_alert_history(month)`,
  // Exchange rates
  `CREATE INDEX IF NOT EXISTS bg_exchange_rates_pair_idx ON bg_exchange_rates(from_currency, to_currency)`,
  // Shared envelopes
  `CREATE INDEX IF NOT EXISTS bg_shared_envelopes_envelope_idx ON bg_shared_envelopes(envelope_id)`,
];

/** ALTER TABLE statements for V4 — add columns to existing tables. */
export const V4_ALTER_STATEMENTS = [
  // Add group_id to envelopes for YNAB-style grouping
  `ALTER TABLE bg_envelopes ADD COLUMN group_id TEXT REFERENCES bg_category_groups(id)`,
  // Add envelope linkage to subscriptions
  `ALTER TABLE bg_subscriptions ADD COLUMN envelope_id TEXT REFERENCES bg_envelopes(id)`,
  // Add cleared/transfer tracking to transactions
  `ALTER TABLE bg_transactions ADD COLUMN is_cleared INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE bg_transactions ADD COLUMN is_transfer INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE bg_transactions ADD COLUMN transfer_id TEXT`,
  // Add payee column to transactions (standalone uses payee, hub uses merchant — add alias)
  `ALTER TABLE bg_transactions ADD COLUMN payee TEXT`,
];

export const ALL_TABLES = [
  ...CORE_TABLES,
  ...BANK_SYNC_TABLES,
  ...SUBSCRIPTION_TABLES,
  ...V4_ALL_TABLES,
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
