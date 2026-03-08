import type { DatabaseAdapter } from '@mylife/db';
import type {
  Trail,
  TrailRecording,
  Waypoint,
  TrailStats,
  CreateTrailInput,
  UpdateTrailInput,
  CreateRecordingInput,
  CreateWaypointInput,
} from '../types';
import {
  CreateTrailInputSchema,
  UpdateTrailInputSchema,
  CreateRecordingInputSchema,
  CreateWaypointInputSchema,
} from '../types';

// ── Helpers ────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function rowToTrail(row: Record<string, unknown>): Trail {
  return {
    id: row.id as string,
    name: row.name as string,
    difficulty: row.difficulty as Trail['difficulty'],
    distanceMeters: row.distance_meters as number,
    elevationGainMeters: row.elevation_gain_meters as number,
    estimatedMinutes: (row.estimated_minutes as number) ?? null,
    lat: row.lat as number,
    lng: row.lng as number,
    region: (row.region as string) ?? null,
    description: (row.description as string) ?? null,
    isSaved: (row.is_saved as number) === 1,
    createdAt: row.created_at as string,
  };
}

function rowToRecording(row: Record<string, unknown>): TrailRecording {
  return {
    id: row.id as string,
    trailId: (row.trail_id as string) ?? null,
    name: row.name as string,
    activityType: row.activity_type as TrailRecording['activityType'],
    startedAt: row.started_at as string,
    endedAt: (row.ended_at as string) ?? null,
    distanceMeters: row.distance_meters as number,
    elevationGainMeters: row.elevation_gain_meters as number,
    durationSeconds: row.duration_seconds as number,
    gpxData: (row.gpx_data as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToWaypoint(row: Record<string, unknown>): Waypoint {
  return {
    id: row.id as string,
    recordingId: row.recording_id as string,
    lat: row.lat as number,
    lng: row.lng as number,
    elevation: (row.elevation as number) ?? null,
    timestamp: row.timestamp as string,
    accuracy: (row.accuracy as number) ?? null,
    createdAt: row.created_at as string,
  };
}

// ── Trails ─────────────────────────────────────────────────────────────

export function createTrail(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateTrailInput,
): Trail {
  const input = CreateTrailInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO tr_trails (id, name, difficulty, distance_meters, elevation_gain_meters, estimated_minutes, lat, lng, region, description, is_saved, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      input.name,
      input.difficulty,
      input.distanceMeters,
      input.elevationGainMeters,
      input.estimatedMinutes ?? null,
      input.lat,
      input.lng,
      input.region ?? null,
      input.description ?? null,
      now,
    ],
  );

  return {
    id,
    name: input.name,
    difficulty: input.difficulty,
    distanceMeters: input.distanceMeters,
    elevationGainMeters: input.elevationGainMeters,
    estimatedMinutes: input.estimatedMinutes ?? null,
    lat: input.lat,
    lng: input.lng,
    region: input.region ?? null,
    description: input.description ?? null,
    isSaved: false,
    createdAt: now,
  };
}

export function getTrail(db: DatabaseAdapter, id: string): Trail | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM tr_trails WHERE id = ?`,
    [id],
  );
  return rows.length > 0 ? rowToTrail(rows[0]) : null;
}

export function getTrails(
  db: DatabaseAdapter,
  options?: { difficulty?: string; savedOnly?: boolean; limit?: number; offset?: number },
): Trail[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options?.difficulty) {
    conditions.push('difficulty = ?');
    params.push(options.difficulty);
  }
  if (options?.savedOnly) {
    conditions.push('is_saved = 1');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM tr_trails ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return rows.map(rowToTrail);
}

export function updateTrail(
  db: DatabaseAdapter,
  id: string,
  rawInput: UpdateTrailInput,
): Trail | null {
  const existing = getTrail(db, id);
  if (!existing) return null;

  const input = UpdateTrailInputSchema.parse(rawInput);
  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) { updates.push('name = ?'); params.push(input.name); }
  if (input.difficulty !== undefined) { updates.push('difficulty = ?'); params.push(input.difficulty); }
  if (input.distanceMeters !== undefined) { updates.push('distance_meters = ?'); params.push(input.distanceMeters); }
  if (input.elevationGainMeters !== undefined) { updates.push('elevation_gain_meters = ?'); params.push(input.elevationGainMeters); }
  if (input.estimatedMinutes !== undefined) { updates.push('estimated_minutes = ?'); params.push(input.estimatedMinutes); }
  if (input.lat !== undefined) { updates.push('lat = ?'); params.push(input.lat); }
  if (input.lng !== undefined) { updates.push('lng = ?'); params.push(input.lng); }
  if (input.region !== undefined) { updates.push('region = ?'); params.push(input.region); }
  if (input.description !== undefined) { updates.push('description = ?'); params.push(input.description); }
  if (input.isSaved !== undefined) { updates.push('is_saved = ?'); params.push(input.isSaved ? 1 : 0); }

  if (updates.length === 0) return existing;

  params.push(id);
  db.execute(`UPDATE tr_trails SET ${updates.join(', ')} WHERE id = ?`, params);
  return getTrail(db, id);
}

export function deleteTrail(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM tr_trails WHERE id = ?`, [id]);
  return true;
}

// ── Recordings ─────────────────────────────────────────────────────────

export function createRecording(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateRecordingInput,
): TrailRecording {
  const input = CreateRecordingInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO tr_recordings (id, trail_id, name, activity_type, started_at, ended_at, distance_meters, elevation_gain_meters, duration_seconds, gpx_data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.trailId ?? null,
      input.name,
      input.activityType,
      input.startedAt,
      input.endedAt ?? null,
      input.distanceMeters,
      input.elevationGainMeters,
      input.durationSeconds,
      input.gpxData ?? null,
      now,
    ],
  );

  return {
    id,
    trailId: input.trailId ?? null,
    name: input.name,
    activityType: input.activityType,
    startedAt: input.startedAt,
    endedAt: input.endedAt ?? null,
    distanceMeters: input.distanceMeters,
    elevationGainMeters: input.elevationGainMeters,
    durationSeconds: input.durationSeconds,
    gpxData: input.gpxData ?? null,
    createdAt: now,
  };
}

export function getRecording(db: DatabaseAdapter, id: string): TrailRecording | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM tr_recordings WHERE id = ?`,
    [id],
  );
  return rows.length > 0 ? rowToRecording(rows[0]) : null;
}

export function getRecordings(
  db: DatabaseAdapter,
  options?: { activityType?: string; limit?: number; offset?: number },
): TrailRecording[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options?.activityType) {
    conditions.push('activity_type = ?');
    params.push(options.activityType);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM tr_recordings ${where} ORDER BY started_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return rows.map(rowToRecording);
}

export function getRecordingsByTrail(
  db: DatabaseAdapter,
  trailId: string,
): TrailRecording[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM tr_recordings WHERE trail_id = ? ORDER BY started_at DESC`,
    [trailId],
  );
  return rows.map(rowToRecording);
}

export function deleteRecording(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM tr_recordings WHERE id = ?`, [id]);
  return true;
}

// ── Waypoints ──────────────────────────────────────────────────────────

export function createWaypoint(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateWaypointInput,
): Waypoint {
  const input = CreateWaypointInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO tr_waypoints (id, recording_id, lat, lng, elevation, timestamp, accuracy, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.recordingId,
      input.lat,
      input.lng,
      input.elevation ?? null,
      input.timestamp,
      input.accuracy ?? null,
      now,
    ],
  );

  return {
    id,
    recordingId: input.recordingId,
    lat: input.lat,
    lng: input.lng,
    elevation: input.elevation ?? null,
    timestamp: input.timestamp,
    accuracy: input.accuracy ?? null,
    createdAt: now,
  };
}

export function getWaypointsByRecording(
  db: DatabaseAdapter,
  recordingId: string,
): Waypoint[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM tr_waypoints WHERE recording_id = ? ORDER BY timestamp ASC`,
    [recordingId],
  );
  return rows.map(rowToWaypoint);
}

// ── Stats ──────────────────────────────────────────────────────────────

export function getTrailStats(db: DatabaseAdapter): TrailStats {
  const rows = db.query<{
    total_recordings: number;
    total_distance: number;
    total_elevation: number;
    total_duration: number;
  }>(
    `SELECT
       COUNT(*) as total_recordings,
       COALESCE(SUM(distance_meters), 0) as total_distance,
       COALESCE(SUM(elevation_gain_meters), 0) as total_elevation,
       COALESCE(SUM(duration_seconds), 0) as total_duration
     FROM tr_recordings`,
  );

  const r = rows[0];
  const totalDistanceKm = r.total_distance / 1000;
  const totalDurationMin = r.total_duration / 60;
  const averagePace = totalDistanceKm > 0 ? totalDurationMin / totalDistanceKm : null;

  return {
    totalRecordings: r.total_recordings,
    totalDistanceMeters: r.total_distance,
    totalElevationGainMeters: r.total_elevation,
    totalDurationSeconds: r.total_duration,
    averagePaceMinPerKm: averagePace,
  };
}
