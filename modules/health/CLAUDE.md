# @mylife/health

## Overview

Consolidated health companion module that absorbs MyMeds (medication tracking), MyFast (fasting timer), and cycle tracking from MyHabits into a unified health dashboard. Adds new health-specific domains: vitals tracking (heart rate, HRV, SpO2, BP, temperature, steps), sleep session logging with quality scoring, health document vault (lab results, prescriptions, insurance cards), cross-domain health goals, and emergency info (ICE card). All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `HEALTH_MODULE` | ModuleDefinition | Module registration contract (id: `health`, prefix: `hl_`, tier: premium, fasting section free) |
| Re-exports from `@mylife/meds` | Functions + Types | Full medication, reminders, adherence, interactions, measurements, mood, analytics, export APIs |
| Re-exports from `@mylife/fast` | ModuleDefinition | `FAST_MODULE` for fasting section |
| Documents CRUD | Functions | `createDocument`, `getDocuments`, `getDocument`, `getDocumentsByType`, `getStarredDocuments`, `updateDocument`, `deleteDocument` |
| Vitals CRUD | Functions | `logVital`, `getVitals`, `getVitalsByType`, `getVitalsByDateRange`, `getVitalAggregates`, `getLatestVital`, `deleteVital` |
| Sleep CRUD | Functions | `logSleep`, `getSleepSessions`, `getSleepByDateRange`, `getLastNightSleep`, `computeQualityScore`, `deleteSleepSession` |
| Goals CRUD | Functions | `createGoal`, `getActiveGoals`, `getGoalById`, `deactivateGoal`, `deleteGoal`, `recordProgress`, `getGoalProgress` |
| Emergency info | Functions | `getEmergencyInfo`, `updateEmergencyInfo` |
| Health settings | Functions | `getHealthSetting`, `setHealthSetting`, `getAllHealthSettings`, `isHealthSyncEnabled`, `setHealthSyncToggle` |
| Migration | Functions | `detectAbsorbedModuleData`, `isAbsorptionMigrated`, `migrateAbsorbedSettings`, `disableAbsorbedModules` |

## Storage

- **Type:** sqlite
- **Table prefix:** `hl_` (new health tables); also reads/writes `md_*` (meds), `ft_*` (fast), `cy_*` (cycle) tables from absorbed modules
- **Schema version:** 1
- **Key tables (new):** `hl_documents`, `hl_vitals`, `hl_sleep_sessions`, `hl_goals`, `hl_goal_progress`, `hl_emergency_info`, `hl_settings`
- **Absorbed tables:** All `md_*`, `ft_*`, `cy_*` tables from meds, fast, and habits modules

## Engines

- **sleep/crud.ts** -- Sleep quality scoring algorithm (`computeQualityScore`)
- **migration/absorb.ts** -- Module absorption migration (detect existing data, migrate settings, disable old modules)
- **settings/index.ts** -- Consolidated health settings across absorbed domains
- Inherits all engines from `@mylife/meds` (adherence, interactions, correlation, mood) and `@mylife/fast` (timer, zones, streaks)

## Schemas

- `HealthDocument`, `DocumentType`, `CreateDocumentInput`, `UpdateDocumentInput`
- `Vital`, `LogVitalInput`, `VitalAggregate`, `VitalType`, `VitalSource`
- `SleepSession`, `LogSleepInput`, `SleepSource`
- `HealthGoal`, `CreateGoalInput`, `GoalProgress`, `GoalDomain`, `GoalPeriod`, `GoalDirection`
- `EmergencyInfo`, `UpdateEmergencyInfoInput`, `BloodType`
- `AbsorbedModuleData`

## Test Coverage

- **Test files:** 3
- **Covered:** Schema validation (`__tests__/schema.test.ts`), business logic (`__tests__/business-logic.test.ts`), module definition contract (`__tests__/definition.test.ts`)
- **Gaps:** Documents CRUD, vitals CRUD, sleep CRUD, goals CRUD, emergency info, migration/absorb logic, settings

## Parity Status

- **Standalone repo:** none (hub-only consolidation module)
- **Hub integration:** wired

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 7+ new tables, 5 tabs, 20+ screens)
- `src/index.ts` -- Public API barrel export (re-exports from meds, fast, plus new health APIs)
- `src/db/schema.ts` -- New health-specific CREATE TABLE statements
- `src/db/migrations.ts` -- Migration definitions
- `src/documents/crud.ts` -- Health document vault CRUD
- `src/vitals/crud.ts` -- Vitals tracking CRUD
- `src/sleep/crud.ts` -- Sleep session logging and quality scoring
- `src/goals/crud.ts` -- Cross-domain health goals
- `src/emergency/crud.ts` -- Emergency/ICE card info
- `src/migration/absorb.ts` -- Absorbed module migration logic
