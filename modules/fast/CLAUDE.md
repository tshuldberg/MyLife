# @mylife/fast

## Overview

Intermittent fasting timer module. Track fasting sessions with preset protocols (16:8, 18:6, 20:4, OMAD, etc.), fasting zone progression, water intake logging, weight tracking, goal setting with progress, streak tracking, and CSV export. Free tier module, no network required.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `FAST_MODULE` | ModuleDefinition | Module registration contract (id: `fast`, prefix: `ft_`, tier: free) |
| `Fast`, `ActiveFast`, `Protocol`, `WeightEntry`, `StreakCache` | Types | Core domain types |
| `computeTimerState`, `formatDuration` | Functions | Timer state machine for active fasting UI |
| `PRESET_PROTOCOLS` | Data | Built-in fasting protocol definitions |
| `FASTING_ZONES`, `getCurrentFastingZone`, `getCurrentZoneProgress` | Functions | Fasting zone progression (anabolic, catabolic, fat burning, ketosis, autophagy) |
| `exportFastsCSV`, `exportWeightCSV` | Functions | CSV data export |
| CRUD functions | Functions | Full CRUD for fasts, active fast, protocols, weight, water, goals, streaks, settings, notifications |
| Stats functions | Functions | Streak calculation, aggregation, summary stats |

## Storage

- **Type:** sqlite
- **Table prefix:** `ft_`
- **Schema version:** 2
- **Key tables:** `ft_fasts`, `ft_weight_entries`, `ft_protocols`, `ft_settings`, `ft_streak_cache`, `ft_active_fast`, `ft_water_intake`, `ft_goals`, `ft_goal_progress`, `ft_notifications_config`

## Engines

- **timer.ts** -- `computeTimerState` (state machine for active fast), `formatDuration`
- **protocols.ts** -- `PRESET_PROTOCOLS` (16:8, 18:6, 20:4, OMAD, 36h, 48h, 72h, custom)
- **zones.ts** -- `FASTING_ZONES`, `getCurrentFastingZone`, `getCurrentZoneProgress` (5-zone progression)
- **stats/aggregation.ts** -- Period-based aggregation (daily, weekly, monthly)
- **stats/streaks.ts** -- Streak calculation with grace period support
- **stats/summary.ts** -- Summary statistics (total fasts, avg duration, success rate)
- **export.ts** -- CSV export for fasts and weight entries

## Schemas

- `Fast`, `ActiveFast`, `Protocol`, `WeightEntry`, `StreakCache` (TypeScript interfaces in `types.ts`)
- Water intake, goal, notification config types
- Zod validation in CRUD layer

## Test Coverage

- **Test files:** 1
- **Covered:** Core CRUD, timer, protocols, zones, streaks, aggregation, water, goals, notifications (`__tests__/fast.test.ts`)
- **Gaps:** Export functions, summary stats

## Parity Status

- **Standalone repo:** MyFast (exists as standalone submodule)
- **Hub integration:** wired (also absorbed into MyHealth module)

## Key Files

- `src/definition.ts` -- Module definition (2 migrations, 10 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All TypeScript interfaces
- `src/timer.ts` -- Fasting timer state machine
- `src/zones.ts` -- Fasting zone progression engine
- `src/protocols.ts` -- Preset protocol definitions
- `src/db/fasts.ts` -- Core fast CRUD
- `src/db/water.ts` -- Water intake CRUD
- `src/db/goals.ts` -- Fasting goals CRUD
- `src/stats/streaks.ts` -- Streak calculation
