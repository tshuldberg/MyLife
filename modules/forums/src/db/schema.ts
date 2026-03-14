/**
 * SQLite cache tables for offline browsing.
 * These mirror a subset of the Supabase cloud schema for local reads.
 * Prefixed with fr_ to namespace within the shared SQLite file.
 */

export const CACHE_TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS fr_communities_cache (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    banner_url TEXT,
    community_type TEXT NOT NULL DEFAULT 'public',
    linked_module_id TEXT,
    member_count INTEGER NOT NULL DEFAULT 0,
    thread_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS fr_community_members_cache (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES fr_communities_cache(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    joined_at TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS fr_threads_cache (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES fr_communities_cache(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    is_pinned INTEGER NOT NULL DEFAULT 0,
    vote_score INTEGER NOT NULL DEFAULT 0,
    reply_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS fr_replies_cache (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES fr_threads_cache(id) ON DELETE CASCADE,
    parent_reply_id TEXT,
    author_id TEXT NOT NULL,
    body TEXT NOT NULL,
    vote_score INTEGER NOT NULL DEFAULT 0,
    depth INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS fr_bookmarks_cache (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS fr_tags_cache (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES fr_communities_cache(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

export const CACHE_INDEXES: string[] = [
  'CREATE INDEX IF NOT EXISTS fr_communities_cache_name_idx ON fr_communities_cache (name)',
  'CREATE INDEX IF NOT EXISTS fr_communities_cache_type_idx ON fr_communities_cache (community_type)',
  'CREATE INDEX IF NOT EXISTS fr_members_cache_community_idx ON fr_community_members_cache (community_id)',
  'CREATE INDEX IF NOT EXISTS fr_members_cache_profile_idx ON fr_community_members_cache (profile_id)',
  'CREATE INDEX IF NOT EXISTS fr_threads_cache_community_idx ON fr_threads_cache (community_id)',
  'CREATE INDEX IF NOT EXISTS fr_threads_cache_author_idx ON fr_threads_cache (author_id)',
  'CREATE INDEX IF NOT EXISTS fr_threads_cache_created_idx ON fr_threads_cache (created_at DESC)',
  'CREATE INDEX IF NOT EXISTS fr_threads_cache_score_idx ON fr_threads_cache (vote_score DESC)',
  'CREATE INDEX IF NOT EXISTS fr_replies_cache_thread_idx ON fr_replies_cache (thread_id)',
  'CREATE INDEX IF NOT EXISTS fr_replies_cache_parent_idx ON fr_replies_cache (parent_reply_id)',
  'CREATE INDEX IF NOT EXISTS fr_bookmarks_cache_profile_idx ON fr_bookmarks_cache (profile_id)',
  'CREATE INDEX IF NOT EXISTS fr_tags_cache_community_idx ON fr_tags_cache (community_id)',
];
