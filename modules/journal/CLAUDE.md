# @mylife/journal

## Overview

Privacy-first daily journaling module with markdown entries, mood tagging (5-level scale: low/okay/good/great/grateful), custom tag system with normalization, image URI attachments, streak tracking with 1-day grace period, word counting, search across title and body, and a dashboard with aggregate stats. All data local SQLite, zero network, zero telemetry.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `JOURNAL_MODULE` | ModuleDefinition | Module registration contract (id: `journal`, prefix: `jn_`, tier: free) |
| Schemas | Zod | 9 Zod schemas (entry, tag, setting, search result, dashboard, mood enum, create/update inputs, filter) |
| Entry CRUD | Functions | `createJournalEntry`, `getJournalEntryById`, `listJournalEntries`, `updateJournalEntry`, `deleteJournalEntry`, `getEntriesForDate` |
| Search | Functions | `searchJournalEntries` (body + title + tag matching) |
| Tags | Functions | `listJournalTags` |
| Settings | Functions | `getJournalSetting`, `setJournalSetting` |
| Dashboard | Functions | `getJournalDashboard` (entry count, streaks, word totals, latest mood) |
| Stats engine | Functions | `calculateJournalStreak`, `countWords`, `estimateReadingTimeMinutes`, `summarizeMoodDistribution` |

## Storage

- **Type:** sqlite
- **Table prefix:** `jn_`
- **Schema version:** 1
- **Key tables:** `jn_entries` (body, mood, word_count, image_uris_json), `jn_tags` (name UNIQUE, color), `jn_entry_tags` (M2M join with CASCADE deletes, UNIQUE entry+tag), `jn_settings` (key/value)
- **Indexes:** 4 indexes on entry_date, mood, entry_id, tag_id

## Engines

- **engine/stats.ts** - Pure functions: word counting from body text, reading time estimation (200 wpm), journal streak calculation from sorted distinct dates with 1-day grace period, mood distribution summary across entries

## Test Coverage

- **Test files:** 2
- **Tests:** 25+
- **Covered:** Entry CRUD (create, read, update, delete), tag normalization and deduplication, mood tagging and nullable updates, image URI storage, entry date filtering, mood filtering, tag filtering, search text matching, pagination (limit/offset), settings CRUD with seed defaults, dashboard aggregation (entry count, streaks, word totals, monthly words, latest mood), empty journal dashboard, search edge cases (empty/whitespace queries), word counting (empty, whitespace, markdown), reading time estimation (boundaries, scaling), streak calculation (consecutive, grace period, gaps, month/year boundaries, unsorted input), mood distribution (empty, null moods, mixed)

## Key Files

- `src/definition.ts` - Module definition (1 migration, 4 tables)
- `src/index.ts` - Public API barrel export (20+ exports)
- `src/types.ts` - All Zod schemas, TypeScript types, mood enum
- `src/db/crud.ts` - All CRUD operations (11 functions), dashboard aggregation
- `src/db/schema.ts` - CREATE TABLE statements (4 tables)
- `src/db/index.ts` - DB barrel re-export
- `src/engine/stats.ts` - Streak calculator, word counter, reading time, mood distribution
