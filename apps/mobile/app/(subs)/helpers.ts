import {
  BillingCycle,
  SubscriptionStatus,
  calculateNextRenewal,
  calculateSubscriptionSummary,
  getSubscriptions,
  getUpcomingRenewals,
  type Subscription,
} from '@mylife/subs';
import type { DatabaseAdapter } from '@mylife/db';

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function defaultNextRenewal(
  startDate: string,
  billingCycle: BillingCycle,
  customDays: number | null,
): string {
  return calculateNextRenewal(startDate, billingCycle, customDays);
}

export function loadSubsDashboard(db: DatabaseAdapter, days = 14): {
  subscriptions: Subscription[];
  summary: ReturnType<typeof calculateSubscriptionSummary>;
  upcoming: Subscription[];
} {
  const subscriptions = getSubscriptions(db);
  const summary = calculateSubscriptionSummary(subscriptions);
  const upcoming = getUpcomingRenewals(subscriptions, days);
  return { subscriptions, summary, upcoming };
}

export const STATUS_ORDER: SubscriptionStatus[] = [
  'active',
  'trial',
  'paused',
  'cancelled',
];
