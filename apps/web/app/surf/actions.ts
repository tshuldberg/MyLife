'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createSpot,
  getSpots,
  updateSpotConditions,
  toggleSpotFavorite,
  deleteSpot,
  countSpots,
  countFavoriteSpots,
  getAverageWaveHeightFt,
  createSession,
  getSessions,
  deleteSession,
  countSessions,
} from '@mylife/surf';
import type { SurfSpot, SurfSession } from '@mylife/surf';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('surf');
  return adapter;
}

export async function fetchSurfOverview(): Promise<{
  spots: number;
  favorites: number;
  averageWaveHeightFt: number;
  sessions: number;
}> {
  const adapter = db();
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
  return getSpots(db(), input);
}

export async function fetchSurfSessions(input?: {
  spotId?: string;
  limit?: number;
}): Promise<SurfSession[]> {
  return getSessions(db(), input);
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
