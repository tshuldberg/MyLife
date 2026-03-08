# @mylife/mail

## Overview

Self-hosted private email client module with multi-account IMAP support, folder management, draft composition, starring, read/unread tracking, threaded conversation grouping, and full-text search. All metadata stored in local SQLite. Requires authentication and network for mail server communication.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `MAIL_MODULE` | ModuleDefinition | Module registration contract (id: `mail`, prefix: `ml_`, tier: premium) |
| Schemas | Zod | 15 Zod schemas (account, message, folder, draft, filter/rule, stats, create/update inputs, message filter) |
| Account CRUD | Functions | `createAccount`, `getAccount`, `getAccounts`, `updateAccount`, `deleteAccount` |
| Message CRUD | Functions | `createMessage`, `getMessage`, `getMessages`, `getMessagesByAccount`, `markAsRead`, `toggleStar`, `moveToFolder`, `deleteMessage` |
| Draft CRUD | Functions | `createDraft`, `getDrafts`, `updateDraft`, `deleteDraft` |
| Folder CRUD | Functions | `createFolder`, `getFolders` |
| Stats | Functions | `getMailStats` (unread count, total, starred, drafts, by folder) |
| Search engine | Functions | `searchMessages`, `groupByThread`, `getUnreadCount`, `filterByDateRange` |
| Constants | Data | `SYSTEM_FOLDERS` (6 default folders: Inbox, Sent, Drafts, Starred, Trash, Spam) |

## Storage

- **Type:** sqlite
- **Table prefix:** `ml_`
- **Schema version:** 1
- **Key tables:** `ml_accounts` (email config, is_active), `ml_messages` (subject, from, to as JSON array, body, read/starred flags, folder, received_at), `ml_drafts` (in-progress compositions, to as JSON array), `ml_folders` (custom + system folders with sort_order)
- **Indexes:** 8 indexes on account_id, folder, received_at, is_read, is_starred, compound account+folder

## Engines

- **engine/search.ts** -- Pure functions: full-text search across subject/from/body, thread grouping by normalized subject (strips Re:/Fwd:/FW: prefixes), unread counting, date range filtering

## Test Coverage

- **Test files:** 2
- **Tests:** 30+
- **Covered:** Account CRUD (create, get, list, update, delete, cascade to messages), Message CRUD (create with defaults, custom folder/receivedAt, get by id, folder filter, account filter, mark as read, toggle star, move to folder, delete), Draft CRUD (create empty/with content, list with account filter, update, delete), Folder CRUD (create, sort order, account filter), Stats (empty db, computed stats with unread/starred/drafts/by-folder), Search engine (empty query, subject/from/body matching, case insensitivity, no matches), Thread grouping (same subject, Re: prefix, Fwd:/FW:, mixed prefixes, empty input), Unread counting (mixed, all read, none read, empty), Date range filtering (inclusive bounds, no matches, single day)

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 4 tables)
- `src/index.ts` -- Public API barrel export (60+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, constants, system folders
- `src/db/crud.ts` -- All CRUD operations (21 functions), stats aggregation
- `src/db/schema.ts` -- CREATE TABLE statements (4 tables)
- `src/engine/search.ts` -- Search, threading, unread count, date filter
