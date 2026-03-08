# @mylife/cycle

## Overview

Privacy-first period and fertility tracker. Logs cycles, daily symptoms (physical and mood categories with intensity), flow levels, and free-text notes. On-device weighted moving average prediction algorithm estimates next period start, fertile window, and confidence score. No cloud, no accounts, no network requests. All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `CYCLE_MODULE` | ModuleDefinition | Module registration contract (id: `cycle`, prefix: `cy_`, tier: premium) |
| Schemas | Zod | 14 Zod schemas (cycle, cycle day, symptom, enums, create/update inputs, stats, prediction) |
| Cycle CRUD | Functions | `createCycle`, `getCycle`, `getCycles`, `endCycle`, `deleteCycle`, `getCycleCount` |
| Cycle Day CRUD | Functions | `createCycleDay`, `getCycleDaysByDate`, `getCycleDaysByCycle`, `getCycleDayByDate`, `updateCycleDay`, `deleteCycleDay` |
| Symptom CRUD | Functions | `getSymptomsForDay`, `addSymptom`, `deleteSymptom` |
| Analytics | Functions | `getCycleStats`, `getSymptomFrequencies` |
| Prediction engine | Functions | `calculateAverageCycleLength`, `calculateAveragePeriodLength`, `predictNextPeriod`, `getCurrentPhase`, `isLateByDays` |
| Constants | Data | `PHYSICAL_SYMPTOMS` (7 symptoms), `MOOD_SYMPTOMS` (6 symptoms) |

## Storage

- **Type:** sqlite
- **Table prefix:** `cy_`
- **Schema version:** 1
- **Key tables:** `cy_cycles` (start/end dates, period_end_date, computed lengths), `cy_cycle_days` (date UNIQUE, FK to cycle, phase, flow_level, notes), `cy_symptoms` (FK CASCADE to cycle_days, category, symptom, intensity)
- **Indexes:** 5 indexes on start_date, date, cycle_id, cycle_day_id, category

## Engines

- **engine/prediction.ts** -- Pure functions: weighted moving average cycle length (last 6 cycles, recency-weighted), period length averaging, next period prediction with confidence score based on cycle regularity (stddev/avg), fertile window estimate (ovulation minus 14 days, +/-3 day window), current phase calculation (scaled to user's avg cycle length), late-by-days checker. Filters tracking gaps (>90 days).

## Test Coverage

- **Test files:** 2
- **Tests:** 30+
- **Covered:** Cycle CRUD (create, get, list, end, delete, count), cycle day CRUD (create with symptoms, date queries, cycle queries, update fields, cascade delete), symptom operations (add, delete, default intensity), analytics (empty stats, completed cycle stats, symptom frequencies), prediction engine (weighted average with recency bias, gap filtering, period prediction with fertile window and confidence, phase calculation for all 4 phases with cycle scaling, late detection)

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 3 tables)
- `src/index.ts` -- Public API barrel export (60+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, constants
- `src/db/crud.ts` -- All CRUD operations (17 functions), stats, frequencies
- `src/db/schema.ts` -- CREATE TABLE statements (3 tables)
- `src/engine/prediction.ts` -- Prediction algorithm, phase calculator, late checker
