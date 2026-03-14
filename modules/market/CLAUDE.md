# @mylife/market

## Overview

Privacy-first marketplace module for buying, selling, and trading within the MyLife community. No ads, no tracking, no platform fees. Combines Facebook Marketplace reach with Craigslist simplicity. Hybrid storage: Supabase cloud for canonical data with local SQLite cache for offline browsing. Browse without auth, write operations require authentication.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `MARKET_MODULE` | ModuleDefinition | Module registration (id: `market`, prefix: `mk_`, tier: free) |
| Schemas | Zod | 17 Zod schemas (listing, category, conversation, message, watchlist, review, seller stats, saved search, report, block) |
| Cache CRUD | Functions | 13 local SQLite cache functions for offline reads |
| Cloud Client | Functions | 15 Supabase query functions for cloud operations |

## Storage

- **Type:** supabase + SQLite cache (hybrid)
- **Table prefix:** `mk_`
- **Schema version:** 1
- **Cloud tables (12):** mk_categories, mk_listings, mk_listing_photos, mk_conversations, mk_messages, mk_watchlist, mk_reviews, mk_seller_stats, mk_saved_searches, mk_reports, mk_blocks
- **Cache tables (6):** mk_categories_cache, mk_listings_cache, mk_listing_photos_cache, mk_watchlist_cache, mk_conversations_cache, mk_messages_cache
- **PostGIS:** Location-based search via `mk_listings_within_radius` RPC
- **FTS:** `search_vector` tsvector column on mk_listings (weighted: title A, description B)
- **RLS:** Anon read for active listings/categories/reviews/stats; auth required for writes

## Key Files

- `src/definition.ts` - ModuleDefinition (1 cache migration, 6 cache tables)
- `src/types.ts` - All Zod schemas and TypeScript types
- `src/index.ts` - Public API barrel export
- `src/db/schema.ts` - SQLite cache CREATE TABLE statements
- `src/db/crud.ts` - Local cache CRUD operations (13 functions)
- `src/cloud/schema.sql` - Supabase tables, RLS policies, triggers, RPC functions
- `src/cloud/client.ts` - Supabase query client (15 functions)

## Test Coverage

- **Test files:** 0 (scaffold, not yet implemented)
