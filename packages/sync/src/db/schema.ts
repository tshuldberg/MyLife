/**
 * DDL constants for all sync_ and torrent_ tables.
 *
 * Follows the hub-schema pattern from @mylife/db:
 * each table gets its own exported constant, plus a combined array.
 */

// ---------------------------------------------------------------------------
// Sync Tables (Personal Sync - Spec Section 8.1)
// ---------------------------------------------------------------------------

export const CREATE_SYNC_DEVICE_IDENTITY = `
CREATE TABLE IF NOT EXISTS sync_device_identity (
  id TEXT PRIMARY KEY NOT NULL CHECK (id = 'self'),
  public_key TEXT NOT NULL,
  private_key_ref TEXT NOT NULL,
  dh_public_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_SYNC_PAIRED_DEVICES = `
CREATE TABLE IF NOT EXISTS sync_paired_devices (
  device_id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  dh_public_key TEXT NOT NULL,
  shared_secret_ref TEXT NOT NULL,
  last_seen_at TEXT,
  last_sync_at TEXT,
  last_sync_module TEXT,
  bytes_sent INTEGER NOT NULL DEFAULT 0,
  bytes_received INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  paired_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_SYNC_CHANGE_LOG = `
CREATE TABLE IF NOT EXISTS sync_change_log (
  id TEXT PRIMARY KEY NOT NULL,
  module_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  row_id TEXT NOT NULL,
  data_json TEXT,
  device_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_SYNC_CHANGE_LOG_INDEXES = `
CREATE INDEX IF NOT EXISTS sync_change_log_unsynced_idx
  ON sync_change_log (synced, timestamp ASC);
CREATE INDEX IF NOT EXISTS sync_change_log_module_idx
  ON sync_change_log (module_id, timestamp ASC);`;

export const CREATE_SYNC_PEER_MODULE_STATE = `
CREATE TABLE IF NOT EXISTS sync_peer_module_state (
  device_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  last_synced_version INTEGER NOT NULL DEFAULT 0,
  last_synced_at TEXT,
  automerge_heads TEXT,
  PRIMARY KEY (device_id, module_id)
);`;

export const CREATE_SYNC_DEVICE_REVOCATIONS = `
CREATE TABLE IF NOT EXISTS sync_device_revocations (
  device_id TEXT PRIMARY KEY NOT NULL,
  revoked_by_device_id TEXT NOT NULL,
  reason TEXT,
  revoked_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_SYNC_BLOBS = `
CREATE TABLE IF NOT EXISTS sync_blobs (
  hash TEXT PRIMARY KEY NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  module_id TEXT NOT NULL,
  ref_count INTEGER NOT NULL DEFAULT 1,
  stored_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_SYNC_BLOBS_INDEX = `
CREATE INDEX IF NOT EXISTS sync_blobs_module_idx
  ON sync_blobs (module_id);`;

export const CREATE_SYNC_BLOB_POLICY = `
CREATE TABLE IF NOT EXISTS sync_blob_policy (
  module_id TEXT PRIMARY KEY NOT NULL,
  policy TEXT NOT NULL DEFAULT 'wifi_only'
    CHECK (policy IN ('always', 'wifi_only', 'manual', 'never')),
  max_blob_size_bytes INTEGER DEFAULT 52428800,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_SYNC_SESSIONS = `
CREATE TABLE IF NOT EXISTS sync_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  peer_device_id TEXT NOT NULL,
  transport TEXT NOT NULL CHECK (transport IN ('lan', 'wan_webrtc', 'wan_relay')),
  direction TEXT NOT NULL CHECK (direction IN ('push', 'pull', 'bidirectional')),
  modules_synced TEXT NOT NULL,
  changes_sent INTEGER NOT NULL DEFAULT 0,
  changes_received INTEGER NOT NULL DEFAULT 0,
  bytes_sent INTEGER NOT NULL DEFAULT 0,
  bytes_received INTEGER NOT NULL DEFAULT 0,
  blobs_sent INTEGER NOT NULL DEFAULT 0,
  blobs_received INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'partial', 'failed')),
  error TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// ---------------------------------------------------------------------------
// Torrent Tables (Content Distribution - Spec Section 11.11)
// ---------------------------------------------------------------------------

export const CREATE_TORRENT_PUBLISHED = `
CREATE TABLE IF NOT EXISTS torrent_published (
  info_hash TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  access TEXT NOT NULL CHECK (access IN ('public', 'link', 'paid', 'encrypted')),
  price_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  total_size INTEGER NOT NULL,
  piece_length INTEGER NOT NULL,
  pieces_json TEXT NOT NULL,
  merkle_root TEXT NOT NULL,
  files_json TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  content_key TEXT,
  trackers_json TEXT NOT NULL DEFAULT '["wss://tracker.mylife.app"]',
  web_seeds_json TEXT DEFAULT '[]',
  download_count INTEGER NOT NULL DEFAULT 0,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_TORRENT_DOWNLOADS = `
CREATE TABLE IF NOT EXISTS torrent_downloads (
  info_hash TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  creator_public_key TEXT NOT NULL,
  creator_display_name TEXT,
  total_size INTEGER NOT NULL,
  downloaded_size INTEGER NOT NULL DEFAULT 0,
  piece_count INTEGER NOT NULL,
  pieces_completed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'downloading'
    CHECK (status IN ('downloading', 'completed', 'paused', 'seeding', 'stopped')),
  manifest_json TEXT NOT NULL,
  content_key TEXT,
  access_token TEXT,
  storage_path TEXT NOT NULL,
  downloaded_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_TORRENT_SEEDING = `
CREATE TABLE IF NOT EXISTS torrent_seeding (
  info_hash TEXT PRIMARY KEY NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  bytes_uploaded INTEGER NOT NULL DEFAULT 0,
  peers_served INTEGER NOT NULL DEFAULT 0,
  last_upload_at TEXT,
  pin_forever INTEGER NOT NULL DEFAULT 0,
  auto_delete_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_TORRENT_PIECES = `
CREATE TABLE IF NOT EXISTS torrent_pieces (
  info_hash TEXT NOT NULL,
  piece_index INTEGER NOT NULL,
  hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'missing'
    CHECK (status IN ('missing', 'downloading', 'verified')),
  verified_at TEXT,
  PRIMARY KEY (info_hash, piece_index)
);`;

export const CREATE_TORRENT_PIECES_INDEX = `
CREATE INDEX IF NOT EXISTS torrent_pieces_status_idx
  ON torrent_pieces (info_hash, status);`;

export const CREATE_TORRENT_PEERS = `
CREATE TABLE IF NOT EXISTS torrent_peers (
  info_hash TEXT NOT NULL,
  peer_id TEXT NOT NULL,
  connection_info TEXT,
  is_seeder INTEGER NOT NULL DEFAULT 0,
  bytes_downloaded_from INTEGER NOT NULL DEFAULT 0,
  bytes_uploaded_to INTEGER NOT NULL DEFAULT 0,
  connected_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT,
  PRIMARY KEY (info_hash, peer_id)
);`;

export const CREATE_TORRENT_PAYMENTS = `
CREATE TABLE IF NOT EXISTS torrent_payments (
  id TEXT PRIMARY KEY NOT NULL,
  info_hash TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_provider_id TEXT,
  buyer_public_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_TORRENT_SEEDING_POLICY = `
CREATE TABLE IF NOT EXISTS torrent_seeding_policy (
  id TEXT PRIMARY KEY NOT NULL CHECK (id = 'config'),
  enabled INTEGER NOT NULL DEFAULT 1,
  max_upload_kbps INTEGER NOT NULL DEFAULT 0,
  max_seed_storage_mb INTEGER NOT NULL DEFAULT 5120,
  auto_delete_days INTEGER NOT NULL DEFAULT 30,
  seed_on_cellular INTEGER NOT NULL DEFAULT 0,
  seed_while_charging INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// ---------------------------------------------------------------------------
// Combined DDL Arrays
// ---------------------------------------------------------------------------

/** All sync table DDL in creation order. */
export const SYNC_TABLES = [
  CREATE_SYNC_DEVICE_IDENTITY,
  CREATE_SYNC_PAIRED_DEVICES,
  CREATE_SYNC_CHANGE_LOG,
  CREATE_SYNC_CHANGE_LOG_INDEXES,
  CREATE_SYNC_PEER_MODULE_STATE,
  CREATE_SYNC_DEVICE_REVOCATIONS,
  CREATE_SYNC_BLOBS,
  CREATE_SYNC_BLOBS_INDEX,
  CREATE_SYNC_BLOB_POLICY,
  CREATE_SYNC_SESSIONS,
] as const;

/** All torrent table DDL in creation order. */
export const TORRENT_TABLES = [
  CREATE_TORRENT_PUBLISHED,
  CREATE_TORRENT_DOWNLOADS,
  CREATE_TORRENT_SEEDING,
  CREATE_TORRENT_PIECES,
  CREATE_TORRENT_PIECES_INDEX,
  CREATE_TORRENT_PEERS,
  CREATE_TORRENT_PAYMENTS,
  CREATE_TORRENT_SEEDING_POLICY,
] as const;

/** All DDL for the P2P sync system (sync + torrent). */
export const ALL_P2P_TABLES = [...SYNC_TABLES, ...TORRENT_TABLES] as const;

/**
 * Create all sync and torrent tables. Safe to call multiple times (IF NOT EXISTS).
 *
 * Note: CREATE_SYNC_CHANGE_LOG_INDEXES contains multiple statements separated
 * by semicolons. Some SQLite drivers require executing them individually, so
 * we split on semicolons for multi-statement constants.
 */
export function createSyncTables(db: { execute(sql: string): void }): void {
  for (const ddl of ALL_P2P_TABLES) {
    // Handle multi-statement DDL (e.g., indexes grouped in one constant)
    const statements = ddl
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      db.execute(stmt);
    }
  }
}
