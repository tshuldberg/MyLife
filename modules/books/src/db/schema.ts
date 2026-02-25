/**
 * SQLite schema for MyBooks module — all tables, indexes, FTS5, and triggers.
 * All table names use the bk_ prefix to avoid collisions in the shared hub database.
 *
 * UUIDs stored as TEXT.
 * Dates stored as TEXT in ISO datetime format.
 * Booleans stored as INTEGER (0/1).
 * JSON arrays stored as TEXT.
 */

// -- 1. Books --
export const CREATE_BOOKS = `
CREATE TABLE IF NOT EXISTS bk_books (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  authors TEXT NOT NULL,
  isbn_10 TEXT,
  isbn_13 TEXT,
  open_library_id TEXT,
  open_library_edition_id TEXT,
  cover_url TEXT,
  cover_cached_path TEXT,
  publisher TEXT,
  publish_year INTEGER,
  page_count INTEGER,
  subjects TEXT,
  description TEXT,
  language TEXT DEFAULT 'en',
  format TEXT DEFAULT 'physical'
    CHECK (format IN ('physical', 'ebook', 'audiobook')),
  added_source TEXT DEFAULT 'manual'
    CHECK (added_source IN ('search', 'scan', 'manual', 'import_goodreads', 'import_storygraph')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 2. Shelves --
export const CREATE_SHELVES = `
CREATE TABLE IF NOT EXISTS bk_shelves (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  book_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 3. Book-Shelf junction --
export const CREATE_BOOK_SHELVES = `
CREATE TABLE IF NOT EXISTS bk_book_shelves (
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  shelf_id TEXT NOT NULL REFERENCES bk_shelves(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (book_id, shelf_id)
);`;

// -- 4. Reading Sessions --
export const CREATE_READING_SESSIONS = `
CREATE TABLE IF NOT EXISTS bk_reading_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  started_at TEXT,
  finished_at TEXT,
  current_page INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'want_to_read'
    CHECK (status IN ('want_to_read', 'reading', 'finished', 'dnf')),
  dnf_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 5. Reviews --
export const CREATE_REVIEWS = `
CREATE TABLE IF NOT EXISTS bk_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES bk_reading_sessions(id) ON DELETE SET NULL,
  rating REAL CHECK (rating >= 0.5 AND rating <= 5.0),
  review_text TEXT,
  favorite_quote TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 5b. Share Events --
export const CREATE_SHARE_EVENTS = `
CREATE TABLE IF NOT EXISTS bk_share_events (
  id TEXT PRIMARY KEY NOT NULL,
  actor_user_id TEXT NOT NULL,
  object_type TEXT NOT NULL
    CHECK (object_type IN ('book_rating', 'book_review', 'list_item', 'generic')),
  object_id TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'friends', 'public')),
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 6. Tags --
export const CREATE_TAGS = `
CREATE TABLE IF NOT EXISTS bk_tags (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 7. Book-Tag junction --
export const CREATE_BOOK_TAGS = `
CREATE TABLE IF NOT EXISTS bk_book_tags (
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES bk_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, tag_id)
);`;

// -- 8. Reading Goals --
export const CREATE_READING_GOALS = `
CREATE TABLE IF NOT EXISTS bk_reading_goals (
  id TEXT PRIMARY KEY NOT NULL,
  year INTEGER NOT NULL,
  target_books INTEGER NOT NULL,
  target_pages INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 9. Open Library Cache --
export const CREATE_OL_CACHE = `
CREATE TABLE IF NOT EXISTS bk_ol_cache (
  isbn TEXT PRIMARY KEY NOT NULL,
  response_json TEXT NOT NULL,
  cover_downloaded INTEGER NOT NULL DEFAULT 0,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 10. Import Log --
export const CREATE_IMPORT_LOG = `
CREATE TABLE IF NOT EXISTS bk_import_log (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL,
  filename TEXT NOT NULL,
  books_imported INTEGER NOT NULL DEFAULT 0,
  books_skipped INTEGER NOT NULL DEFAULT 0,
  errors TEXT,
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 11. Settings --
export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS bk_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);`;

// -- FTS5 --
export const CREATE_BOOKS_FTS = `
CREATE VIRTUAL TABLE IF NOT EXISTS bk_books_fts USING fts5(
  title,
  subtitle,
  authors,
  subjects,
  content='bk_books',
  content_rowid='rowid',
  tokenize='porter unicode61'
);`;

// -- FTS sync triggers --
export const CREATE_FTS_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS bk_books_fts_ai AFTER INSERT ON bk_books BEGIN
    INSERT INTO bk_books_fts(rowid, title, subtitle, authors, subjects)
    VALUES (new.rowid, new.title, new.subtitle, new.authors, new.subjects);
  END;`,
  `CREATE TRIGGER IF NOT EXISTS bk_books_fts_ad AFTER DELETE ON bk_books BEGIN
    INSERT INTO bk_books_fts(bk_books_fts, rowid, title, subtitle, authors, subjects)
    VALUES ('delete', old.rowid, old.title, old.subtitle, old.authors, old.subjects);
  END;`,
  `CREATE TRIGGER IF NOT EXISTS bk_books_fts_au AFTER UPDATE ON bk_books BEGIN
    INSERT INTO bk_books_fts(bk_books_fts, rowid, title, subtitle, authors, subjects)
    VALUES ('delete', old.rowid, old.title, old.subtitle, old.authors, old.subjects);
    INSERT INTO bk_books_fts(rowid, title, subtitle, authors, subjects)
    VALUES (new.rowid, new.title, new.subtitle, new.authors, new.subjects);
  END;`,
];

// -- Indexes --
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS bk_books_isbn13_idx ON bk_books(isbn_13);`,
  `CREATE INDEX IF NOT EXISTS bk_books_isbn10_idx ON bk_books(isbn_10);`,
  `CREATE INDEX IF NOT EXISTS bk_books_ol_id_idx ON bk_books(open_library_id);`,
  `CREATE INDEX IF NOT EXISTS bk_books_title_idx ON bk_books(title COLLATE NOCASE);`,
  `CREATE INDEX IF NOT EXISTS bk_book_shelves_shelf_idx ON bk_book_shelves(shelf_id);`,
  `CREATE INDEX IF NOT EXISTS bk_sessions_book_idx ON bk_reading_sessions(book_id);`,
  `CREATE INDEX IF NOT EXISTS bk_sessions_status_idx ON bk_reading_sessions(status);`,
  `CREATE INDEX IF NOT EXISTS bk_sessions_finished_idx ON bk_reading_sessions(finished_at);`,
  `CREATE INDEX IF NOT EXISTS bk_sessions_started_idx ON bk_reading_sessions(started_at);`,
  `CREATE INDEX IF NOT EXISTS bk_reviews_book_idx ON bk_reviews(book_id);`,
  `CREATE INDEX IF NOT EXISTS bk_reviews_rating_idx ON bk_reviews(rating);`,
  `CREATE INDEX IF NOT EXISTS bk_reviews_favorite_idx ON bk_reviews(is_favorite) WHERE is_favorite = 1;`,
  `CREATE INDEX IF NOT EXISTS bk_tags_name_idx ON bk_tags(name);`,
  `CREATE INDEX IF NOT EXISTS bk_tags_usage_idx ON bk_tags(usage_count DESC);`,
  `CREATE INDEX IF NOT EXISTS bk_book_tags_tag_idx ON bk_book_tags(tag_id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS bk_goals_year_idx ON bk_reading_goals(year);`,
];

// -- Share indexes (added in migration v2) --
export const CREATE_SHARE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS bk_share_events_actor_created_idx
     ON bk_share_events(actor_user_id, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS bk_share_events_object_idx
     ON bk_share_events(object_type, object_id);`,
  `CREATE INDEX IF NOT EXISTS bk_share_events_visibility_created_idx
     ON bk_share_events(visibility, created_at DESC);`,
];

// -- System shelf seeds --
export const SEED_SYSTEM_SHELVES = [
  `INSERT OR IGNORE INTO bk_shelves (id, name, slug, icon, is_system, sort_order) VALUES ('shelf-tbr', 'Want to Read', 'want-to-read', '📚', 1, 0);`,
  `INSERT OR IGNORE INTO bk_shelves (id, name, slug, icon, is_system, sort_order) VALUES ('shelf-reading', 'Currently Reading', 'currently-reading', '📖', 1, 1);`,
  `INSERT OR IGNORE INTO bk_shelves (id, name, slug, icon, is_system, sort_order) VALUES ('shelf-finished', 'Finished', 'finished', '✅', 1, 2);`,
];

/**
 * All table creation statements in dependency order.
 */
export const ALL_TABLES = [
  CREATE_BOOKS,
  CREATE_SHELVES,
  CREATE_BOOK_SHELVES,
  CREATE_READING_SESSIONS,
  CREATE_REVIEWS,
  CREATE_TAGS,
  CREATE_BOOK_TAGS,
  CREATE_READING_GOALS,
  CREATE_OL_CACHE,
  CREATE_IMPORT_LOG,
  CREATE_SETTINGS,
];
