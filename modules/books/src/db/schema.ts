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

// -- 5c. Reader Documents --
export const CREATE_READER_DOCUMENTS = `
CREATE TABLE IF NOT EXISTS bk_reader_documents (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT REFERENCES bk_books(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  author TEXT,
  source_type TEXT NOT NULL DEFAULT 'upload'
    CHECK (source_type IN ('upload', 'import', 'note')),
  mime_type TEXT,
  file_name TEXT,
  file_extension TEXT,
  text_content TEXT NOT NULL,
  content_hash TEXT,
  total_chars INTEGER NOT NULL DEFAULT 0,
  total_words INTEGER NOT NULL DEFAULT 0,
  current_position INTEGER NOT NULL DEFAULT 0,
  progress_percent REAL NOT NULL DEFAULT 0,
  last_opened_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_READER_NOTES = `
CREATE TABLE IF NOT EXISTS bk_reader_notes (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES bk_reader_documents(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'note'
    CHECK (note_type IN ('note', 'highlight', 'bookmark')),
  selection_start INTEGER NOT NULL DEFAULT 0,
  selection_end INTEGER NOT NULL DEFAULT 0,
  selected_text TEXT,
  note_text TEXT,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const CREATE_READER_PREFERENCES = `
CREATE TABLE IF NOT EXISTS bk_reader_preferences (
  document_id TEXT PRIMARY KEY NOT NULL REFERENCES bk_reader_documents(id) ON DELETE CASCADE,
  font_size INTEGER NOT NULL DEFAULT 20,
  line_height REAL NOT NULL DEFAULT 1.6,
  font_family TEXT NOT NULL DEFAULT 'serif',
  theme TEXT NOT NULL DEFAULT 'sepia'
    CHECK (theme IN ('dark', 'sepia', 'light')),
  margin_size INTEGER NOT NULL DEFAULT 20,
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

// -- 13. Progress Updates --
export const CREATE_PROGRESS_UPDATES = `
CREATE TABLE IF NOT EXISTS bk_progress_updates (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES bk_reading_sessions(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  page_number INTEGER,
  percent_complete REAL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 14. Timed Sessions --
export const CREATE_TIMED_SESSIONS = `
CREATE TABLE IF NOT EXISTS bk_timed_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES bk_reading_sessions(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_ms INTEGER,
  start_page INTEGER,
  end_page INTEGER,
  pages_read INTEGER,
  pages_per_hour REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 15. Series --
export const CREATE_SERIES = `
CREATE TABLE IF NOT EXISTS bk_series (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_books INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 16. Series Books --
export const CREATE_SERIES_BOOKS = `
CREATE TABLE IF NOT EXISTS bk_series_books (
  series_id TEXT NOT NULL REFERENCES bk_series(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (series_id, book_id)
);`;

// -- 17. Mood Tags --
export const CREATE_MOOD_TAGS = `
CREATE TABLE IF NOT EXISTS bk_mood_tags (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('mood', 'pace', 'genre')),
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 18. Content Warnings --
export const CREATE_CONTENT_WARNINGS = `
CREATE TABLE IF NOT EXISTS bk_content_warnings (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  warning TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate'
    CHECK (severity IN ('mild', 'moderate', 'severe')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 19. Challenges --
export const CREATE_CHALLENGES = `
CREATE TABLE IF NOT EXISTS bk_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL
    CHECK (challenge_type IN ('books_count', 'pages_count', 'minutes_count', 'themed')),
  target_value INTEGER NOT NULL,
  target_unit TEXT NOT NULL
    CHECK (target_unit IN ('books', 'pages', 'minutes')),
  time_frame TEXT NOT NULL
    CHECK (time_frame IN ('yearly', 'monthly', 'weekly', 'custom')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  theme_prompt TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 20. Challenge Progress --
export const CREATE_CHALLENGE_PROGRESS = `
CREATE TABLE IF NOT EXISTS bk_challenge_progress (
  id TEXT PRIMARY KEY NOT NULL,
  challenge_id TEXT NOT NULL REFERENCES bk_challenges(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES bk_books(id) ON DELETE SET NULL,
  session_id TEXT REFERENCES bk_reading_sessions(id) ON DELETE SET NULL,
  value_added INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  logged_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 21. Journal Entries --
export const CREATE_JOURNAL_ENTRIES = `
CREATE TABLE IF NOT EXISTS bk_journal_entries (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  content_encrypted INTEGER NOT NULL DEFAULT 0,
  encryption_salt TEXT,
  encryption_iv TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  mood TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 22. Journal Photos --
export const CREATE_JOURNAL_PHOTOS = `
CREATE TABLE IF NOT EXISTS bk_journal_photos (
  id TEXT PRIMARY KEY NOT NULL,
  entry_id TEXT NOT NULL REFERENCES bk_journal_entries(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT,
  width INTEGER,
  height INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// -- 23. Journal Book Links --
export const CREATE_JOURNAL_BOOK_LINKS = `
CREATE TABLE IF NOT EXISTS bk_journal_book_links (
  entry_id TEXT NOT NULL REFERENCES bk_journal_entries(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entry_id, book_id)
);`;

// -- Journal FTS5 --
export const CREATE_JOURNAL_FTS = `
CREATE VIRTUAL TABLE IF NOT EXISTS bk_journal_fts USING fts5(
  title,
  content,
  content='bk_journal_entries',
  content_rowid='rowid',
  tokenize='porter unicode61'
);`;

// -- Journal FTS sync triggers --
export const CREATE_JOURNAL_FTS_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS bk_journal_fts_ai AFTER INSERT ON bk_journal_entries BEGIN
    INSERT INTO bk_journal_fts(rowid, title, content)
    VALUES (new.rowid, new.title, new.content);
  END;`,
  `CREATE TRIGGER IF NOT EXISTS bk_journal_fts_ad AFTER DELETE ON bk_journal_entries BEGIN
    INSERT INTO bk_journal_fts(bk_journal_fts, rowid, title, content)
    VALUES ('delete', old.rowid, old.title, old.content);
  END;`,
  `CREATE TRIGGER IF NOT EXISTS bk_journal_fts_au AFTER UPDATE ON bk_journal_entries BEGIN
    INSERT INTO bk_journal_fts(bk_journal_fts, rowid, title, content)
    VALUES ('delete', old.rowid, old.title, old.content);
    INSERT INTO bk_journal_fts(rowid, title, content)
    VALUES (new.rowid, new.title, new.content);
  END;`,
];

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

export const CREATE_READER_INDEXES = [
  `CREATE INDEX IF NOT EXISTS bk_reader_documents_book_idx
     ON bk_reader_documents(book_id);`,
  `CREATE INDEX IF NOT EXISTS bk_reader_documents_last_opened_idx
     ON bk_reader_documents(last_opened_at DESC);`,
  `CREATE INDEX IF NOT EXISTS bk_reader_documents_updated_idx
     ON bk_reader_documents(updated_at DESC);`,
  `CREATE INDEX IF NOT EXISTS bk_reader_notes_document_created_idx
     ON bk_reader_notes(document_id, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS bk_reader_notes_type_idx
     ON bk_reader_notes(note_type);`,
];

// -- Feature set indexes (added in migration v4) --
export const CREATE_FEATURE_INDEXES = [
  // Progress + timed sessions
  `CREATE INDEX IF NOT EXISTS bk_progress_updates_session_idx ON bk_progress_updates(session_id);`,
  `CREATE INDEX IF NOT EXISTS bk_progress_updates_book_idx ON bk_progress_updates(book_id);`,
  `CREATE INDEX IF NOT EXISTS bk_progress_updates_created_idx ON bk_progress_updates(created_at);`,
  `CREATE INDEX IF NOT EXISTS bk_timed_sessions_session_idx ON bk_timed_sessions(session_id);`,
  `CREATE INDEX IF NOT EXISTS bk_timed_sessions_book_idx ON bk_timed_sessions(book_id);`,
  `CREATE INDEX IF NOT EXISTS bk_timed_sessions_started_idx ON bk_timed_sessions(started_at);`,
  // Series
  `CREATE INDEX IF NOT EXISTS bk_series_name_idx ON bk_series(name COLLATE NOCASE);`,
  `CREATE INDEX IF NOT EXISTS bk_series_books_book_idx ON bk_series_books(book_id);`,
  `CREATE INDEX IF NOT EXISTS bk_series_books_order_idx ON bk_series_books(series_id, sort_order);`,
  // Mood tags + content warnings
  `CREATE UNIQUE INDEX IF NOT EXISTS bk_mood_tags_book_type_value_idx ON bk_mood_tags(book_id, tag_type, value);`,
  `CREATE INDEX IF NOT EXISTS bk_mood_tags_type_value_idx ON bk_mood_tags(tag_type, value);`,
  `CREATE INDEX IF NOT EXISTS bk_content_warnings_book_idx ON bk_content_warnings(book_id);`,
  // Challenges
  `CREATE INDEX IF NOT EXISTS bk_challenges_active_idx ON bk_challenges(is_active) WHERE is_active = 1;`,
  `CREATE INDEX IF NOT EXISTS bk_challenges_type_idx ON bk_challenges(challenge_type);`,
  `CREATE INDEX IF NOT EXISTS bk_challenge_progress_challenge_idx ON bk_challenge_progress(challenge_id);`,
  `CREATE INDEX IF NOT EXISTS bk_challenge_progress_book_idx ON bk_challenge_progress(book_id);`,
  // Journal
  `CREATE INDEX IF NOT EXISTS bk_journal_entries_created_idx ON bk_journal_entries(created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS bk_journal_entries_favorite_idx ON bk_journal_entries(is_favorite) WHERE is_favorite = 1;`,
  `CREATE INDEX IF NOT EXISTS bk_journal_photos_entry_idx ON bk_journal_photos(entry_id);`,
  `CREATE INDEX IF NOT EXISTS bk_journal_book_links_book_idx ON bk_journal_book_links(book_id);`,
  `CREATE INDEX IF NOT EXISTS bk_journal_book_links_entry_idx ON bk_journal_book_links(entry_id);`,
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
