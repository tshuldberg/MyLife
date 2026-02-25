'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  countSubscriptions,
  updateSubscription,
  deleteSubscription,
  transitionSubscription,
  getValidTransitions,
  getSetting,
  setSetting,
  calculateSubscriptionSummary,
  getUpcomingRenewals,
  calculateNextRenewal,
  recordPriceChange,
  getPriceHistory,
  getLifetimeCost,
  searchCatalog,
  getCatalogByCategory,
  getPopularEntries,
  type SubscriptionInsert,
  type SubscriptionFilter,
  type SubscriptionUpdate,
  type SubscriptionStatus,
  type CatalogCategory,
} from '@mylife/subs';

/** Ensure subs module tables exist before any query. */
function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('subs');
  return adapter;
}

// ---------------------------------------------------------------------------
// Subscriptions CRUD
// ---------------------------------------------------------------------------

export async function doCreateSubscription(id: string, input: SubscriptionInsert) {
  return createSubscription(db(), id, input);
}

export async function fetchSubscriptions(filters?: SubscriptionFilter) {
  return getSubscriptions(db(), filters);
}

export async function fetchSubscriptionById(id: string) {
  return getSubscriptionById(db(), id);
}

export async function fetchSubscriptionCount() {
  return countSubscriptions(db());
}

export async function doUpdateSubscription(id: string, updates: SubscriptionUpdate) {
  return updateSubscription(db(), id, updates);
}

export async function doDeleteSubscription(id: string) {
  return deleteSubscription(db(), id);
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

export async function doTransitionSubscription(id: string, newStatus: SubscriptionStatus) {
  return transitionSubscription(db(), id, newStatus);
}

export async function fetchValidTransitions(status: SubscriptionStatus) {
  return getValidTransitions(status);
}

// ---------------------------------------------------------------------------
// Cost summary
// ---------------------------------------------------------------------------

export async function fetchSummary() {
  const subs = getSubscriptions(db());
  return calculateSubscriptionSummary(subs);
}

// ---------------------------------------------------------------------------
// Renewals
// ---------------------------------------------------------------------------

export async function fetchUpcomingRenewals(daysAhead?: number) {
  const subs = getSubscriptions(db());
  return getUpcomingRenewals(subs, daysAhead);
}

export async function doCalculateNextRenewal(
  startDate: string,
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom',
  customDays?: number | null,
) {
  return calculateNextRenewal(startDate, billingCycle, customDays);
}

// ---------------------------------------------------------------------------
// Price history
// ---------------------------------------------------------------------------

export async function doRecordPriceChange(
  id: string,
  subscriptionId: string,
  oldPrice: number,
  effectiveDate: string,
) {
  return recordPriceChange(db(), id, subscriptionId, oldPrice, effectiveDate);
}

export async function fetchPriceHistory(subscriptionId: string) {
  return getPriceHistory(db(), subscriptionId);
}

export async function fetchLifetimeCost(subscriptionId: string) {
  const sub = getSubscriptionById(db(), subscriptionId);
  if (!sub) return 0;
  return getLifetimeCost(db(), sub);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function fetchSetting(key: string) {
  return getSetting(db(), key);
}

export async function doUpdateSetting(key: string, value: string) {
  return setSetting(db(), key, value);
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export async function doSearchCatalog(query: string) {
  return searchCatalog(query);
}

export async function fetchCatalogByCategory(category: CatalogCategory) {
  return getCatalogByCategory(category);
}

export async function fetchPopularEntries() {
  return getPopularEntries();
}
