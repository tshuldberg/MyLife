# @mylife/closet

## Overview

Privacy-first wardrobe management module with clothing catalog, outfit builder, wear logging (calendar), cost-per-wear analytics, donation candidate detection, tag-based organization, and dashboard metrics. All data local SQLite, zero network calls, no photo uploads.

## Stack

- TypeScript, Zod 3.24
- SQLite via @mylife/db DatabaseAdapter
- Vitest for testing

## Table Prefix

`cl_`

## Exports

| Name | Type | Description |
|------|------|-------------|
| `CLOSET_MODULE` | ModuleDefinition | Module registration contract (id: `closet`, prefix: `cl_`, tier: premium) |
| Schemas | Zod | 15 Zod schemas (clothing item, outfit, wear log, tag, setting, dashboard, create/update inputs, filter, category/status/condition/laundry enums) |
| Item CRUD | Functions | `createClothingItem`, `getClothingItemById`, `listClothingItems`, `updateClothingItem` |
| Tag CRUD | Functions | `listClosetTags` |
| Outfit CRUD | Functions | `createOutfit`, `getOutfitById`, `listOutfits` |
| Wear log CRUD | Functions | `logWearEvent`, `getWearLogById`, `listWearLogs` |
| Settings | Functions | `getClosetSetting`, `setClosetSetting` |
| Donation | Functions | `listDonationCandidates` |
| Dashboard | Functions | `getClosetDashboard` |
| Analytics engine | Functions | `calculateWardrobeValue`, `calculateCostPerWear`, `summarizeClosetDashboard` |

## Storage

- **Type:** sqlite
- **Table prefix:** `cl_`
- **Schema version:** 1
- **Key tables:** `cl_items` (clothing catalog with category, condition, status, laundry status, wear count), `cl_outfits` (named outfit definitions), `cl_outfit_items` (M2M join, FK CASCADE), `cl_wear_logs` (date-based wear events), `cl_wear_log_items` (M2M join, FK CASCADE), `cl_tags` (unique tag names), `cl_item_tags` (M2M join, FK CASCADE), `cl_settings` (key/value config)
- **Indexes:** 7 indexes on category+status, last_worn_date, outfit_id, date DESC, wear_log_id, item_id, tag_id
- **JSON columns:** `seasons_json`, `occasions_json` on `cl_items` store string arrays as JSON text

## Engines

- **engine/analytics.ts** -- Pure functions: wardrobe value summation (active items only), cost-per-wear calculation (price / times worn, rounded), dashboard summary aggregation from raw metrics

## Test Coverage

- **Test files:** 1
- **Tests:** 40
- **Covered:** Item CRUD (create with defaults, optional fields, trimming, tag normalization, tag dedup), getById (exists, missing), update (partial fields, nullable nulling, status change, tag replacement, missing item), list (empty, ordering, category/status/tag filters, limit), tags (empty, usage counts, orphaned tags), outfit CRUD (create with items, dedup, getById missing/exists, listOutfits empty/ordering), wear logs (individual items, outfit-linked, outfit+individual merge, multi-event increment, getById missing, list empty/date-range/limit), settings (seed default, missing key, create/retrieve, upsert), donation candidates (empty, never worn, non-active excluded, recently worn excluded, custom threshold), dashboard (empty, populated, 30-day window), analytics engine (wardrobe value empty/filter, cost-per-wear null-price/zero-wear/calculation/rounding, summarize), module definition (metadata, table creation, seed)

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 8 tables)
- `src/index.ts` -- Public API barrel export (30+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, and enum types
- `src/db/crud.ts` -- All CRUD operations (16 functions), dashboard, donation candidates
- `src/db/schema.ts` -- CREATE TABLE statements (8 tables)
- `src/engine/analytics.ts` -- Wardrobe value, cost-per-wear, dashboard summary
