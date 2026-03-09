# @mylife/flash

## Overview

Privacy-first spaced repetition flashcard engine using an FSRS-inspired scheduling algorithm. Supports deck organization, basic and reversed card types, tag-based filtering, four-grade review system (again/hard/good/easy), study streak tracking, and a dashboard with due/new/reviewed counts. All data local SQLite.

## Stack

TypeScript, Zod 3.24, SQLite (via @mylife/db DatabaseAdapter), Vitest

## Table Prefix

`fl_`

## Exports

| Name | Type | Description |
|------|------|-------------|
| `FLASH_MODULE` | ModuleDefinition | Module registration contract (id: `flash`, prefix: `fl_`, tier: premium) |
| Schemas | Zod | 11 Zod schemas (FlashCardType, CardQueue, CardRating, Deck, Flashcard, ReviewLog, FlashSetting, FlashDashboard, CreateDeckInput, UpdateDeckInput, CreateFlashcardInput) |
| Deck CRUD | Functions | `listDecks`, `getDeckById`, `createDeck`, `updateDeck` |
| Card CRUD | Functions | `createFlashcards`, `listCardsForDeck`, `listDueFlashcards`, `getFlashcardById` |
| Review system | Functions | `rateFlashcard`, `listReviewLogsForCard` |
| Settings | Functions | `getFlashSetting`, `setFlashSetting` |
| Dashboard | Functions | `getFlashDashboard` (deck/card/new/due/reviewed counts, streaks) |
| Engine | Functions | `scheduleFlashcard` (FSRS-inspired scheduling), `calculateStudyStreak` (consecutive day streaks) |
| Constants | Data | `DEFAULT_FLASH_DECK_ID` |

## Storage

- **Type:** sqlite
- **Table prefix:** `fl_`
- **Schema version:** 1
- **Key tables:** `fl_decks` (with parent_id self-reference, is_default flag), `fl_cards` (queue states: new/learning/review/suspended/buried, ease factor, interval tracking, tags as JSON), `fl_review_logs` (rating history with before/after scheduling), `fl_settings` (key/value pairs for dailyNewLimit, dailyReviewLimit, dailyStudyTarget)
- **Indexes:** 4 indexes on deck_id+queue+due_at, note_id, card_id+reviewed_at, reviewed_at

## Engines

- **engine/scheduler.ts** -- Pure functions: FSRS-inspired card scheduling with four ratings (again: 10min re-study + lapse increment, hard: 1.2x interval, good: ease-factor interval, easy: (ease+0.5)x interval), ease factor clamping (1.3 to 3.0/3.2), study streak calculation from sorted distinct dates (current streak requires reference date match, longest streak tracks historical best)
- **db/crud.ts** -- Full CRUD for decks, cards, review logs, settings. Dashboard aggregation with deck/card/new/due/reviewed counts plus streak computation. Due card queries with deck filtering, queue exclusions, and configurable limits.

## Test Coverage

- **Test files:** 2
- **Tests:** 34+
- **Covered:** Deck CRUD (create, get, update, list ordering, card count updates, non-existent returns), Card CRUD (basic creation, reversed pairs, empty back skips reversed, tag normalization and deduplication, get by ID, empty deck listing), Review system (rating transitions for all four grades, multiple review history, learning queue reentry on again, suspended/buried exclusion from due list, limit parameter, cross-deck due listing), Settings (seeded defaults, upsert, custom keys, null for non-existent), Dashboard (fresh database zeroes, streak computation, new card counting), Scheduler engine (all four rating calculations including interval/ease/queue/lapse, ease clamping at floor and ceiling, interval minimums, cross-rating state tracking, recovery from repeated failures), Study streaks (empty input, single day, missed reference date, consecutive days, gap detection, past longest vs current, unsorted input, month and year boundaries)

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 4 tables)
- `src/index.ts` -- Public API barrel export (30+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, input schemas
- `src/db/schema.ts` -- CREATE TABLE statements (4 tables), indexes, seed data
- `src/db/crud.ts` -- All CRUD operations (13 functions), dashboard, due card queries
- `src/db/index.ts` -- DB barrel re-export
- `src/engine/scheduler.ts` -- FSRS-inspired scheduler, streak calculator
