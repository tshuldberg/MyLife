# @mylife/voice

## Overview

Private on-device voice dictation and transcription module. Records, transcribes, and organizes voice notes with text analysis utilities (word count, reading time, keyword extraction, summarization). All data local SQLite, no network required. Free tier, no subscription needed.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `VOICE_MODULE` | ModuleDefinition | Module registration contract (id: `voice`, prefix: `vc_`, tier: free) |
| Schemas | Zod | 5 Zod schemas (Transcription, VoiceNote, VoiceSetting, TranscriptionStats, VoiceCommand) |
| Transcription CRUD | Functions | `createTranscription`, `getTranscription`, `getTranscriptions`, `deleteTranscription` |
| Voice Note CRUD | Functions | `createVoiceNote`, `getVoiceNote`, `getVoiceNotes`, `updateVoiceNote`, `deleteVoiceNote`, `toggleFavorite` |
| Settings | Functions | `getSetting`, `setSetting`, `getSettings` |
| Stats | Functions | `getTranscriptionStats` (total count, total/avg duration, by language) |
| Text engine | Functions | `calculateWordCount`, `calculateReadingTime`, `extractKeywords`, `summarizeText`, `formatDuration` |

## Storage

- **Type:** sqlite
- **Table prefix:** `vc_`
- **Schema version:** 1
- **Key tables:** `vc_transcriptions` (text, duration, language, confidence, audio URI), `vc_voice_notes` (title, transcription FK, tags, favorite flag), `vc_settings` (key/value)
- **Indexes:** 5 indexes on created_at, language, favorite, transcription_id

## Engines

- **engine/text.ts** -- Pure functions: word count, reading time estimation (200 wpm), keyword extraction via word frequency with stop word filtering, text summarization (first N sentences), duration formatting (Xm Ys)

## Test Coverage

- **Test files:** 2
- **Tests:** 25+
- **Covered:** Transcription CRUD (create, get, list with pagination, delete, nullable fields), Voice Note CRUD (create, link to transcription, get, list, update, delete), favorite toggling, settings (get/set/upsert/list), transcription stats (empty db, aggregates, null language grouping), word count, reading time, keyword extraction with stop words, summarization, duration formatting

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 3 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All Zod schemas and TypeScript types
- `src/db/schema.ts` -- CREATE TABLE statements (3 tables)
- `src/db/crud.ts` -- All CRUD operations (14 functions)
- `src/db/index.ts` -- DB barrel export
- `src/engine/text.ts` -- Text processing pure functions (5 functions)
