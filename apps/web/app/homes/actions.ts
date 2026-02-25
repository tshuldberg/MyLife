'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createListing,
  getListings,
  toggleListingSaved,
  updateListingStatus,
  deleteListing,
  getHomeMarketMetrics,
  createTour,
  getToursByListing,
  deleteTour,
} from '@mylife/homes';
import type {
  HomeListing,
  HomeListingStatus,
  HomeMarketMetrics,
  HomeTour,
} from '@mylife/homes';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('homes');
  return adapter;
}

export async function fetchHomesOverview(): Promise<HomeMarketMetrics> {
  return getHomeMarketMetrics(db());
}

export async function fetchHomeListings(input?: {
  search?: string;
  savedOnly?: boolean;
  status?: HomeListingStatus;
}): Promise<HomeListing[]> {
  return getListings(db(), input);
}

export async function fetchListingTours(listingId: string): Promise<HomeTour[]> {
  return getToursByListing(db(), listingId);
}

export async function doCreateHomeListing(
  id: string,
  input: {
    address: string;
    city: string;
    state: string;
    priceCents: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    status?: HomeListingStatus;
    isSaved?: boolean;
    notes?: string;
  },
): Promise<void> {
  createListing(db(), id, input);
}

export async function doToggleHomeListingSaved(id: string): Promise<void> {
  toggleListingSaved(db(), id);
}

export async function doUpdateHomeListingStatus(
  id: string,
  status: HomeListingStatus,
): Promise<void> {
  updateListingStatus(db(), id, status);
}

export async function doDeleteHomeListing(id: string): Promise<void> {
  deleteListing(db(), id);
}

export async function doCreateHomeTour(
  id: string,
  input: {
    listingId: string;
    tourAt: string;
    agentName?: string;
    notes?: string;
  },
): Promise<void> {
  createTour(db(), id, input);
}

export async function doDeleteHomeTour(id: string): Promise<void> {
  deleteTour(db(), id);
}
