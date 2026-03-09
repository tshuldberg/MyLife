import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────

export const TrailDifficultySchema = z.enum(['easy', 'moderate', 'hard', 'expert']);
export type TrailDifficulty = z.infer<typeof TrailDifficultySchema>;

export const ActivityTypeSchema = z.enum(['hike', 'run', 'bike', 'walk']);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

// ── Core Entities ──────────────────────────────────────────────────────

export const TrailSchema = z.object({
  id: z.string(),
  name: z.string(),
  difficulty: TrailDifficultySchema,
  distanceMeters: z.number(),
  elevationGainMeters: z.number(),
  estimatedMinutes: z.number().int().nullable(),
  lat: z.number(),
  lng: z.number(),
  region: z.string().nullable(),
  description: z.string().nullable(),
  isSaved: z.boolean(),
  createdAt: z.string(),
});
export type Trail = z.infer<typeof TrailSchema>;

export const TrailRecordingSchema = z.object({
  id: z.string(),
  trailId: z.string().nullable(),
  name: z.string(),
  activityType: ActivityTypeSchema,
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  distanceMeters: z.number(),
  elevationGainMeters: z.number(),
  durationSeconds: z.number().int(),
  gpxData: z.string().nullable(),
  createdAt: z.string(),
});
export type TrailRecording = z.infer<typeof TrailRecordingSchema>;

export const WaypointSchema = z.object({
  id: z.string(),
  recordingId: z.string(),
  lat: z.number(),
  lng: z.number(),
  elevation: z.number().nullable(),
  timestamp: z.string(),
  accuracy: z.number().nullable(),
  createdAt: z.string(),
});
export type Waypoint = z.infer<typeof WaypointSchema>;

export const TrailPhotoSchema = z.object({
  id: z.string(),
  recordingId: z.string().nullable(),
  trailId: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  uri: z.string(),
  caption: z.string().nullable(),
  takenAt: z.string(),
  createdAt: z.string(),
});
export type TrailPhoto = z.infer<typeof TrailPhotoSchema>;

// ── Aggregates ─────────────────────────────────────────────────────────

export const TrailStatsSchema = z.object({
  totalRecordings: z.number().int(),
  totalDistanceMeters: z.number(),
  totalElevationGainMeters: z.number(),
  totalDurationSeconds: z.number().int(),
  averagePaceMinPerKm: z.number().nullable(),
});
export type TrailStats = z.infer<typeof TrailStatsSchema>;

// ── Create Inputs ──────────────────────────────────────────────────────

export const CreateTrailInputSchema = z.object({
  name: z.string().min(1),
  difficulty: TrailDifficultySchema,
  distanceMeters: z.number().nonnegative(),
  elevationGainMeters: z.number().nonnegative(),
  estimatedMinutes: z.number().int().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
  region: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type CreateTrailInput = z.infer<typeof CreateTrailInputSchema>;

export const UpdateTrailInputSchema = z.object({
  name: z.string().min(1).optional(),
  difficulty: TrailDifficultySchema.optional(),
  distanceMeters: z.number().nonnegative().optional(),
  elevationGainMeters: z.number().nonnegative().optional(),
  estimatedMinutes: z.number().int().nullable().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  region: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isSaved: z.boolean().optional(),
});
export type UpdateTrailInput = z.infer<typeof UpdateTrailInputSchema>;

export const CreateRecordingInputSchema = z.object({
  trailId: z.string().nullable().optional(),
  name: z.string().min(1),
  activityType: ActivityTypeSchema,
  startedAt: z.string(),
  endedAt: z.string().nullable().optional(),
  distanceMeters: z.number().nonnegative(),
  elevationGainMeters: z.number().nonnegative(),
  durationSeconds: z.number().int().nonnegative(),
  gpxData: z.string().nullable().optional(),
});
export type CreateRecordingInput = z.infer<typeof CreateRecordingInputSchema>;

export const CreateWaypointInputSchema = z.object({
  recordingId: z.string(),
  lat: z.number(),
  lng: z.number(),
  elevation: z.number().nullable().optional(),
  timestamp: z.string(),
  accuracy: z.number().nullable().optional(),
});
export type CreateWaypointInput = z.infer<typeof CreateWaypointInputSchema>;
