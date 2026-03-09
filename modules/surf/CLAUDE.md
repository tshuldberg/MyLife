# @mylife/surf

## Overview

Surf forecasting, session tracking, and spot intelligence module. Dual storage: local SQLite (via `DatabaseAdapter`) for offline-first CRUD and Supabase cloud adapters for synced reads/writes when authenticated. Features: 200+ curated California spots, hourly forecast cache with swell components, NOAA buoy + tide data, AI-generated forecast narratives, configurable surf alerts, community reviews/photos/guides, GPS wave detection, coastal trail tracking with GPX export, and a spot rating engine (swell/wind/tide/consistency scoring).

## Exports

### Module Definition
| Name | Type | Description |
|------|------|-------------|
| `SURF_MODULE` | ModuleDefinition | id: `surf`, prefix: `sf_`, tier: premium, storageType: supabase, schemaVersion: 3 |

### Zod Schemas (32 schemas)
| Domain | Schemas |
|--------|---------|
| Spot | `SurfBreakTypeSchema`, `SurfTideSchema`, `SkillLevelSchema`, `HazardSchema`, `RegionSchema`, `SurfSpotSchema`, `CreateSpotInputSchema`, `SurfSessionSchema` |
| Forecast | `ConditionColorSchema`, `WindLabelSchema`, `SwellComponentSchema`, `ForecastSchema`, `TidePointSchema`, `NarrativeSchema`, `BuoyReadingSchema`, `SunTimesSchema` |
| Alerts | `AlertParameterSchema`, `AlertOperatorSchema`, `AlertJoinSchema`, `AlertRuleSchema`, `SpotAlertSchema`, `SpotAlertNotificationSchema` |
| Community | `SpotReviewSchema`, `SpotPhotoSchema`, `SpotGuideSchema` |
| User | `UserPinSchema`, `SessionWaveSchema` |
| Trails | `TrailDifficultySchema`, `TrailPointSchema`, `TrailSchema`, `RecordedHikeSchema`, `OfflineRegionSchema` |

### Engine Interfaces (10 types)
`SpotProfile`, `SwellInput`, `ForecastInput`, `RatingResult`, `GpsTrackPoint`, `DetectedWave`, `WaveDetectionOptions`, `TrailTrackPoint`, `TrailSummary`, `GpxTrackPoint`

### Local CRUD (40+ functions via `DatabaseAdapter`)
| Domain | Functions |
|--------|-----------|
| Spots | `createSpot`, `getSpots`, `getSpotById`, `getSpotBySlug`, `updateSpotConditions`, `updateSpotProfile`, `toggleSpotFavorite`, `deleteSpot`, `countSpots`, `countFavoriteSpots`, `getAverageWaveHeightFt` |
| Sessions | `createSession`, `getSessions`, `deleteSession`, `countSessions` |
| Forecasts | `upsertForecast`, `upsertSwellComponents`, `getSpotForecast` |
| Tides | `upsertTide`, `getTides` |
| Buoy | `upsertBuoyReading`, `getLatestBuoyReading`, `getRecentBuoyReadings` |
| Narratives | `upsertNarrative`, `getSpotNarrative`, `getRegionNarrative` |
| Pins | `createUserPin`, `getUserPins`, `deleteUserPin` |
| Alerts | `createSpotAlert`, `getSpotAlerts`, `setSpotAlertActive`, `deleteSpotAlert` |
| Reviews | `createSpotReview`, `getSpotReviews`, `deleteSpotReview` |
| Photos | `createSpotPhoto`, `getSpotPhotos`, `deleteSpotPhoto` |
| Guides | `upsertSpotGuide`, `getSpotGuide` |
| Waves | `recordSessionWave`, `getSessionWaves` |
| Trails | `upsertTrailHikeSummary`, `getTrailHikeSummaries` |

### Cloud Adapters (30 functions via `SupabaseClient`)
All cloud functions accept `SupabaseClient` as first parameter for dependency injection. Mirrors local CRUD signatures but queries remote Supabase tables.

| Domain | Functions |
|--------|-----------|
| Spots | `cloudGetSpotsByRegion`, `cloudGetSpotBySlug`, `cloudGetNearbySpots` (PostGIS RPC), `cloudGetUserFavoriteSpots`, `cloudGetSpotGuide`, `cloudToggleFavorite` |
| Forecasts | `cloudGetSpotForecast`, `cloudGetTides`, `cloudGetLatestBuoyReading`, `cloudGetRecentBuoyReadings`, `cloudGetSpotNarrative`, `cloudGetRegionNarrative`, `cloudVoteOnNarrative` |
| Alerts | `cloudCreateSpotAlert`, `cloudGetSpotAlerts`, `cloudSetSpotAlertActive`, `cloudDeleteSpotAlert` |
| Community | `cloudGetSpotReviews`, `cloudGetSpotPhotos`, `cloudCreateSpotReview`, `cloudDeleteSpotReview` |
| User | `cloudCreateUserPin`, `cloudGetUserPins`, `cloudDeleteUserPin`, `cloudCreateSurfSession`, `cloudGetSurfSessions`, `cloudDeleteSurfSession` |
| Trails | `cloudSyncTrailHikeSummary`, `cloudGetTrailHikeSummaries` |

### Rating Engines (pure math)
`computeSpotRating`, `starsToColor`, `computeEnergy`, `classifyWind`, `windScore`, `scoreTide`

### Utilities (pure functions)
| Domain | Functions |
|--------|-----------|
| Directions | `angleDifference`, `degreesToCompass`, `computeDirectionFit` |
| Geo | `haversineDistance`, `feetToMeters`, `metersToFeet` |
| Waves | `detectWaves` (GPS wave detection) |
| Alerts | `evaluateAlertRule`, `evaluateAlertRules` |
| Trails | `computeTrackDistanceMeters`, `computeElevationGainLoss`, `computeDurationSeconds`, `computePaceMinutesPerKm`, `summarizeTrail` |
| GPX | `exportTrackToGpx`, `importTrackFromGpx` |

## Storage

- **Type:** supabase (cloud-connected) + local SQLite cache
- **Table prefix:** `sf_`
- **Schema version:** 3
- **Migrations:** V1 (spots + sessions), V2 (forecast/swell/tide/buoy/narrative cache + spot enrichment), V3 (user pins, alerts, community, session waves, trail hikes)
- **Key tables:** `sf_spots`, `sf_sessions`, `sf_forecasts`, `sf_swell_components`, `sf_tides`, `sf_buoy_readings`, `sf_narratives`, `sf_user_pins`, `sf_spot_alerts`, `sf_alert_rules`, `sf_alert_notifications`, `sf_spot_reviews`, `sf_spot_photos`, `sf_spot_guides`, `sf_session_waves`, `sf_trail_hike_summaries`

## Engines

| Engine | File | Description |
|--------|------|-------------|
| Spot Rating | `src/rating/rating.ts` | 1-5 star rating from swell/wind/tide/consistency (weights: 0.45/0.30/0.15/0.10) |
| Wave Energy | `src/rating/energy.ts` | E = rho * g * H^2 * T / 16 (kJ per swell component) |
| Wind Scoring | `src/rating/wind.ts` | Offshore/cross/onshore classification + direction-based scoring |
| Tide Scoring | `src/rating/tide.ts` | Spot-type-sensitive tide scoring (reef > point > beach) |
| Wave Detection | `src/utils/waves.ts` | GPS track-based wave ride detection (speed/duration thresholds) |
| Alert Evaluation | `src/utils/alerts.ts` | Multi-rule alert matching with AND/OR logic |
| Trail Analytics | `src/utils/trails.ts` | Distance, elevation, pace, summary computation from track points |
| GPX I/O | `src/utils/gpx.ts` | GPX XML export and import for track data |

## Test Coverage

- **Test files:** 15 (rating, energy, wind, tide, directions, geo, waves, alerts, trails, gpx, spots CRUD, sessions CRUD, forecasts CRUD, alerts CRUD, community CRUD)
- **Covered:** Rating engines, utility functions, all local CRUD operations
- **Gaps:** Cloud adapters (require Supabase mock)

## Parity Status

- **Standalone repo:** MySurf (active standalone workspace with full Supabase backend)
- **Hub integration:** Full business logic consolidated -- types, schema, CRUD, engines, cloud adapters
- **Remaining standalone-only:** Data pipeline (NOAA/NDBC ingestion workers), Edge Functions (compute-forecast, generate-narrative, evaluate-alerts), map stack (Mapbox/MapLibre config, tile generation), Supabase migrations + RLS policies, seed data (200 CA spots)
- **Parity note:** Hub module contains all portable business logic. Pipeline, infrastructure, and map rendering remain in the standalone until the hub's data pipeline and map packages are built.

## Key Files

- `src/definition.ts` -- Module definition (3 migrations, 16 tables, schemaVersion 3)
- `src/index.ts` -- Public API barrel export (100+ exports)
- `src/types.ts` -- 32 Zod schemas + 10 engine interfaces (518 lines)
- `src/db/schema.ts` -- CREATE TABLE + ALTER TABLE + INDEX statements
- `src/db/crud.ts` -- Local SQLite CRUD (40+ functions, 1000+ lines)
- `src/cloud/` -- Supabase query adapters (7 files, 30 functions)
- `src/rating/` -- Spot rating engine (4 files)
- `src/utils/` -- Pure utility functions (6 files)
