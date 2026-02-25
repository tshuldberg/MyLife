/**
 * Price history tracking for subscriptions.
 */

import type { DatabaseAdapter } from '@mylife/db';
import type { PriceHistory, Subscription } from './types';

/**
 * Record a price change for a subscription.
 */
export function recordPriceChange(
  db: DatabaseAdapter,
  id: string,
  subscriptionId: string,
  oldPrice: number,
  effectiveDate: string,
): PriceHistory {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO sb_price_history (id, subscription_id, price, effective_date, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, subscriptionId, oldPrice, effectiveDate, now],
  );
  return {
    id,
    subscription_id: subscriptionId,
    price: oldPrice,
    effective_date: effectiveDate,
    created_at: now,
  };
}

/**
 * Get the full price history for a subscription, ordered by effective_date ascending.
 */
export function getPriceHistory(
  db: DatabaseAdapter,
  subscriptionId: string,
): PriceHistory[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM sb_price_history WHERE subscription_id = ? ORDER BY effective_date ASC`,
    [subscriptionId],
  );
  return rows.map(rowToPriceHistory);
}

/**
 * Estimate total lifetime cost for a subscription from start_date to a reference date.
 */
export function getLifetimeCost(
  db: DatabaseAdapter,
  subscription: Subscription,
  untilDate?: string,
): number {
  const endDate = untilDate ?? new Date().toISOString().slice(0, 10);
  const history = getPriceHistory(db, subscription.id);

  const segments: Array<{ price: number; from: string; to: string }> = [];

  if (history.length === 0) {
    segments.push({
      price: subscription.price,
      from: subscription.start_date,
      to: endDate,
    });
  } else {
    for (let i = 0; i < history.length; i++) {
      const from = i === 0 ? subscription.start_date : history[i].effective_date;
      const to = i < history.length - 1 ? history[i + 1].effective_date : endDate;
      segments.push({ price: history[i].price, from, to });
    }

    const lastEntry = history[history.length - 1];
    if (subscription.price !== lastEntry.price) {
      const lastSeg = segments[segments.length - 1];
      if (lastSeg.from < lastEntry.effective_date) {
        lastSeg.to = lastEntry.effective_date;
        segments.push({
          price: subscription.price,
          from: lastEntry.effective_date,
          to: endDate,
        });
      }
    }
  }

  let totalCost = 0;
  for (const seg of segments) {
    const days = daysBetween(seg.from, seg.to);
    if (days <= 0) continue;
    totalCost += estimateCostForDays(
      seg.price,
      subscription.billing_cycle,
      subscription.custom_days,
      days,
    );
  }

  return Math.round(totalCost);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function estimateCostForDays(
  price: number,
  billingCycle: string,
  customDays: number | null,
  days: number,
): number {
  const cycleDays = getCycleDays(billingCycle, customDays);
  const periods = days / cycleDays;
  return price * periods;
}

function getCycleDays(billingCycle: string, customDays: number | null): number {
  switch (billingCycle) {
    case 'weekly': return 7;
    case 'monthly': return 30.437;
    case 'quarterly': return 91.311;
    case 'semi_annual': return 182.621;
    case 'annual': return 365.25;
    case 'custom': return customDays ?? 30;
    default: return 30.437;
  }
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const fromMs = new Date(fy, fm - 1, fd).getTime();
  const toMs = new Date(ty, tm - 1, td).getTime();
  return Math.floor((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

function rowToPriceHistory(row: Record<string, unknown>): PriceHistory {
  return {
    id: row.id as string,
    subscription_id: row.subscription_id as string,
    price: row.price as number,
    effective_date: row.effective_date as string,
    created_at: row.created_at as string,
  };
}
