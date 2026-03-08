# @mylife/garden

## Overview

Garden management module with plant catalog, smart watering reminders with seasonal adjustments, garden journal entries (water, fertilize, prune, harvest, pest treatment), harvest tracking with weight, zone organization, seed inventory, garden statistics, and watering schedule sorted by urgency. Features growing degree day calculations and survival rate analytics. All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `GARDEN_MODULE` | ModuleDefinition | Module registration contract (id: `garden`, prefix: `gd_`, tier: premium) |
| Schemas | Zod | 14 Zod schemas (plant, entry, zone, seed, setting, location/status/action/season enums, create/update inputs, filter) |
| Plant CRUD | Functions | `createPlant`, `getPlantById`, `getPlants`, `updatePlant`, `deletePlant`, `getPlantCount`, `waterPlant` |
| Entry CRUD | Functions | `createEntry`, `getEntriesForPlant`, `getEntriesByDate`, `deleteEntry` |
| Zone CRUD | Functions | `createZone`, `getZones`, `deleteZone` |
| Seed CRUD | Functions | `createSeed`, `getSeeds`, `updateSeedQuantity`, `deleteSeed` |
| Settings | Functions | `getSetting`, `setSetting` |
| Analytics | Functions | `getGardenStats`, `getWateringSchedule` |
| Watering engine | Functions | `calculateNextWaterDate`, `isDaysOverdue`, `getSeason`, `adjustFrequencyForSeason`, `calculateSurvivalRate`, `calculateGDD` |

## Storage

- **Type:** sqlite
- **Table prefix:** `gd_`
- **Schema version:** 1
- **Key tables:** `gd_plants` (name, species, location, zone, waterFrequencyDays, lastWatered, status), `gd_entries` (plant_id FK CASCADE, action, quantityGrams for harvests, imageUri), `gd_zones` (location, sortOrder), `gd_seeds` (quantity, source, expiryDate), `gd_settings`
- **Indexes:** 8 indexes on location, status, plant_id, date, action, zone name

## Engines

- **engine/watering.ts** -- Pure functions: next water date calculation (UTC-safe), days overdue (0 if not overdue, frequencyDays if never watered), month-to-season mapping, seasonal frequency adjustment (summer 0.67x, winter 2.0x, spring 0.85x, fall 1.0x, minimum 1 day), survival rate calculation, growing degree days (GDD = max(0, (Tmax+Tmin)/2 - Tbase))
- **db/crud.ts** -- Garden stats aggregation (counts by status, harvest totals, overdue count via julianday), watering schedule sorted by urgency (never-watered first, then by days until next water)

## Key Patterns

- **waterPlant() transaction:** Updates lastWatered on the plant AND creates a journal entry atomically.
- **Auto-lastWatered on entries:** Creating an entry with action='water' also updates the plant's lastWatered timestamp.
- **Overdue detection via julianday:** Garden stats use `julianday(?) - julianday(last_watered) > water_frequency_days` for efficient SQL-level overdue counting.
- **Urgency-sorted schedule:** Watering schedule orders by `CASE WHEN last_watered IS NULL THEN 0 ELSE julianday(last_watered) + water_frequency_days - julianday(today) END ASC`.

## Test Coverage

- **Test files:** 2
- **Tests:** 41
- **Covered:** Plant CRUD (defaults, full details, get by id, filters, update, delete with cascade, count, waterPlant), entries (create, harvest with quantity, auto-update lastWatered, date range, delete), zones CRUD, seeds CRUD, settings, garden stats, watering schedule, next water date (normal, month boundary, daily), days overdue (not overdue, overdue, never watered, exact due), seasons, frequency adjustment (all seasons, minimum 1), survival rate, GDD

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 5 tables)
- `src/index.ts` -- Public API barrel export (40+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, stats/schedule interfaces
- `src/db/crud.ts` -- All CRUD operations (22 functions), analytics, watering schedule
- `src/db/schema.ts` -- CREATE TABLE statements (5 tables)
- `src/engine/watering.ts` -- Watering calculations, season engine, GDD
