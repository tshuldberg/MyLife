/**
 * SQLite cache tables for offline browsing.
 * These mirror a subset of the Supabase cloud schema for local reads.
 * Prefixed with mk_ to namespace within the shared SQLite file.
 */

export const CACHE_TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS mk_categories_cache (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES mk_categories_cache(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS mk_listings_cache (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER,
    currency TEXT NOT NULL DEFAULT 'USD',
    pricing_type TEXT NOT NULL DEFAULT 'fixed',
    condition TEXT,
    listing_type TEXT NOT NULL DEFAULT 'sell',
    status TEXT NOT NULL DEFAULT 'active',
    location_name TEXT,
    latitude REAL,
    longitude REAL,
    fulfillment_type TEXT,
    service_radius_miles INTEGER,
    availability_notes TEXT,
    trade_for TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    watch_count INTEGER NOT NULL DEFAULT 0,
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS mk_listing_photos_cache (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL REFERENCES mk_listings_cache(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS mk_watchlist_cache (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS mk_conversations_cache (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    last_message_at TEXT,
    created_at TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS mk_messages_cache (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES mk_conversations_cache(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    body TEXT,
    content_type TEXT NOT NULL DEFAULT 'text/plain',
    ciphertext TEXT,
    encryption_algorithm TEXT,
    encryption_salt TEXT,
    encryption_iv TEXT,
    created_at TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

export const CACHE_INDEXES: string[] = [
  'CREATE INDEX IF NOT EXISTS mk_categories_cache_parent_idx ON mk_categories_cache (parent_id)',
  'CREATE INDEX IF NOT EXISTS mk_categories_cache_slug_idx ON mk_categories_cache (slug)',
  'CREATE INDEX IF NOT EXISTS mk_listings_cache_seller_idx ON mk_listings_cache (seller_id)',
  'CREATE INDEX IF NOT EXISTS mk_listings_cache_category_idx ON mk_listings_cache (category_id)',
  'CREATE INDEX IF NOT EXISTS mk_listings_cache_status_idx ON mk_listings_cache (status)',
  'CREATE INDEX IF NOT EXISTS mk_listings_cache_created_idx ON mk_listings_cache (created_at DESC)',
  'CREATE INDEX IF NOT EXISTS mk_listing_photos_cache_listing_idx ON mk_listing_photos_cache (listing_id)',
  'CREATE INDEX IF NOT EXISTS mk_watchlist_cache_user_idx ON mk_watchlist_cache (user_id)',
  'CREATE INDEX IF NOT EXISTS mk_watchlist_cache_listing_idx ON mk_watchlist_cache (listing_id)',
  'CREATE INDEX IF NOT EXISTS mk_conversations_cache_listing_idx ON mk_conversations_cache (listing_id)',
  'CREATE INDEX IF NOT EXISTS mk_messages_cache_conv_idx ON mk_messages_cache (conversation_id)',
];
