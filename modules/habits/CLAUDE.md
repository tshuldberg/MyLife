# @mylife/habits

## Overview

Habit tracking module with flexible habit types, streak tracking, timed sessions, measurements, heatmap visualization, cycle tracking, and CSV export. Build habits that stick with daily/weekly/monthly tracking, grace periods, negative streaks for habits to avoid, and detailed statistics.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `HABITS_MODULE` | ModuleDefinition | Module registration contract (id: `habits`, prefix: `hb_`, tier: premium) |
| `HabitSchema` / `Habit` | Zod schema + type | Habit record with type, frequency, time-of-day, day-of-week targeting |
| `CompletionSchema` / `Completion` | Zod schema + type | Habit completion log entry |
| `TimedSessionSchema` / `TimedSession` | Zod schema + type | Timed session tracking (meditation, exercise, etc.) |
| `MeasurementSchema` / `Measurement` | Zod schema + type | Numeric measurement tracking (weight, water, etc.) |
| `CyclePeriodSchema`, `CycleSymptomSchema`, `CyclePredictionSchema` | Zod schemas | Menstrual cycle tracking types |
| CRUD functions | Functions | Full CRUD for habits, completions, sessions, measurements, streaks, settings |
| Heatmap functions | Functions | `getHeatmapData`, `getHeatmapRange` |
| Stats functions | Functions | Completion rate by day/time/month/year, overall stats |
| Cycle functions | Functions | Period logging, symptom tracking, prediction, fertility window estimation |
| Export functions | Functions | `exportHabitsCSV`, `exportCompletionsCSV`, `exportAllCSV` |

## Storage

- **Type:** sqlite
- **Table prefix:** `hb_` (habits), `cy_` (cycle tracking)
- **Schema version:** 2
- **Key tables:** `hb_habits`, `hb_completions`, `hb_settings`, `hb_timed_sessions`, `hb_measurements`, `cy_periods`, `cy_symptoms`, `cy_predictions`, `cy_settings`

## Engines

- **heatmap.ts** -- `getHeatmapData`, `getHeatmapRange` (GitHub-style contribution heatmap)
- **stats.ts** -- Completion rate analytics by day-of-week, time-of-day, month, year; overall stats
- **cycle/prediction.ts** -- Menstrual cycle prediction algorithm, fertility window estimation
- **cycle/symptoms.ts** -- Predefined symptom catalog, custom symptom support
- **export.ts** -- CSV export for habits and completions

## Schemas

- `HabitSchema`, `FrequencySchema`, `HabitTypeSchema`, `TimeOfDaySchema`, `DayOfWeekSchema`
- `CompletionSchema`, `TimedSessionSchema`, `MeasurementSchema`
- `CyclePeriodSchema`, `CycleSymptomSchema`, `CyclePredictionSchema`

## Test Coverage

- **Test files:** 1
- **Covered:** Core CRUD, completions, streaks, timed sessions, measurements, cycle tracking, heatmap, stats, export (`__tests__/habits.test.ts`)
- **Gaps:** Grace period edge cases, negative streaks, measurable streaks

## Parity Status

- **Standalone repo:** MyHabits (exists as standalone submodule)
- **Hub integration:** wired (cycle tracking also absorbed into MyHealth)

## Key Files

- `src/definition.ts` -- Module definition (2 migrations, 9 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All Zod schemas and TypeScript types
- `src/db/crud.ts` -- Core habit and completion CRUD
- `src/db/streaks.ts` -- Streak calculation with grace periods
- `src/db/timed-sessions.ts` -- Timed session CRUD
- `src/db/measurements.ts` -- Numeric measurement CRUD
- `src/heatmap.ts` -- Heatmap data generation
- `src/stats.ts` -- Statistical analysis engine
- `src/cycle/prediction.ts` -- Cycle prediction algorithm
