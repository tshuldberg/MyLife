# @mylife/homes

## Overview

Real estate listing tracker module using Drizzle ORM + tRPC for cloud-connected storage. Browse, save, and track home listings with tour scheduling, market metrics, and mortgage calculations. Requires authentication for cloud sync.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `HOMES_MODULE` | ModuleDefinition | Module registration contract (id: `homes`, prefix: `hm_`, tier: premium, storageType: drizzle) |
| `HomeListingSchema` / `HomeListing` | Zod schema + type | Listing record (address, price, beds, baths, sqft, status) |
| `HomeTourSchema` / `HomeTour` | Zod schema + type | Scheduled tour record |
| `HomeListingStatusSchema` / `HomeListingStatus` | Zod schema + type | Listing status enum |
| `HomeMarketMetrics` | Type | Market metrics (avg price, median, days on market) |
| CRUD functions | Functions | Listings (create, get, toggle saved, update status, delete, count, metrics), tours (create, get by listing, delete) |

## Storage

- **Type:** drizzle (Drizzle ORM + tRPC, cloud-connected)
- **Table prefix:** `hm_`
- **Schema version:** 1
- **Key tables:** `hm_listings`, `hm_tours`

## Engines

None. CRUD module with market metrics aggregation.

## Schemas

- `HomeListingSchema`
- `HomeTourSchema`
- `HomeListingStatusSchema`

## Test Coverage

- **Test files:** 0 (passWithNoTests in test script)
- **Covered:** none
- **Gaps:** All CRUD operations, market metrics, tour management

## Parity Status

- **Standalone repo:** MyHomes (exists as standalone submodule)
- **Hub integration:** wired

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 2 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- Zod schemas and TypeScript types
- `src/db/crud.ts` -- All CRUD operations
- `src/db/schema.ts` -- CREATE TABLE statements
