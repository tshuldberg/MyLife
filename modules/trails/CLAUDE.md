# @mylife/trails

## Overview

Privacy-first outdoor activity tracker for hiking, running, cycling, and walking. Records GPS trails with elevation profiles, supports geotagged waypoints and photos, and provides aggregate trail statistics. All GPS data stored locally on-device via SQLite. Competes with AllTrails and Komoot without uploading location data to the cloud.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `TRAILS_MODULE` | ModuleDefinition | Module registration contract (id: `trails`, prefix: `tr_`, tier: premium) |
| Schemas | Zod | 11 Zod schemas (trail, recording, waypoint, photo, stats, activity type, difficulty, create/update inputs) |
| Trail CRUD | Functions | `createTrail`, `getTrail`, `getTrails`, `updateTrail`, `deleteTrail` |
| Recording CRUD | Functions | `createRecording`, `getRecording`, `getRecordings`, `getRecordingsByTrail`, `deleteRecording` |
| Waypoints | Functions | `createWaypoint`, `getWaypointsByRecording` |
| Stats | Functions | `getTrailStats` (aggregate distance, elevation, recordings, avg pace) |
| Geo engine | Functions | `haversineDistance`, `calculateElevationGain`, `calculatePace`, `formatDuration`, `estimateCalories` |

## Storage

- **Type:** sqlite
- **Table prefix:** `tr_`
- **Schema version:** 1
- **Key tables:** `tr_trails` (name, difficulty CHECK constraint, distance, elevation, lat/lng, region), `tr_recordings` (trail FK, activity_type CHECK, started_at, duration, gpx_data), `tr_waypoints` (recording FK CASCADE, lat/lng, elevation, timestamp, accuracy), `tr_photos` (recording FK SET NULL, trail FK SET NULL, uri, caption, taken_at)
- **Indexes:** 11 indexes on name, difficulty, region, saved status, trail_id, started_at, activity_type, recording_id, timestamp

## Engines

- **engine/geo.ts** -- Pure functions: Haversine great-circle distance (R=6371000m), elevation gain calculation with 3m noise filter, pace in min/km, duration formatting ("1h 23m"), calorie estimation from distance + elevation + weight

## Test Coverage

- **Test files:** 2
- **Tests:** 30+
- **Covered:** Trail CRUD (create, read, list, filter by difficulty, update, delete), Recording CRUD (create, link to trail, read, list, filter by activity type, get by trail, delete with waypoint cascade), Waypoint create/retrieve (full and minimal fields, ordering), Trail stats aggregation (empty state, multi-recording), Haversine distance (same point, SF-LA, 1-degree, antimeridian, southern hemisphere), Elevation gain (empty, flat, positive-only, noise filter, threshold boundary, descending, undulating), Pace (normal, zero/negative distance, zero duration), Duration formatting (zero, sub-hour, exact hour, hours+minutes, negative), Calorie estimation (flat, with elevation, zero, weight scaling)

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 4 tables)
- `src/index.ts` -- Public API barrel export (50+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, create/update input schemas
- `src/db/crud.ts` -- All CRUD operations (14 functions), trail stats
- `src/db/schema.ts` -- CREATE TABLE statements (4 tables), indexes
- `src/db/index.ts` -- DB barrel export
- `src/engine/geo.ts` -- Haversine, elevation gain, pace, duration, calories
