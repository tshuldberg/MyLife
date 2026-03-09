// Definition
export { TRAILS_MODULE } from './definition';

// Types and schemas
export type {
  TrailDifficulty,
  ActivityType,
  Trail,
  TrailRecording,
  Waypoint,
  TrailPhoto,
  TrailStats,
  CreateTrailInput,
  UpdateTrailInput,
  CreateRecordingInput,
  CreateWaypointInput,
} from './types';

export {
  TrailDifficultySchema,
  ActivityTypeSchema,
  TrailSchema,
  TrailRecordingSchema,
  WaypointSchema,
  TrailPhotoSchema,
  TrailStatsSchema,
  CreateTrailInputSchema,
  UpdateTrailInputSchema,
  CreateRecordingInputSchema,
  CreateWaypointInputSchema,
} from './types';

// CRUD
export {
  createTrail,
  getTrail,
  getTrails,
  updateTrail,
  deleteTrail,
  createRecording,
  getRecording,
  getRecordings,
  getRecordingsByTrail,
  deleteRecording,
  createWaypoint,
  getWaypointsByRecording,
  getTrailStats,
} from './db/crud';

// Geo engine
export {
  haversineDistance,
  calculateElevationGain,
  calculatePace,
  formatDuration,
  estimateCalories,
} from './engine/geo';
