import type { DatabaseAdapter } from '@mylife/db';
import type { SurfSession, SurfSpot } from '../types';

function rowToSpot(row: Record<string, unknown>): SurfSpot {
  return {
    id: row.id as string,
    name: row.name as string,
    region: row.region as string,
    breakType: row.break_type as SurfSpot['breakType'],
    waveHeightFt: row.wave_height_ft as number,
    windKts: row.wind_kts as number,
    tide: row.tide as SurfSpot['tide'],
    swellDirection: row.swell_direction as string,
    isFavorite: !!(row.is_favorite as number),
    lastUpdated: row.last_updated as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToSession(row: Record<string, unknown>): SurfSession {
  return {
    id: row.id as string,
    spotId: row.spot_id as string,
    sessionDate: row.session_date as string,
    durationMin: row.duration_min as number,
    rating: row.rating as number,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function createSpot(
  db: DatabaseAdapter,
  id: string,
  input: {
    name: string;
    region: string;
    breakType: SurfSpot['breakType'];
    waveHeightFt?: number;
    windKts?: number;
    tide?: SurfSpot['tide'];
    swellDirection?: string;
    isFavorite?: boolean;
  },
): void {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO sf_spots (
      id, name, region, break_type, wave_height_ft, wind_kts,
      tide, swell_direction, is_favorite, last_updated, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.region,
      input.breakType,
      input.waveHeightFt ?? 0,
      input.windKts ?? 0,
      input.tide ?? 'mid',
      input.swellDirection ?? 'W',
      input.isFavorite ? 1 : 0,
      now,
      now,
      now,
    ],
  );
}

export function getSpots(
  db: DatabaseAdapter,
  options?: {
    search?: string;
    region?: string;
    favoritesOnly?: boolean;
  },
): SurfSpot[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (options?.search) {
    where.push('(name LIKE ? OR region LIKE ?)');
    const token = `%${options.search}%`;
    params.push(token, token);
  }
  if (options?.region) {
    where.push('region = ?');
    params.push(options.region);
  }
  if (options?.favoritesOnly) {
    where.push('is_favorite = 1');
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM sf_spots
       ${whereClause}
       ORDER BY is_favorite DESC, updated_at DESC`,
      params,
    )
    .map(rowToSpot);
}

export function updateSpotConditions(
  db: DatabaseAdapter,
  id: string,
  updates: Partial<{
    waveHeightFt: number;
    windKts: number;
    tide: SurfSpot['tide'];
    swellDirection: string;
  }>,
): void {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (updates.waveHeightFt !== undefined) {
    sets.push('wave_height_ft = ?');
    params.push(updates.waveHeightFt);
  }
  if (updates.windKts !== undefined) {
    sets.push('wind_kts = ?');
    params.push(updates.windKts);
  }
  if (updates.tide !== undefined) {
    sets.push('tide = ?');
    params.push(updates.tide);
  }
  if (updates.swellDirection !== undefined) {
    sets.push('swell_direction = ?');
    params.push(updates.swellDirection);
  }

  if (sets.length === 0) return;
  const now = new Date().toISOString();
  sets.push('last_updated = ?', 'updated_at = ?');
  params.push(now, now, id);

  db.execute(`UPDATE sf_spots SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function toggleSpotFavorite(db: DatabaseAdapter, id: string): void {
  db.execute(
    `UPDATE sf_spots
     SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END,
         updated_at = ?,
         last_updated = ?
     WHERE id = ?`,
    [new Date().toISOString(), new Date().toISOString(), id],
  );
}

export function deleteSpot(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM sf_spots WHERE id = ?', [id]);
}

export function countSpots(db: DatabaseAdapter): number {
  return db.query<{ c: number }>('SELECT COUNT(*) as c FROM sf_spots')[0]?.c ?? 0;
}

export function countFavoriteSpots(db: DatabaseAdapter): number {
  return db.query<{ c: number }>('SELECT COUNT(*) as c FROM sf_spots WHERE is_favorite = 1')[0]?.c ?? 0;
}

export function getAverageWaveHeightFt(db: DatabaseAdapter): number {
  const row = db.query<{ avg: number | null }>(
    'SELECT AVG(wave_height_ft) as avg FROM sf_spots',
  )[0];
  return row?.avg ?? 0;
}

export function createSession(
  db: DatabaseAdapter,
  id: string,
  input: {
    spotId: string;
    sessionDate: string;
    durationMin: number;
    rating: number;
    notes?: string;
  },
): void {
  db.execute(
    `INSERT INTO sf_sessions (id, spot_id, session_date, duration_min, rating, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.spotId,
      input.sessionDate,
      input.durationMin,
      input.rating,
      input.notes ?? null,
      new Date().toISOString(),
    ],
  );
}

export function getSessions(
  db: DatabaseAdapter,
  options?: {
    spotId?: string;
    limit?: number;
  },
): SurfSession[] {
  const params: unknown[] = [];
  let sql = 'SELECT * FROM sf_sessions';

  if (options?.spotId) {
    sql += ' WHERE spot_id = ?';
    params.push(options.spotId);
  }

  sql += ' ORDER BY session_date DESC';

  if (options?.limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  return db.query<Record<string, unknown>>(sql, params).map(rowToSession);
}

export function deleteSession(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM sf_sessions WHERE id = ?', [id]);
}

export function countSessions(db: DatabaseAdapter): number {
  return db.query<{ c: number }>('SELECT COUNT(*) as c FROM sf_sessions')[0]?.c ?? 0;
}
