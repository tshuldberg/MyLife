// -- Spots --
export {
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
} from './crud';

// -- Sessions --
export {
  createSession,
  getSessions,
  deleteSession,
  countSessions,
} from './crud';

// -- Forecasts --
export {
  upsertForecast,
  upsertSwellComponents,
  getSpotForecast,
} from './crud';

// -- Tides --
export { upsertTide, getTides } from './crud';

// -- Buoy readings --
export {
  upsertBuoyReading,
  getLatestBuoyReading,
  getRecentBuoyReadings,
} from './crud';

// -- Narratives --
export {
  upsertNarrative,
  getSpotNarrative,
  getRegionNarrative,
} from './crud';

// -- User pins --
export { createUserPin, getUserPins, deleteUserPin } from './crud';

// -- Alerts --
export {
  createSpotAlert,
  getSpotAlerts,
  setSpotAlertActive,
  deleteSpotAlert,
} from './crud';

// -- Reviews --
export { createSpotReview, getSpotReviews, deleteSpotReview } from './crud';

// -- Photos --
export { createSpotPhoto, getSpotPhotos, deleteSpotPhoto } from './crud';

// -- Guides --
export { upsertSpotGuide, getSpotGuide } from './crud';

// -- Session waves --
export { recordSessionWave, getSessionWaves } from './crud';

// -- Trail hike summaries --
export { upsertTrailHikeSummary, getTrailHikeSummaries } from './crud';
