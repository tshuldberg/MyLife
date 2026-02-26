'use server';

import {
  getPreference,
  setPreference,
  type DatabaseAdapter,
} from '@mylife/db';
import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createSession,
  createSpot,
  deleteSession,
  deleteSpot,
  countFavoriteSpots,
  countSessions,
  countSpots,
  getAverageWaveHeightFt,
  getSessions,
  getSpots,
  toggleSpotFavorite,
  updateSpotConditions,
} from '@mylife/surf';
import type { SurfSession, SurfSpot } from '@mylife/surf';

export type SurfConditionColor = 'green' | 'yellow' | 'orange' | 'red';

export interface SurfForecastPoint {
  timestamp: string;
  waveHeightFt: number;
  windKts: number;
  windDir: string;
  tideHeightFt: number;
  periodSec: number;
  rating: number;
  conditionColor: SurfConditionColor;
  energyKj: number;
  consistency: number;
}

export interface SurfDaySummary {
  date: string;
  label: string;
  waveHeightMin: number;
  waveHeightMax: number;
  windKtsAvg: number;
  rating: number;
  conditionColor: SurfConditionColor;
}

export interface SurfSpotHomeCard {
  spot: SurfSpot;
  days: SurfDaySummary[];
}

export interface SurfNarrative {
  id: string;
  date: string;
  summary: string;
  body: string;
  generatedAt: string;
  helpfulVotes: number;
  unhelpfulVotes: number;
}

export interface SurfLiveReading {
  timestamp: string;
  waveHeightFt: number;
  periodSec: number;
  windKts: number;
  windDir: string;
  waterTempF: number;
}

export interface SurfLiveConditions {
  buoyName: string;
  distanceMi: number;
  latest: SurfLiveReading;
  recent: SurfLiveReading[];
}

export interface SurfGuide {
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  crowdFactor: number;
  hazards: string[];
  description: string;
}

export interface SurfMapPin {
  id: string;
  name: string;
  notes: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  createdAt: string;
}

interface StoredSurfUser {
  id: string;
  email: string;
  password: string;
  displayName: string;
  createdAt: string;
}

export interface SurfAuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface SurfProfile {
  homeRegion: string;
  waveUnit: 'ft' | 'm';
  windUnit: 'kts' | 'mph';
  tempUnit: 'F' | 'C';
  dailyForecast: boolean;
  swellAlerts: boolean;
  sessionReminders: boolean;
  plan: 'free' | 'premium';
}

const SURF_PINS_KEY = 'surf.pins.v1';
const SURF_USERS_KEY = 'surf.auth.users.v1';
const SURF_SESSION_KEY = 'surf.auth.session.v1';

function db(): DatabaseAdapter {
  const adapter = getAdapter();
  ensureModuleMigrations('surf');
  return adapter;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function seeded(seed: number, step: number): number {
  const x = Math.sin(seed * 0.001 + step * 0.731) * 10000;
  return x - Math.floor(x);
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function dayLabel(index: number, date: Date): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function toConditionColor(rating: number): SurfConditionColor {
  if (rating >= 4.2) return 'green';
  if (rating >= 3.2) return 'yellow';
  if (rating >= 2.2) return 'orange';
  return 'red';
}

function directionFromDegrees(deg: number): string {
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return labels[idx] ?? 'W';
}

function readJsonPreference<T>(adapter: DatabaseAdapter, key: string, fallback: T): T {
  const raw = getPreference(adapter, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonPreference(adapter: DatabaseAdapter, key: string, value: unknown): void {
  setPreference(adapter, key, JSON.stringify(value));
}

function profileKey(userId: string): string {
  return `surf.profile.${userId}.v1`;
}

function narrativeVotesKey(spotId: string, date: string): string {
  return `surf.narrative.votes.${spotId}.${date}`;
}

function defaultProfile(region = 'Santa Barbara'): SurfProfile {
  return {
    homeRegion: region,
    waveUnit: 'ft',
    windUnit: 'kts',
    tempUnit: 'F',
    dailyForecast: true,
    swellAlerts: true,
    sessionReminders: false,
    plan: 'free',
  };
}

function toPublicUser(user: StoredSurfUser): SurfAuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

function ensureInitialSurfData(adapter: DatabaseAdapter): void {
  if (countSpots(adapter) > 0) return;

  const seedSpots: Array<{
    id: string;
    name: string;
    region: string;
    breakType: SurfSpot['breakType'];
    waveHeightFt: number;
    windKts: number;
    tide: SurfSpot['tide'];
    swellDirection: string;
    isFavorite?: boolean;
  }> = [
    {
      id: 'spot-001',
      name: 'Rincon Point',
      region: 'Santa Barbara',
      breakType: 'point',
      waveHeightFt: 4.5,
      windKts: 8,
      tide: 'mid',
      swellDirection: 'W',
      isFavorite: true,
    },
    {
      id: 'spot-002',
      name: 'Steamer Lane',
      region: 'Santa Cruz',
      breakType: 'point',
      waveHeightFt: 5.2,
      windKts: 12,
      tide: 'high',
      swellDirection: 'NW',
    },
    {
      id: 'spot-003',
      name: 'Ocean Beach',
      region: 'San Francisco',
      breakType: 'beach',
      waveHeightFt: 6.1,
      windKts: 16,
      tide: 'mid',
      swellDirection: 'W',
    },
    {
      id: 'spot-004',
      name: 'Trestles',
      region: 'Orange County',
      breakType: 'reef',
      waveHeightFt: 3.8,
      windKts: 7,
      tide: 'all',
      swellDirection: 'SW',
      isFavorite: true,
    },
    {
      id: 'spot-005',
      name: 'Blacks Beach',
      region: 'San Diego',
      breakType: 'beach',
      waveHeightFt: 4.2,
      windKts: 9,
      tide: 'low',
      swellDirection: 'W',
    },
  ];

  for (const spot of seedSpots) {
    createSpot(adapter, spot.id, spot);
  }

  createSession(adapter, 'session-seed-001', {
    spotId: 'spot-001',
    sessionDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    durationMin: 95,
    rating: 4,
    notes: 'Clean shoulder-high peelers on the inside.',
  });
}

function createForecastPoint(spot: SurfSpot, pointIndex: number, timestamp: Date): SurfForecastPoint {
  const seed = hash(`${spot.id}:${pointIndex}`);
  const swellVariance = (seeded(seed, pointIndex) - 0.5) * 2.2;
  const windVariance = (seeded(seed, pointIndex + 31) - 0.5) * 8;
  const tideVariance = (seeded(seed, pointIndex + 71) - 0.5) * 3.2;

  const waveHeightFt = clamp(spot.waveHeightFt + swellVariance, 0.5, 18);
  const windKts = clamp(spot.windKts + windVariance, 0, 35);
  const tideHeightFt = clamp(2.4 + tideVariance, -1.2, 7.5);
  const periodSec = clamp(8 + seeded(seed, pointIndex + 11) * 10, 6, 18);

  const waveScore = clamp(waveHeightFt / 6, 0, 1);
  const windScore = clamp(1 - windKts / 26, 0, 1);
  const tideScore = 1 - Math.min(Math.abs(tideHeightFt - 2.5), 4) / 4;
  const rating = clamp(Math.round((waveScore * 0.45 + windScore * 0.35 + tideScore * 0.2) * 5 * 10) / 10, 1, 5);

  return {
    timestamp: timestamp.toISOString(),
    waveHeightFt: Math.round(waveHeightFt * 10) / 10,
    windKts: Math.round(windKts * 10) / 10,
    windDir: directionFromDegrees(Math.round(seeded(seed, pointIndex + 12) * 360)),
    tideHeightFt: Math.round(tideHeightFt * 10) / 10,
    periodSec: Math.round(periodSec * 10) / 10,
    rating,
    conditionColor: toConditionColor(rating),
    energyKj: Math.round(waveHeightFt * waveHeightFt * periodSec * 7),
    consistency: Math.round(clamp(55 + seeded(seed, pointIndex + 99) * 45, 0, 100)),
  };
}

function aggregateDay(points: SurfForecastPoint[], index: number): SurfDaySummary {
  const first = points[0]!;
  const minWave = Math.min(...points.map((point) => point.waveHeightFt));
  const maxWave = Math.max(...points.map((point) => point.waveHeightFt));
  const avgWind = points.reduce((sum, point) => sum + point.windKts, 0) / points.length;
  const avgRating = points.reduce((sum, point) => sum + point.rating, 0) / points.length;
  const date = new Date(first.timestamp);

  return {
    date: isoDate(date),
    label: dayLabel(index, date),
    waveHeightMin: Math.round(minWave * 10) / 10,
    waveHeightMax: Math.round(maxWave * 10) / 10,
    windKtsAvg: Math.round(avgWind * 10) / 10,
    rating: Math.round(avgRating * 10) / 10,
    conditionColor: toConditionColor(avgRating),
  };
}

function buildNarrativeBody(spot: SurfSpot, day: SurfDaySummary): string {
  const waveLine = `${day.waveHeightMin.toFixed(1)}-${day.waveHeightMax.toFixed(1)} ft with average winds around ${day.windKtsAvg.toFixed(0)} kts.`;
  const qualityLine =
    day.rating >= 4
      ? 'Expect quality windows if you time your session around cleaner periods.'
      : day.rating >= 3
        ? 'Mixed but workable conditions; watch for shorter clean windows.'
        : 'Conditions trend inconsistent, so this is more of a paddle-and-practice day.';
  return `${spot.name} in ${spot.region} is tracking ${waveLine} ${qualityLine}`;
}

function deriveGuide(spot: SurfSpot): SurfGuide {
  const skillLevel: SurfGuide['skillLevel'] =
    spot.breakType === 'point'
      ? 'intermediate'
      : spot.breakType === 'reef'
        ? 'advanced'
        : spot.breakType === 'beach'
          ? 'all'
          : 'beginner';

  const hazards = [
    spot.breakType === 'reef' ? 'shallow_reef' : 'rip_currents',
    spot.waveHeightFt >= 6 ? 'heavy_sets' : 'crowded_peak',
    spot.windKts > 14 ? 'onshore_chop' : 'kook_traffic',
  ];

  return {
    skillLevel,
    crowdFactor: clamp(Math.round((hash(spot.id) % 5) + 1), 1, 5),
    hazards,
    description:
      `${spot.name} is a ${spot.breakType.replace('-', ' ')} in ${spot.region}. ` +
      `Best tide profile is ${spot.tide}. Typical swell approach is ${spot.swellDirection}.`,
  };
}

export async function fetchSurfOverview(): Promise<{
  spots: number;
  favorites: number;
  averageWaveHeightFt: number;
  sessions: number;
}> {
  const adapter = db();
  ensureInitialSurfData(adapter);

  return {
    spots: countSpots(adapter),
    favorites: countFavoriteSpots(adapter),
    averageWaveHeightFt: getAverageWaveHeightFt(adapter),
    sessions: countSessions(adapter),
  };
}

export async function fetchSurfSpots(input?: {
  search?: string;
  region?: string;
  favoritesOnly?: boolean;
}): Promise<SurfSpot[]> {
  const adapter = db();
  ensureInitialSurfData(adapter);
  return getSpots(adapter, input);
}

export async function fetchSurfSpotById(id: string): Promise<SurfSpot | null> {
  const adapter = db();
  ensureInitialSurfData(adapter);
  const spots = getSpots(adapter);
  return spots.find((spot) => spot.id === id) ?? null;
}

export async function fetchSurfFavoriteSpots(): Promise<SurfSpot[]> {
  const adapter = db();
  ensureInitialSurfData(adapter);
  return getSpots(adapter, { favoritesOnly: true });
}

export async function fetchSurfRegions(): Promise<string[]> {
  const adapter = db();
  ensureInitialSurfData(adapter);
  const regions = new Set(getSpots(adapter).map((spot) => spot.region));
  return [...regions].sort((a, b) => a.localeCompare(b));
}

export async function fetchSurfSessions(input?: {
  spotId?: string;
  limit?: number;
}): Promise<SurfSession[]> {
  const adapter = db();
  ensureInitialSurfData(adapter);
  return getSessions(adapter, input);
}

export async function fetchSurfForecast(
  spotId: string,
  days = 16,
): Promise<SurfForecastPoint[]> {
  const adapter = db();
  ensureInitialSurfData(adapter);
  const spot = getSpots(adapter).find((item) => item.id === spotId);
  if (!spot) return [];

  const points: SurfForecastPoint[] = [];
  const now = new Date();
  for (let day = 0; day < days; day += 1) {
    for (let slot = 0; slot < 8; slot += 1) {
      const pointIndex = day * 8 + slot;
      const timestamp = new Date(now.getTime() + pointIndex * 3 * 60 * 60 * 1000);
      points.push(createForecastPoint(spot, pointIndex, timestamp));
    }
  }

  return points;
}

export async function fetchSurfDaySummaries(
  spotId: string,
  days = 16,
): Promise<SurfDaySummary[]> {
  const points = await fetchSurfForecast(spotId, days);
  if (points.length === 0) return [];

  const summaries: SurfDaySummary[] = [];
  for (let day = 0; day < days; day += 1) {
    const slice = points.slice(day * 8, day * 8 + 8);
    if (slice.length === 0) break;
    summaries.push(aggregateDay(slice, day));
  }
  return summaries;
}

export async function fetchSurfHomeCards(region?: string): Promise<SurfSpotHomeCard[]> {
  const spots = await fetchSurfSpots({ region });
  const cards = await Promise.all(
    spots.map(async (spot) => ({
      spot,
      days: await fetchSurfDaySummaries(spot.id, 7),
    })),
  );
  return cards.sort((a, b) => (b.days[0]?.rating ?? 0) - (a.days[0]?.rating ?? 0));
}

export async function fetchSurfRegionalNarrative(input?: {
  region?: string;
  date?: string;
}): Promise<SurfNarrative> {
  const adapter = db();
  ensureInitialSurfData(adapter);

  const date = input?.date ?? isoDate(new Date());
  const spots = await fetchSurfSpots({ region: input?.region });

  if (spots.length === 0) {
    return {
      id: `narrative:${input?.region ?? 'all'}:${date}`,
      date,
      summary: 'No forecastable spots in this region yet.',
      body: 'Add or pin spots from the map tab to generate a regional briefing.',
      generatedAt: new Date().toISOString(),
      helpfulVotes: 0,
      unhelpfulVotes: 0,
    };
  }

  const ratings = await Promise.all(
    spots.slice(0, 6).map(async (spot) => {
      const day = (await fetchSurfDaySummaries(spot.id, 1))[0];
      return day?.rating ?? 0;
    }),
  );

  const avg = ratings.reduce((sum, rating) => sum + rating, 0) / Math.max(1, ratings.length);
  const summary =
    avg >= 4
      ? 'Regional outlook is strong with multiple clean windows.'
      : avg >= 3
        ? 'Mixed regional conditions with selective quality windows.'
        : 'Underpowered or wind-affected conditions across most breaks.';

  const body =
    `Coverage: ${spots.length} tracked spots in ${input?.region ?? 'all regions'}. ` +
    `Average model confidence today: ${avg.toFixed(1)}/5. ` +
    `Top-performing breaks should be checked early and around tide transitions.`;

  const voteKey = narrativeVotesKey(`region:${input?.region ?? 'all'}`, date);
  const votes = readJsonPreference<{ helpfulVotes: number; unhelpfulVotes: number }>(
    adapter,
    voteKey,
    { helpfulVotes: 0, unhelpfulVotes: 0 },
  );

  return {
    id: voteKey,
    date,
    summary,
    body,
    generatedAt: new Date().toISOString(),
    helpfulVotes: votes.helpfulVotes,
    unhelpfulVotes: votes.unhelpfulVotes,
  };
}

export async function fetchSurfNarrative(input: {
  spotId: string;
  date?: string;
}): Promise<SurfNarrative | null> {
  const adapter = db();
  ensureInitialSurfData(adapter);

  const spot = getSpots(adapter).find((item) => item.id === input.spotId);
  if (!spot) return null;

  const date = input.date ?? isoDate(new Date());
  const summary = (await fetchSurfDaySummaries(spot.id, 1))[0];
  const voteKey = narrativeVotesKey(spot.id, date);
  const votes = readJsonPreference<{ helpfulVotes: number; unhelpfulVotes: number }>(
    adapter,
    voteKey,
    { helpfulVotes: 0, unhelpfulVotes: 0 },
  );

  return {
    id: voteKey,
    date,
    summary:
      summary?.rating && summary.rating >= 4
        ? `${spot.name} looks solid with above-average shape.`
        : `${spot.name} is surfable with some variability in quality.`,
    body: summary
      ? buildNarrativeBody(spot, summary)
      : `${spot.name} has limited model data; update spot conditions to improve this narrative.`,
    generatedAt: new Date().toISOString(),
    helpfulVotes: votes.helpfulVotes,
    unhelpfulVotes: votes.unhelpfulVotes,
  };
}

export async function voteSurfNarrative(input: {
  narrativeId: string;
  helpful: boolean;
}): Promise<void> {
  const adapter = db();
  const votes = readJsonPreference<{ helpfulVotes: number; unhelpfulVotes: number }>(
    adapter,
    input.narrativeId,
    { helpfulVotes: 0, unhelpfulVotes: 0 },
  );

  if (input.helpful) {
    votes.helpfulVotes += 1;
  } else {
    votes.unhelpfulVotes += 1;
  }
  writeJsonPreference(adapter, input.narrativeId, votes);
}

export async function fetchSurfLiveConditions(spotId: string): Promise<SurfLiveConditions | null> {
  const adapter = db();
  ensureInitialSurfData(adapter);

  const spot = getSpots(adapter).find((item) => item.id === spotId);
  if (!spot) return null;

  const forecast = await fetchSurfForecast(spotId, 1);
  if (forecast.length === 0) return null;

  const latestPoint = forecast[0]!;
  const recent: SurfLiveReading[] = [];
  for (let index = 0; index < 8; index += 1) {
    const point = forecast[index] ?? latestPoint;
    recent.push({
      timestamp: point.timestamp,
      waveHeightFt: point.waveHeightFt,
      periodSec: point.periodSec,
      windKts: point.windKts,
      windDir: point.windDir,
      waterTempF: Math.round(52 + seeded(hash(spot.id), index + 200) * 14),
    });
  }

  return {
    buoyName: `${spot.region} Buoy`,
    distanceMi: Math.round((2.5 + seeded(hash(spot.id), 17) * 9) * 10) / 10,
    latest: recent[0]!,
    recent,
  };
}

export async function fetchSurfGuide(spotId: string): Promise<SurfGuide | null> {
  const spot = await fetchSurfSpotById(spotId);
  if (!spot) return null;
  return deriveGuide(spot);
}

export async function fetchSurfPins(): Promise<SurfMapPin[]> {
  return readJsonPreference<SurfMapPin[]>(db(), SURF_PINS_KEY, []).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export async function doCreateSurfPin(input: {
  name: string;
  notes?: string;
  latitude: number;
  longitude: number;
  isPublic?: boolean;
}): Promise<void> {
  const adapter = db();
  const pins = readJsonPreference<SurfMapPin[]>(adapter, SURF_PINS_KEY, []);

  pins.unshift({
    id: crypto.randomUUID(),
    name: input.name.trim(),
    notes: input.notes?.trim() ?? '',
    latitude: input.latitude,
    longitude: input.longitude,
    isPublic: !!input.isPublic,
    createdAt: new Date().toISOString(),
  });

  writeJsonPreference(adapter, SURF_PINS_KEY, pins.slice(0, 250));
}

export async function doDeleteSurfPin(id: string): Promise<void> {
  const adapter = db();
  const pins = readJsonPreference<SurfMapPin[]>(adapter, SURF_PINS_KEY, []);
  writeJsonPreference(
    adapter,
    SURF_PINS_KEY,
    pins.filter((pin) => pin.id !== id),
  );
}

export async function fetchSurfAuthSession(): Promise<SurfAuthUser | null> {
  const adapter = db();
  const users = readJsonPreference<StoredSurfUser[]>(adapter, SURF_USERS_KEY, []);
  const sessionUserId = getPreference(adapter, SURF_SESSION_KEY);
  if (!sessionUserId) return null;

  const user = users.find((candidate) => candidate.id === sessionUserId);
  return user ? toPublicUser(user) : null;
}

export async function doRegisterSurfUser(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const adapter = db();
  const users = readJsonPreference<StoredSurfUser[]>(adapter, SURF_USERS_KEY, []);

  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail.includes('@')) {
    return { ok: false, reason: 'Enter a valid email address.' };
  }
  if (input.password.length < 6) {
    return { ok: false, reason: 'Password must be at least 6 characters.' };
  }
  if (users.some((user) => user.email === normalizedEmail)) {
    return { ok: false, reason: 'An account with this email already exists.' };
  }

  const nextUser: StoredSurfUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password: input.password,
    displayName: input.displayName?.trim() || normalizedEmail.split('@')[0] || 'Surfer',
    createdAt: new Date().toISOString(),
  };

  users.push(nextUser);
  writeJsonPreference(adapter, SURF_USERS_KEY, users);
  setPreference(adapter, SURF_SESSION_KEY, nextUser.id);
  writeJsonPreference(adapter, profileKey(nextUser.id), defaultProfile());

  return { ok: true };
}

export async function doLoginSurfUser(input: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const adapter = db();
  const users = readJsonPreference<StoredSurfUser[]>(adapter, SURF_USERS_KEY, []);

  const normalizedEmail = input.email.trim().toLowerCase();
  const user = users.find((candidate) => candidate.email === normalizedEmail);
  if (!user || user.password !== input.password) {
    return { ok: false, reason: 'Invalid email or password.' };
  }

  setPreference(adapter, SURF_SESSION_KEY, user.id);
  return { ok: true };
}

export async function doLogoutSurfUser(): Promise<void> {
  setPreference(db(), SURF_SESSION_KEY, '');
}

export async function fetchSurfProfile(): Promise<SurfProfile> {
  const adapter = db();
  const session = await fetchSurfAuthSession();
  if (!session) {
    return defaultProfile();
  }
  return readJsonPreference<SurfProfile>(adapter, profileKey(session.id), defaultProfile());
}

export async function doUpdateSurfProfile(
  updates: Partial<SurfProfile>,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const adapter = db();
  const session = await fetchSurfAuthSession();
  if (!session) {
    return { ok: false, reason: 'Sign in to update profile settings.' };
  }

  const current = readJsonPreference<SurfProfile>(
    adapter,
    profileKey(session.id),
    defaultProfile(),
  );
  writeJsonPreference(adapter, profileKey(session.id), {
    ...current,
    ...updates,
  });
  return { ok: true };
}

export async function fetchSurfAccountState(): Promise<{
  session: SurfAuthUser | null;
  profile: SurfProfile;
}> {
  const session = await fetchSurfAuthSession();
  const profile = await fetchSurfProfile();
  return { session, profile };
}

export async function doCreateSurfSpot(
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
): Promise<void> {
  createSpot(db(), id, input);
}

export async function doUpdateSurfSpotConditions(
  id: string,
  updates: Partial<{
    waveHeightFt: number;
    windKts: number;
    tide: SurfSpot['tide'];
    swellDirection: string;
  }>,
): Promise<void> {
  updateSpotConditions(db(), id, updates);
}

export async function doToggleSurfFavorite(id: string): Promise<void> {
  toggleSpotFavorite(db(), id);
}

export async function doDeleteSurfSpot(id: string): Promise<void> {
  deleteSpot(db(), id);
}

export async function doCreateSurfSession(
  id: string,
  input: {
    spotId: string;
    sessionDate: string;
    durationMin: number;
    rating: number;
    notes?: string;
  },
): Promise<void> {
  createSession(db(), id, input);
}

export async function doDeleteSurfSession(id: string): Promise<void> {
  deleteSession(db(), id);
}
