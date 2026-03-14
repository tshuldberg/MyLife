# @mylife/forums

## Overview

Privacy-first community forums module for threaded discussions within the MyLife hub. Reddit/Discourse-inspired with nested replies, voting, karma, moderation tools, and per-community rules. No ads, no tracking. Hybrid storage: Supabase cloud for canonical data with local SQLite cache for offline browsing. Browse without auth, write operations require authentication.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `FORUMS_MODULE` | ModuleDefinition | Module registration (id: `forums`, prefix: `fr_`, tier: free) |
| Schemas | Zod | 23 Zod schemas (community, member, thread, reply, vote, bookmark, user stats, mod action, report, block, rule, tag) |
| Cache CRUD | Functions | 17 local SQLite cache functions for offline reads |
| Cloud Client | Functions | 22 Supabase query functions for cloud operations |

## Storage

- **Type:** supabase + SQLite cache (hybrid)
- **Table prefix:** `fr_`
- **Schema version:** 1
- **Cloud tables (14):** fr_communities, fr_community_members, fr_threads, fr_replies, fr_votes, fr_bookmarks, fr_user_stats, fr_mod_actions, fr_reports, fr_blocks, fr_community_rules, fr_tags, fr_thread_tags
- **Cache tables (6):** fr_communities_cache, fr_community_members_cache, fr_threads_cache, fr_replies_cache, fr_bookmarks_cache, fr_tags_cache
- **FTS:** `search_vector` tsvector columns on fr_communities (display_name A, description B) and fr_threads (title A, body B)
- **RLS:** Anon read for public community content; auth required for writes, votes, bookmarks; mod-only for mod actions

## Key Files

- `src/definition.ts` - ModuleDefinition (1 cache migration, 6 cache tables)
- `src/types.ts` - All Zod schemas and TypeScript types
- `src/index.ts` - Public API barrel export
- `src/db/schema.ts` - SQLite cache CREATE TABLE statements
- `src/db/crud.ts` - Local cache CRUD operations (17 functions)
- `src/cloud/schema.sql` - Supabase tables, RLS policies, triggers
- `src/cloud/client.ts` - Supabase query client (22 functions)

## Test Coverage

- **Test files:** 0 (scaffold, not yet implemented)
