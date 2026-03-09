# @mylife/books

## Overview

Private book tracking module for the MyLife hub. Track your reading life with library management, reading lists, half-star ratings, reviews, reading stats, year-in-review, barcode scanning, Goodreads/StoryGraph import, e-reader document uploads, reading challenges, and a private journal. All data local SQLite, book metadata via Open Library API.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `BOOKS_MODULE` | ModuleDefinition | Module registration contract (id: `books`, prefix: `bk_`, tier: premium) |
| `BookSchema` / `Book` | Zod schema + type | Core book record with format, source, Open Library fields |
| `db/*` CRUD functions | Functions | Full CRUD for books, shelves, tags, sessions, reviews, goals, import log, OL cache, sharing |
| `api/*` | Functions | Open Library API client, search, transform helpers |
| `import/*` | Functions | Goodreads and StoryGraph CSV import parsers |
| `export/*` | Functions | CSV, JSON, Markdown export formatters |
| `stats/*` | Functions | Reading stats engine and year-in-review aggregation |
| `reader/*` | Functions | E-reader upload parsing (ePub, PDF) |
| `progress/*` | Engine | Reading speed estimation, progress timeline |
| `discovery/*` | Engine | Mood-based book discovery and filtering |
| `challenges/*` | Engine | Challenge tracking, auto-progress logging |
| `journal/*` | Engine | Encrypted journal entries, per-book reflections, markdown export |

## Storage

- **Type:** sqlite
- **Table prefix:** `bk_`
- **Schema version:** 4
- **Key tables:** `bk_books`, `bk_shelves`, `bk_book_shelves`, `bk_tags`, `bk_book_tags`, `bk_reading_sessions`, `bk_reviews`, `bk_reading_goals`, `bk_import_log`, `bk_ol_cache`, `bk_settings`, `bk_books_fts` (FTS5), `bk_share_events`, `bk_reader_documents`, `bk_reader_notes`, `bk_reader_preferences`, `bk_progress_updates`, `bk_timed_sessions`, `bk_series`, `bk_series_books`, `bk_mood_tags`, `bk_content_warnings`, `bk_challenges`, `bk_challenge_progress`, `bk_journal_entries`, `bk_journal_photos`, `bk_journal_book_links`, `bk_journal_fts`

## Engines

- **progress-engine.ts** -- `updateProgress`, `getReadingSpeed`, `getProgressTimeline`
- **discovery-engine.ts** -- `discoverBooks`, `getBookDiscoveryProfile`
- **challenge-engine.ts** -- `getChallengeStatus`, `getActiveChallengeStatuses`, `logBookCompletion`, `logReadingMinutes`
- **journal-engine.ts** -- `createEntry`, `getDecryptedEntry`, `getReflectionsForBook`, `getJournalStats`, `exportJournalToMarkdown`, `countWords`
- **encryption.ts** -- `deriveKey`, `encryptContent`, `decryptContent` (journal encryption)

## Schemas

- `BookSchema`, `BookFormat`, `AddedSource` (core book)
- Shelf, tag, reading session, review, reading goal, import log, OL cache schemas (in `models/schemas.ts`)
- API transform types (`api/types.ts`)
- Import types (`import/types.ts`)
- Export types (`export/types.ts`)
- Stats types (`stats/types.ts`)
- Progress types (`progress/types.ts`)
- Discovery types (`discovery/types.ts`)
- Challenge types (`challenges/types.ts`)
- Journal types (`journal/types.ts`)

## Test Coverage

- **Test files:** 18
- **Tests:** 264
- **Covered:** Core book CRUD, shelves + book-shelves, reading sessions lifecycle, series + series-books, mood tags + content warnings, discovery engine, journal CRUD + engine + encryption, challenge engine, progress engine, Open Library API + transform, import (Goodreads + StoryGraph), export (CSV + JSON + Markdown), reader DB + upload parsing, sharing, stats, Zod schema validation
- **Gaps:** Sharing visibility logic edge cases (listShareEventsVisibleToUser friends JOIN)

## Parity Status

- **Standalone repo:** MyBooks (archived -- consolidated into hub)
- **Hub integration:** Full parity achieved. All standalone features migrated.

## Key Files

- `src/definition.ts` -- Module definition (4 migrations, 28+ tables)
- `src/index.ts` -- Public API barrel export
- `src/models/schemas.ts` -- All Zod schemas
- `src/db/books.ts` -- Core book CRUD
- `src/db/schema.ts` -- All CREATE TABLE statements
- `src/api/index.ts` -- Open Library API client
- `src/progress/progress-engine.ts` -- Reading speed and progress tracking
- `src/journal/journal-engine.ts` -- Encrypted journal system
