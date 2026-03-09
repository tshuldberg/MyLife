import type { DatabaseAdapter } from '@mylife/db';
import type {
  BirthProfile,
  Transit,
  DailyReading,
  SavedChart,
  CreateBirthProfileInput,
  UpdateBirthProfileInput,
  CreateTransitInput,
  CreateDailyReadingInput,
  StarsStats,
  MoonPhase,
} from '../types';
import { CreateBirthProfileInputSchema, CreateTransitInputSchema, CreateDailyReadingInputSchema } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function rowToProfile(row: Record<string, unknown>): BirthProfile {
  return {
    id: row.id as string,
    name: row.name as string,
    birthDate: row.birth_date as string,
    birthTime: (row.birth_time as string) ?? null,
    birthLat: (row.birth_lat as number) ?? null,
    birthLng: (row.birth_lng as number) ?? null,
    birthPlace: (row.birth_place as string) ?? null,
    sunSign: (row.sun_sign as BirthProfile['sunSign']) ?? null,
    moonSign: (row.moon_sign as BirthProfile['moonSign']) ?? null,
    risingSign: (row.rising_sign as BirthProfile['risingSign']) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToTransit(row: Record<string, unknown>): Transit {
  return {
    id: row.id as string,
    profileId: row.profile_id as string,
    date: row.date as string,
    planet: row.planet as string,
    sign: row.sign as Transit['sign'],
    aspect: (row.aspect as string) ?? null,
    description: (row.description as string) ?? null,
  };
}

function rowToReading(row: Record<string, unknown>): DailyReading {
  return {
    id: row.id as string,
    profileId: row.profile_id as string,
    date: row.date as string,
    moonPhase: row.moon_phase as DailyReading['moonPhase'],
    moonSign: (row.moon_sign as DailyReading['moonSign']) ?? null,
    summary: (row.summary as string) ?? null,
    tarotCard: (row.tarot_card as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToSavedChart(row: Record<string, unknown>): SavedChart {
  return {
    id: row.id as string,
    profileId: row.profile_id as string,
    chartType: row.chart_type as string,
    title: row.title as string,
    data: row.data as string,
    createdAt: row.created_at as string,
  };
}

// ── Birth Profiles ────────────────────────────────────────────────────

export function createBirthProfile(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateBirthProfileInput,
): BirthProfile {
  const input = CreateBirthProfileInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO st_birth_profiles (id, name, birth_date, birth_time, birth_lat, birth_lng, birth_place, sun_sign, moon_sign, rising_sign, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.birthDate,
      input.birthTime ?? null,
      input.birthLat ?? null,
      input.birthLng ?? null,
      input.birthPlace ?? null,
      input.sunSign ?? null,
      input.moonSign ?? null,
      input.risingSign ?? null,
      now,
      now,
    ],
  );

  return {
    id,
    name: input.name,
    birthDate: input.birthDate,
    birthTime: input.birthTime ?? null,
    birthLat: input.birthLat ?? null,
    birthLng: input.birthLng ?? null,
    birthPlace: input.birthPlace ?? null,
    sunSign: input.sunSign ?? null,
    moonSign: input.moonSign ?? null,
    risingSign: input.risingSign ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export function getBirthProfile(db: DatabaseAdapter, id: string): BirthProfile | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM st_birth_profiles WHERE id = ?`,
    [id],
  );
  return rows.length > 0 ? rowToProfile(rows[0]) : null;
}

export function getBirthProfiles(db: DatabaseAdapter): BirthProfile[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM st_birth_profiles ORDER BY created_at DESC`,
  );
  return rows.map(rowToProfile);
}

export function updateBirthProfile(
  db: DatabaseAdapter,
  id: string,
  input: UpdateBirthProfileInput,
): BirthProfile | null {
  const existing = getBirthProfile(db, id);
  if (!existing) return null;

  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) { updates.push('name = ?'); params.push(input.name); }
  if (input.birthDate !== undefined) { updates.push('birth_date = ?'); params.push(input.birthDate); }
  if (input.birthTime !== undefined) { updates.push('birth_time = ?'); params.push(input.birthTime); }
  if (input.birthLat !== undefined) { updates.push('birth_lat = ?'); params.push(input.birthLat); }
  if (input.birthLng !== undefined) { updates.push('birth_lng = ?'); params.push(input.birthLng); }
  if (input.birthPlace !== undefined) { updates.push('birth_place = ?'); params.push(input.birthPlace); }
  if (input.sunSign !== undefined) { updates.push('sun_sign = ?'); params.push(input.sunSign); }
  if (input.moonSign !== undefined) { updates.push('moon_sign = ?'); params.push(input.moonSign); }
  if (input.risingSign !== undefined) { updates.push('rising_sign = ?'); params.push(input.risingSign); }

  if (updates.length === 0) return existing;

  updates.push('updated_at = ?');
  params.push(nowIso());
  params.push(id);

  db.execute(`UPDATE st_birth_profiles SET ${updates.join(', ')} WHERE id = ?`, params);
  return getBirthProfile(db, id);
}

export function deleteBirthProfile(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM st_birth_profiles WHERE id = ?`, [id]);
  return true;
}

// ── Transits ──────────────────────────────────────────────────────────

export function createTransit(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateTransitInput,
): Transit {
  const input = CreateTransitInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO st_transits (id, profile_id, date, planet, sign, aspect, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.profileId,
      input.date,
      input.planet,
      input.sign,
      input.aspect ?? null,
      input.description ?? null,
      now,
    ],
  );

  return {
    id,
    profileId: input.profileId,
    date: input.date,
    planet: input.planet,
    sign: input.sign,
    aspect: input.aspect ?? null,
    description: input.description ?? null,
  };
}

export function getTransitsByProfile(
  db: DatabaseAdapter,
  profileId: string,
  limit = 50,
): Transit[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM st_transits WHERE profile_id = ? ORDER BY date DESC LIMIT ?`,
    [profileId, limit],
  );
  return rows.map(rowToTransit);
}

export function getTransitsByDate(db: DatabaseAdapter, date: string): Transit[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM st_transits WHERE date = ? ORDER BY planet ASC`,
    [date],
  );
  return rows.map(rowToTransit);
}

// ── Daily Readings ────────────────────────────────────────────────────

export function createDailyReading(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateDailyReadingInput,
): DailyReading {
  const input = CreateDailyReadingInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO st_daily_readings (id, profile_id, date, moon_phase, moon_sign, summary, tarot_card, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.profileId,
      input.date,
      input.moonPhase,
      input.moonSign ?? null,
      input.summary ?? null,
      input.tarotCard ?? null,
      now,
    ],
  );

  return {
    id,
    profileId: input.profileId,
    date: input.date,
    moonPhase: input.moonPhase,
    moonSign: input.moonSign ?? null,
    summary: input.summary ?? null,
    tarotCard: input.tarotCard ?? null,
    createdAt: now,
  };
}

export function getDailyReading(
  db: DatabaseAdapter,
  profileId: string,
  date: string,
): DailyReading | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM st_daily_readings WHERE profile_id = ? AND date = ?`,
    [profileId, date],
  );
  return rows.length > 0 ? rowToReading(rows[0]) : null;
}

// ── Saved Charts ──────────────────────────────────────────────────────

export function createSavedChart(
  db: DatabaseAdapter,
  id: string,
  profileId: string,
  chartType: string,
  title: string,
  data: string,
): SavedChart {
  const now = nowIso();

  db.execute(
    `INSERT INTO st_saved_charts (id, profile_id, chart_type, title, data, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, profileId, chartType, title, data, now],
  );

  return {
    id,
    profileId,
    chartType,
    title,
    data,
    createdAt: now,
  };
}

export function getSavedChartsByProfile(
  db: DatabaseAdapter,
  profileId: string,
): SavedChart[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM st_saved_charts WHERE profile_id = ? ORDER BY created_at DESC`,
    [profileId],
  );
  return rows.map(rowToSavedChart);
}

// ── Stats ─────────────────────────────────────────────────────────────

export function getStarsStats(db: DatabaseAdapter): StarsStats {
  const profiles = db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM st_birth_profiles`,
  );
  const transits = db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM st_transits`,
  );
  const readings = db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM st_daily_readings`,
  );
  const charts = db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM st_saved_charts`,
  );

  // Get the most recent daily reading's moon phase if available
  const latestReading = db.query<{ moon_phase: string }>(
    `SELECT moon_phase FROM st_daily_readings ORDER BY date DESC LIMIT 1`,
  );

  return {
    totalProfiles: profiles[0].count,
    totalTransits: transits[0].count,
    totalReadings: readings[0].count,
    totalSavedCharts: charts[0].count,
    currentMoonPhase: latestReading.length > 0
      ? (latestReading[0].moon_phase as MoonPhase)
      : null,
  };
}
