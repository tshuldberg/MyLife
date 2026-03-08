# @mylife/mood

## Overview

Emotional wellness tracker with granular mood logging (1-10 scale), Plutchik's 24-emotion tagging with intensity levels, activity correlation analysis (Pearson r coefficient), guided breathing exercises (3 patterns), Year-in-Pixels visualization support, streak tracking, and analytics dashboard. All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `MOOD_MODULE` | ModuleDefinition | Module registration contract (id: `mood`, prefix: `mo_`, tier: premium) |
| Schemas | Zod | 16 Zod schemas (entry, activity, emotion tag, entry-activity, streak, breathing pattern/session, setting, create/update inputs, filter) |
| Entry CRUD | Functions | `createMoodEntry`, `getMoodEntryById`, `getMoodEntries`, `getMoodEntriesByDate`, `deleteMoodEntry`, `getMoodEntryCount` |
| Emotion tags | Functions | `getEmotionTagsForEntry` |
| Activity CRUD | Functions | `createActivity`, `getActivities`, `getActivityById`, `updateActivity`, `deleteActivity`, `getActivitiesForEntry`, `seedDefaultActivities` |
| Breathing sessions | Functions | `createBreathingSession`, `getBreathingSessions` |
| Settings | Functions | `getSetting`, `setSetting` |
| Analytics | Functions | `getDailyAverages`, `getMoodDashboard`, `getActivityCorrelations`, `getTopEmotions` |
| Streak engine | Functions | `calculateStreaks`, `scoreToPixelColor`, `pearsonCorrelation`, `isSignificantCorrelation` |
| Breathing engine | Functions | `getBreathingCycleSteps`, `getCycleDuration`, `getCyclesForDuration` |
| Constants | Data | `MoodScoreDescriptors`, `BREATHING_PATTERNS`, `DEFAULT_ACTIVITIES` (15 activities across 4 categories) |

## Storage

- **Type:** sqlite
- **Table prefix:** `mo_`
- **Schema version:** 1
- **Key tables:** `mo_entries` (score 1-10 CHECK constraint), `mo_activities` (with category, is_default, sort_order), `mo_emotion_tags` (Plutchik emotion + intensity 1-3, FK CASCADE), `mo_entry_activities` (M2M join, FK CASCADE), `mo_breathing_sessions` (pattern, duration, cycles), `mo_settings` (key/value)
- **Indexes:** 9 indexes on date, score, entry_id, activity_id, pattern, completed_at

## Engines

- **engine/streak.ts** -- Pure functions: streak calculation from sorted distinct dates, mood score to Year-in-Pixels hex color mapping (10 colors), Pearson correlation coefficient with significance threshold (|r| >= 0.3)
- **engine/breathing.ts** -- Pure functions: breathing cycle step generation for 3 patterns (box 4-4-4-4, 4-7-8, relaxing 4-2-6), cycle duration calculation, cycles-per-target-duration
- **db/crud.ts** -- Dashboard aggregation (today/week/month averages, streaks), activity correlations with Pearson r, daily averages, top emotions by date range

## Test Coverage

- **Test files:** 2
- **Tests:** 40
- **Covered:** Entry CRUD with emotions and activities, score validation, filters, date queries, cascading deletes, activity CRUD, seed defaults idempotency, breathing sessions, settings, daily averages, top emotions, streak calculation (consecutive, gaps, longest vs current), pixel color mapping, Pearson correlation (insufficient data, perfect +1/-1, zero variance, moderate), significance threshold, breathing cycle steps, cycle duration

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 6 tables)
- `src/index.ts` -- Public API barrel export (55+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, constants, Plutchik emotion enum
- `src/db/crud.ts` -- All CRUD operations (22 functions), dashboard, correlations
- `src/db/schema.ts` -- CREATE TABLE statements (6 tables)
- `src/engine/streak.ts` -- Streak calculator, pixel colors, Pearson correlation
- `src/engine/breathing.ts` -- Breathing pattern engine
