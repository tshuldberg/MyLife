// MyMail SQLite schema - table prefix: ml_

export const CREATE_MAIL_ACCOUNTS = `
CREATE TABLE IF NOT EXISTS ml_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  server_host TEXT NOT NULL,
  server_port INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_MAIL_MESSAGES = `
CREATE TABLE IF NOT EXISTS ml_messages (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES ml_accounts(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL DEFAULT '[]',
  body TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  is_starred INTEGER NOT NULL DEFAULT 0,
  folder TEXT NOT NULL DEFAULT 'Inbox',
  received_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_MAIL_DRAFTS = `
CREATE TABLE IF NOT EXISTS ml_drafts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES ml_accounts(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  "to" TEXT NOT NULL DEFAULT '[]',
  body TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_MAIL_FOLDERS = `
CREATE TABLE IF NOT EXISTS ml_folders (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES ml_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS ml_messages_account_idx ON ml_messages(account_id)`,
  `CREATE INDEX IF NOT EXISTS ml_messages_folder_idx ON ml_messages(folder)`,
  `CREATE INDEX IF NOT EXISTS ml_messages_received_idx ON ml_messages(received_at DESC)`,
  `CREATE INDEX IF NOT EXISTS ml_messages_read_idx ON ml_messages(is_read)`,
  `CREATE INDEX IF NOT EXISTS ml_messages_starred_idx ON ml_messages(is_starred)`,
  `CREATE INDEX IF NOT EXISTS ml_messages_account_folder_idx ON ml_messages(account_id, folder)`,
  `CREATE INDEX IF NOT EXISTS ml_drafts_account_idx ON ml_drafts(account_id)`,
  `CREATE INDEX IF NOT EXISTS ml_folders_account_idx ON ml_folders(account_id)`,
];

export const ALL_TABLES = [
  CREATE_MAIL_ACCOUNTS,
  CREATE_MAIL_MESSAGES,
  CREATE_MAIL_DRAFTS,
  CREATE_MAIL_FOLDERS,
];
