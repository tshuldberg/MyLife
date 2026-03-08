# @mylife/notes

## Overview

Privacy-first markdown note-taking module with wiki-style [[backlinks]], FTS5 full-text search with snippets, folder hierarchy with nesting, tag system, note templates, knowledge graph builder, pinning/favorites, and word/character count tracking. All data local SQLite with FTS5 content-sync triggers.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `NOTES_MODULE` | ModuleDefinition | Module registration contract (id: `notes`, prefix: `nt_`, tier: free) |
| Schemas | Zod | 14 Zod schemas (note, folder, tag, tag-link, note-link, template, setting, create/update inputs, filter) |
| Notes CRUD | Functions | `createNote`, `getNoteById`, `getNotes`, `updateNote`, `deleteNote`, `getNoteCount` |
| Search | Functions | `searchNotes` (FTS5 MATCH with snippet highlighting) |
| Folders CRUD | Functions | `createFolder`, `getFolders`, `getFolderById`, `updateFolder`, `deleteFolder` |
| Tags CRUD | Functions | `createTag`, `getTags`, `getTagById`, `deleteTag`, `getTagsForNote` |
| Links | Functions | `getBacklinksForNote`, `getOutgoingLinksForNote`, `getNoteGraph` |
| Templates CRUD | Functions | `createTemplate`, `getTemplates`, `deleteTemplate` |
| Settings | Functions | `getSetting`, `setSetting` |
| Stats | Functions | `getNotesStats` |
| Markdown engine | Functions | `extractBacklinks`, `countWords`, `extractHeadings`, `countChecklistItems`, `generateSnippet` |

## Storage

- **Type:** sqlite
- **Table prefix:** `nt_`
- **Schema version:** 1
- **Key tables:** `nt_notes` (title, body, word_count, char_count, is_pinned, is_favorite), `nt_folders` (self-referencing parent_id with CASCADE), `nt_tags` (UNIQUE name, color), `nt_note_tags` (composite PK), `nt_note_links` (source/target with CASCADE), `nt_templates`, `nt_settings`
- **FTS5:** `nt_notes_fts` virtual table with content-sync triggers (INSERT, UPDATE, DELETE keep index in sync automatically)
- **Indexes:** 9 indexes on folder_id, is_pinned, is_favorite, tag name, note_id, source/target links

## Engines

- **engine/markdown.ts** -- Pure functions: [[backlink]] extraction via regex (deduplicates), word count with markdown stripping, heading extraction for TOC generation, checklist item counting (checked vs unchecked), snippet generation with truncation

## Key Patterns

- **Auto-backlink detection:** On note creation, the body is parsed for `[[Title]]` patterns. If a matching note exists by title, a link record is auto-created in `nt_note_links`.
- **FTS5 content sync:** Three SQLite triggers (INSERT, DELETE, UPDATE) keep the FTS index synchronized with `nt_notes` automatically. No manual re-indexing needed.
- **Pinned-first sorting:** All note list queries sort pinned notes first, then by the user's chosen sort column.

## Test Coverage

- **Test files:** 2
- **Tests:** 46
- **Covered:** Notes CRUD (basic, with tags, with folder, get/list/filter/update/delete), FTS search (by content, by title, no match, blank query), folders (nested, update, delete nullifies notes), tags (CRUD, delete removes associations), backlinks (auto-detection, graph building), templates CRUD, settings, aggregate stats, markdown engine (backlinks, words, headings, checklists, snippets)

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 7 tables + FTS5)
- `src/index.ts` -- Public API barrel export (50+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, graph/stats interfaces
- `src/db/crud.ts` -- All CRUD operations (28 functions), FTS search, graph builder
- `src/db/schema.ts` -- CREATE TABLE + FTS5 statements (7 tables + virtual table + triggers)
- `src/engine/markdown.ts` -- Markdown parsing utilities (backlinks, words, headings, checklists)
