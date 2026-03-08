// -- Module definition --
export { SURF_MODULE } from './definition';

// -- Zod schemas --
export {
  SurfBreakTypeSchema,
  SurfTideSchema,
  SkillLevelSchema,
  HazardSchema,
  RegionSchema,
  SurfSpotSchema,
  CreateSpotInputSchema,
  SurfSessionSchema,
  ConditionColorSchema,
  WindLabelSchema,
  SwellComponentSchema,
  ForecastSchema,
  TidePointSchema,
  NarrativeSchema,
  BuoyReadingSchema,
  SunTimesSchema,
  AlertParameterSchema,
  AlertOperatorSchema,
  AlertJoinSchema,
  AlertRuleSchema,
  SpotAlertSchema,
  SpotAlertNotificationSchema,
  SpotReviewSchema,
  SpotPhotoSchema,
  SpotGuideSchema,
  UserPinSchema,
  SessionWaveSchema,
  TrailDifficultySchema,
  TrailPointSchema,
  TrailSchema,
  RecordedHikeSchema,
  OfflineRegionSchema,
} from './types';

// -- Inferred types --
export type {
  SurfBreakType,
  SurfTide,
  SkillLevel,
  Hazard,
  Region,
  SurfSpot,
  CreateSpotInput,
  SurfSession,
  ConditionColor,
  WindLabel,
  SwellComponent,
  Forecast,
  TidePoint,
  Narrative,
  BuoyReading,
  SunTimes,
  AlertParameter,
  AlertOperator,
  AlertJoin,
  AlertRule,
  SpotAlert,
  SpotAlertNotification,
  AlertConditions,
  SpotReview,
  SpotPhoto,
  SpotGuide,
  UserPin,
  SessionWave,
  TrailDifficulty,
  TrailPoint,
  Trail,
  RecordedHike,
  OfflineRegion,
} from './types';

// -- Engine interfaces --
export type {
  SpotProfile,
  SwellInput,
  ForecastInput,
  RatingResult,
  GpsTrackPoint,
  DetectedWave,
  WaveDetectionOptions,
  TrailTrackPoint,
  TrailSummary,
  GpxTrackPoint,
} from './types';

// -- CRUD --
export {
  // Spots
  createSpot,
  getSpots,
  getSpotById,
  getSpotBySlug,
  updateSpotConditions,
  updateSpotProfile,
  toggleSpotFavorite,
  deleteSpot,
  countSpots,
  countFavoriteSpots,
  getAverageWaveHeightFt,
  // Sessions
  createSession,
  getSessions,
  deleteSession,
  countSessions,
  // Forecasts
  upsertForecast,
  upsertSwellComponents,
  getSpotForecast,
  // Tides
  upsertTide,
  getTides,
  // Buoy readings
  upsertBuoyReading,
  getLatestBuoyReading,
  getRecentBuoyReadings,
  // Narratives
  upsertNarrative,
  getSpotNarrative,
  getRegionNarrative,
  // User pins
  createUserPin,
  getUserPins,
  deleteUserPin,
  // Alerts
  createSpotAlert,
  getSpotAlerts,
  setSpotAlertActive,
  deleteSpotAlert,
  // Reviews
  createSpotReview,
  getSpotReviews,
  deleteSpotReview,
  // Photos
  createSpotPhoto,
  getSpotPhotos,
  deleteSpotPhoto,
  // Guides
  upsertSpotGuide,
  getSpotGuide,
  // Session waves
  recordSessionWave,
  getSessionWaves,
  // Trail hike summaries
  upsertTrailHikeSummary,
  getTrailHikeSummaries,
} from './db';

// -- Rating engines --
export {
  computeSpotRating,
  starsToColor,
  computeEnergy,
  classifyWind,
  windScore,
  scoreTide,
} from './rating';

// -- Utilities --
export {
  angleDifference,
  degreesToCompass,
  computeDirectionFit,
  haversineDistance,
  feetToMeters,
  metersToFeet,
  detectWaves,
  evaluateAlertRule,
  evaluateAlertRules,
  computeTrackDistanceMeters,
  computeElevationGainLoss,
  computeDurationSeconds,
  computePaceMinutesPerKm,
  summarizeTrail,
  exportTrackToGpx,
  importTrackFromGpx,
} from './utils';

// -- Cloud query adapters (Supabase) --
export {
  cloudGetSpotsByRegion,
  cloudGetSpotBySlug,
  cloudGetNearbySpots,
  cloudGetUserFavoriteSpots,
  cloudGetSpotGuide,
  cloudToggleFavorite,
  cloudGetSpotForecast,
  cloudGetTides,
  cloudGetLatestBuoyReading,
  cloudGetRecentBuoyReadings,
  cloudGetSpotNarrative,
  cloudGetRegionNarrative,
  cloudVoteOnNarrative,
  cloudCreateSpotAlert,
  cloudGetSpotAlerts,
  cloudSetSpotAlertActive,
  cloudDeleteSpotAlert,
  cloudGetSpotReviews,
  cloudGetSpotPhotos,
  cloudCreateSpotReview,
  cloudDeleteSpotReview,
  cloudCreateUserPin,
  cloudGetUserPins,
  cloudDeleteUserPin,
  cloudCreateSurfSession,
  cloudGetSurfSessions,
  cloudDeleteSurfSession,
  cloudSyncTrailHikeSummary,
  cloudGetTrailHikeSummaries,
} from './cloud';
export type { CreateCloudAlertInput } from './cloud';
