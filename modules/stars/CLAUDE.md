# @mylife/stars

## Overview

Privacy-first astrology and birth chart module. On-device zodiac calculations, moon phase tracking, compatibility scoring, daily readings with tarot card of the day, and transit logging. All data local SQLite, zero network requests for astrological functionality.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `STARS_MODULE` | ModuleDefinition | Module registration contract (id: `stars`, prefix: `st_`, tier: premium) |
| Schemas | Zod | 15 Zod schemas (zodiac sign, element, moon phase, aspect, tarot card, birth profile, transit, daily reading, saved chart, compatibility result, stats, create/update inputs) |
| Profile CRUD | Functions | `createBirthProfile`, `getBirthProfile`, `getBirthProfiles`, `updateBirthProfile`, `deleteBirthProfile` |
| Transit CRUD | Functions | `createTransit`, `getTransitsByProfile`, `getTransitsByDate` |
| Reading CRUD | Functions | `createDailyReading`, `getDailyReading` |
| Chart CRUD | Functions | `createSavedChart`, `getSavedChartsByProfile` |
| Stats | Functions | `getStarsStats` |
| Engine | Functions | `getMoonPhase`, `getZodiacSign`, `getZodiacElement`, `calculateCompatibility`, `getTarotCardOfDay` |

## Storage

- **Type:** sqlite
- **Table prefix:** `st_`
- **Schema version:** 1
- **Key tables:** `st_birth_profiles` (name, birth data, sun/moon/rising signs), `st_transits` (planet, sign, aspect, FK CASCADE), `st_daily_readings` (moon phase, moon sign, summary, tarot card, UNIQUE profile+date, FK CASCADE), `st_saved_charts` (chart type, title, JSON data, FK CASCADE)
- **Indexes:** 7 indexes on name, profile_id, date, profile+date

## Engines

- **engine/astro.ts** -- Pure functions: moon phase from synodic period (29.53059 days, reference JD 2451550.1), zodiac sign from standard date boundaries, element mapping (fire/earth/air/water), element-based compatibility scoring (40-90 range), deterministic tarot card of the day (78-card deck cycling by Julian Day)

## Test Coverage

- **Test files:** 2
- **Tests:** 30+
- **Covered:** Birth profile CRUD (create, get, list, update, delete, cascade), transit CRUD (create, get by profile, get by date), daily reading CRUD (create, get, unique constraint), saved chart CRUD, stats aggregation, moon phase calculation (determinism, cycling, edge dates), zodiac sign boundaries (all 12 signs), element mapping (all 12 signs), compatibility scoring (same sign, same element, compatible, challenging, symmetry, range validation), tarot card (determinism, coverage, Major/Minor Arcana validation)

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 4 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All Zod schemas, TypeScript types (15 schemas)
- `src/db/schema.ts` -- CREATE TABLE statements (4 tables)
- `src/db/crud.ts` -- All CRUD operations (13 functions), stats
- `src/engine/astro.ts` -- Astrology calculation engine (5 pure functions)
