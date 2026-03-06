# @mylife/surf

## Overview

Surf forecasting and session tracking module using Supabase for cloud storage. Track surf spots with break type, conditions, and favorites. Log surf sessions with wave height, wind, and tide data. Cloud-connected for real-time forecast data and community spot sharing.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `SURF_MODULE` | ModuleDefinition | Module registration contract (id: `surf`, prefix: `sf_`, tier: premium, storageType: supabase) |
| `SurfSpotSchema` / `SurfSpot` | Zod schema + type | Surf spot record (name, location, break type, conditions) |
| `SurfSessionSchema` / `SurfSession` | Zod schema + type | Surf session log (spot, duration, wave height, wind, tide) |
| `SurfBreakTypeSchema` / `SurfBreakType` | Zod schema + type | Break type enum (beach, reef, point) |
| `SurfTideSchema` / `SurfTide` | Zod schema + type | Tide condition enum |
| CRUD functions | Functions | Spots (create, get, update conditions, toggle favorite, delete, count, avg wave height), sessions (create, get, delete, count) |

## Storage

- **Type:** supabase (cloud-connected)
- **Table prefix:** `sf_`
- **Schema version:** 1
- **Key tables:** `sf_spots`, `sf_sessions`

## Engines

None. CRUD module with aggregation queries (average wave height, spot/session counts).

## Schemas

- `SurfSpotSchema`
- `SurfSessionSchema`
- `SurfBreakTypeSchema`
- `SurfTideSchema`

## Test Coverage

- **Test files:** 0 (passWithNoTests in test script)
- **Covered:** none
- **Gaps:** All CRUD operations, aggregation queries

## Parity Status

- **Standalone repo:** MySurf (exists as standalone submodule with full Supabase backend)
- **Hub integration:** wired (Phase 4 cloud migration pending)

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 2 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- Zod schemas and TypeScript types
- `src/db/crud.ts` -- All CRUD operations
- `src/db/schema.ts` -- CREATE TABLE statements
