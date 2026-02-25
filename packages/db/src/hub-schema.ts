/**
 * Hub-level SQLite schema.
 *
 * These tables are always created in the hub database and manage
 * module enablement, user preferences, subscription state, and
 * per-module schema versioning.
 */

export const CREATE_HUB_ENABLED_MODULES = `
CREATE TABLE IF NOT EXISTS hub_enabled_modules (
  module_id TEXT PRIMARY KEY NOT NULL,
  enabled_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_HUB_PREFERENCES = `
CREATE TABLE IF NOT EXISTS hub_preferences (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);`;

export const CREATE_HUB_AGGREGATE_EVENT_COUNTERS = `
CREATE TABLE IF NOT EXISTS hub_aggregate_event_counters (
  event_key TEXT NOT NULL,
  bucket_date TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_key, bucket_date)
);`;

export const CREATE_HUB_SUBSCRIPTION = `
CREATE TABLE IF NOT EXISTS hub_subscription (
  id TEXT PRIMARY KEY NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  provider TEXT CHECK (provider IN ('revenueCat', 'stripe')),
  external_id TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_HUB_MODE = `
CREATE TABLE IF NOT EXISTS hub_mode (
  id TEXT PRIMARY KEY NOT NULL CHECK (id = 'current'),
  mode TEXT NOT NULL CHECK (mode IN ('hosted', 'self_host', 'local_only')),
  server_url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_HUB_ENTITLEMENTS = `
CREATE TABLE IF NOT EXISTS hub_entitlements (
  id TEXT PRIMARY KEY NOT NULL CHECK (id = 'current'),
  raw_token TEXT NOT NULL,
  app_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('hosted', 'self_host', 'local_only')),
  hosted_active INTEGER NOT NULL DEFAULT 0,
  self_host_license INTEGER NOT NULL DEFAULT 0,
  update_pack_year INTEGER,
  features_json TEXT NOT NULL DEFAULT '[]',
  issued_at TEXT NOT NULL,
  expires_at TEXT,
  signature TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_HUB_FRIEND_PROFILES = `
CREATE TABLE IF NOT EXISTS hub_friend_profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  handle TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_HUB_FRIEND_INVITES = `
CREATE TABLE IF NOT EXISTS hub_friend_invites (
  id TEXT PRIMARY KEY NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'declined')),
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  responded_at TEXT
);`;

export const CREATE_HUB_FRIENDSHIPS = `
CREATE TABLE IF NOT EXISTS hub_friendships (
  user_id TEXT NOT NULL,
  friend_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('accepted', 'blocked')),
  source_invite_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, friend_user_id)
);`;

export const CREATE_HUB_FRIEND_MESSAGES = `
CREATE TABLE IF NOT EXISTS hub_friend_messages (
  id TEXT PRIMARY KEY NOT NULL,
  client_message_id TEXT UNIQUE NOT NULL,
  sender_user_id TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('text/plain', 'application/e2ee+ciphertext')),
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'local'
    CHECK (source IN ('local', 'remote')),
  sync_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_state IN ('pending', 'synced', 'failed')),
  server_message_id TEXT,
  created_at TEXT NOT NULL,
  read_at TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (sender_user_id <> recipient_user_id)
);`;

export const CREATE_HUB_FRIEND_MESSAGE_OUTBOX = `
CREATE TABLE IF NOT EXISTS hub_friend_message_outbox (
  client_message_id TEXT PRIMARY KEY NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('text/plain', 'application/e2ee+ciphertext')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'retry', 'failed', 'sent')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (from_user_id <> to_user_id)
);`;

export const CREATE_HUB_FRIEND_INDEXES = [
  `CREATE INDEX IF NOT EXISTS hub_friend_invites_to_status_idx
     ON hub_friend_invites (to_user_id, status, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS hub_friend_invites_from_status_idx
     ON hub_friend_invites (from_user_id, status, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS hub_friendships_user_status_idx
     ON hub_friendships (user_id, status, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS hub_friend_messages_conversation_idx
     ON hub_friend_messages (sender_user_id, recipient_user_id, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS hub_friend_messages_recipient_unread_idx
     ON hub_friend_messages (recipient_user_id, read_at, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS hub_friend_messages_sync_state_idx
     ON hub_friend_messages (sync_state, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS hub_friend_message_outbox_schedule_idx
     ON hub_friend_message_outbox (status, next_attempt_at ASC);`,
] as const;

export const CREATE_HUB_REVOKED_ENTITLEMENTS = `
CREATE TABLE IF NOT EXISTS hub_revoked_entitlements (
  signature TEXT PRIMARY KEY NOT NULL,
  reason TEXT,
  source_event_id TEXT,
  revoked_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_HUB_SCHEMA_VERSIONS = `
CREATE TABLE IF NOT EXISTS hub_schema_versions (
  module_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (module_id, version)
);`;

/**
 * All hub DDL statements in creation order.
 */
export const HUB_TABLES = [
  CREATE_HUB_ENABLED_MODULES,
  CREATE_HUB_PREFERENCES,
  CREATE_HUB_AGGREGATE_EVENT_COUNTERS,
  CREATE_HUB_SUBSCRIPTION,
  CREATE_HUB_MODE,
  CREATE_HUB_ENTITLEMENTS,
  CREATE_HUB_FRIEND_PROFILES,
  CREATE_HUB_FRIEND_INVITES,
  CREATE_HUB_FRIENDSHIPS,
  CREATE_HUB_FRIEND_MESSAGES,
  CREATE_HUB_FRIEND_MESSAGE_OUTBOX,
  ...CREATE_HUB_FRIEND_INDEXES,
  CREATE_HUB_REVOKED_ENTITLEMENTS,
  CREATE_HUB_SCHEMA_VERSIONS,
] as const;

/**
 * Initialize hub tables. Safe to call multiple times (uses IF NOT EXISTS).
 */
export function createHubTables(db: { execute(sql: string): void }): void {
  for (const ddl of HUB_TABLES) {
    db.execute(ddl);
  }
}
