import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import type { DatabaseAdapter } from '@mylife/db';
import { initializeHubDatabase, runModuleMigrations } from '@mylife/db';
import { SUBS_MODULE } from '../definition';
import {
  normalizeToMonthly,
  normalizeToAnnual,
  normalizeToDaily,
  calculateSubscriptionSummary,
} from '../cost';
import {
  calculateNextRenewal,
  advanceRenewalDate,
  getUpcomingRenewals,
} from '../renewal';
import { searchCatalog, getCatalogByCategory, getPopularEntries, CATALOG_ENTRIES } from '../catalog';
import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  countSubscriptions,
  updateSubscription,
  deleteSubscription,
  validateTransition,
  getValidTransitions,
  transitionSubscription,
  getSetting,
  setSetting,
} from '../db/crud';
import {
  recordPriceChange,
  getPriceHistory,
  getLifetimeCost,
} from '../price-history';
import type { Subscription } from '../types';

function createTestAdapter(): DatabaseAdapter {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return {
    execute(sql: string, params?: unknown[]): void {
      db.prepare(sql).run(...(params ?? []));
    },
    query<T>(sql: string, params?: unknown[]): T[] {
      return db.prepare(sql).all(...(params ?? [])) as T[];
    },
    transaction(fn: () => void): void {
      db.transaction(fn)();
    },
  };
}

describe('@mylife/subs', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Module definition
  // ─────────────────────────────────────────────────────────────────────────

  describe('SUBS_MODULE definition', () => {
    it('has correct metadata', () => {
      expect(SUBS_MODULE.id).toBe('subs');
      expect(SUBS_MODULE.tier).toBe('free');
      expect(SUBS_MODULE.storageType).toBe('sqlite');
      expect(SUBS_MODULE.tablePrefix).toBe('sb_');
    });

    it('has 4 navigation tabs', () => {
      expect(SUBS_MODULE.navigation.tabs).toHaveLength(4);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Cost normalization
  // ─────────────────────────────────────────────────────────────────────────

  describe('cost normalization', () => {
    it('monthly passes through', () => {
      expect(normalizeToMonthly(1000, 'monthly')).toBe(1000);
    });

    it('annual divides by 12', () => {
      expect(normalizeToMonthly(12000, 'annual')).toBe(1000);
    });

    it('weekly converts to monthly', () => {
      const result = normalizeToMonthly(100, 'weekly');
      expect(result).toBe(Math.round((100 * 52) / 12));
    });

    it('quarterly divides by 3', () => {
      expect(normalizeToMonthly(3000, 'quarterly')).toBe(1000);
    });

    it('semi_annual divides by 6', () => {
      expect(normalizeToMonthly(6000, 'semi_annual')).toBe(1000);
    });

    it('custom requires customDays', () => {
      expect(() => normalizeToMonthly(1000, 'custom')).toThrow();
    });

    it('custom with 30 days approximates monthly', () => {
      const result = normalizeToMonthly(1000, 'custom', 30);
      // 1000 * (365/30) / 12 ≈ 1014
      expect(result).toBeCloseTo(1014, -1);
    });

    it('normalizeToAnnual from monthly', () => {
      expect(normalizeToAnnual(1000, 'monthly')).toBe(12000);
    });

    it('normalizeToDaily from annual', () => {
      const result = normalizeToDaily(36500, 'annual');
      expect(result).toBe(100); // 36500 / 365
    });

    it('calculateSubscriptionSummary aggregates correctly', () => {
      const subs: Subscription[] = [
        makeSub({ price: 1000, billing_cycle: 'monthly', status: 'active', category: 'entertainment' }),
        makeSub({ price: 2000, billing_cycle: 'monthly', status: 'active', category: 'productivity' }),
        makeSub({ price: 500, billing_cycle: 'monthly', status: 'cancelled' }),
      ];
      const summary = calculateSubscriptionSummary(subs);
      expect(summary.monthlyTotal).toBe(3000);
      expect(summary.annualTotal).toBe(36000);
      expect(summary.activeCount).toBe(2);
      expect(summary.totalCount).toBe(3);
      expect(summary.byCategory).toHaveLength(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Renewal engine
  // ─────────────────────────────────────────────────────────────────────────

  describe('renewal engine', () => {
    it('advances monthly', () => {
      const next = calculateNextRenewal('2026-01-15', 'monthly', null, '2026-01-20');
      expect(next).toBe('2026-02-15');
    });

    it('advances annual', () => {
      const next = calculateNextRenewal('2025-03-01', 'annual', null, '2026-01-01');
      expect(next).toBe('2026-03-01');
    });

    it('handles month-end edge case (Jan 31 -> Feb 28)', () => {
      const next = advanceRenewalDate('2026-01-31', 'monthly');
      expect(next).toBe('2026-02-28');
    });

    it('handles quarterly', () => {
      const next = calculateNextRenewal('2026-01-01', 'quarterly', null, '2026-01-02');
      expect(next).toBe('2026-04-01');
    });

    it('handles weekly', () => {
      const next = calculateNextRenewal('2026-01-01', 'weekly', null, '2026-01-05');
      expect(next).toBe('2026-01-08');
    });

    it('handles custom days', () => {
      const next = calculateNextRenewal('2026-01-01', 'custom', 45, '2026-01-10');
      expect(next).toBe('2026-02-15');
    });

    it('getUpcomingRenewals filters to window', () => {
      const subs: Subscription[] = [
        makeSub({ next_renewal: '2026-02-01', status: 'active' }),
        makeSub({ next_renewal: '2026-03-01', status: 'active' }),
        makeSub({ next_renewal: '2026-02-01', status: 'cancelled' }),
      ];
      const upcoming = getUpcomingRenewals(subs, 30, '2026-01-25');
      expect(upcoming).toHaveLength(1);
      expect(upcoming[0].next_renewal).toBe('2026-02-01');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog
  // ─────────────────────────────────────────────────────────────────────────

  describe('catalog', () => {
    it('has 200+ entries', () => {
      expect(CATALOG_ENTRIES.length).toBeGreaterThan(200);
    });

    it('searchCatalog finds Netflix', () => {
      const results = searchCatalog('netflix');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('netflix');
    });

    it('searchCatalog returns empty for empty query', () => {
      expect(searchCatalog('')).toEqual([]);
    });

    it('getCatalogByCategory returns entries for entertainment', () => {
      const results = getCatalogByCategory('entertainment');
      expect(results.length).toBeGreaterThan(20);
      for (const r of results) {
        expect(r.category).toBe('entertainment');
      }
    });

    it('getPopularEntries returns curated list', () => {
      const popular = getPopularEntries();
      expect(popular.length).toBeGreaterThan(10);
    });

    it('all catalog entries have required fields', () => {
      for (const entry of CATALOG_ENTRIES) {
        expect(entry.id).toBeTruthy();
        expect(entry.name).toBeTruthy();
        expect(typeof entry.defaultPrice).toBe('number');
        expect(entry.billingCycle).toBeTruthy();
        expect(entry.category).toBeTruthy();
        expect(entry.iconKey).toBeTruthy();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD (with DB)
  // ─────────────────────────────────────────────────────────────────────────

  describe('CRUD operations', () => {
    let adapter: DatabaseAdapter;

    beforeEach(() => {
      adapter = createTestAdapter();
      initializeHubDatabase(adapter);
      runModuleMigrations(adapter, 'subs', SUBS_MODULE.migrations!);
    });

    it('starts with no subscriptions', () => {
      expect(countSubscriptions(adapter)).toBe(0);
    });

    it('creates and retrieves a subscription', () => {
      createSubscription(adapter, 's1', {
        name: 'Netflix',
        price: 1549,
        billing_cycle: 'monthly',
        status: 'active',
        start_date: '2026-01-01',
        next_renewal: '2026-02-01',
      });
      expect(countSubscriptions(adapter)).toBe(1);
      const sub = getSubscriptionById(adapter, 's1');
      expect(sub).not.toBeNull();
      expect(sub!.name).toBe('Netflix');
      expect(sub!.price).toBe(1549);
    });

    it('lists subscriptions with filter', () => {
      createSubscription(adapter, 's1', {
        name: 'Netflix', price: 1549, billing_cycle: 'monthly',
        status: 'active', start_date: '2026-01-01', next_renewal: '2026-02-01',
      });
      createSubscription(adapter, 's2', {
        name: 'Old Service', price: 500, billing_cycle: 'monthly',
        status: 'cancelled', start_date: '2025-01-01', next_renewal: '2025-02-01',
      });
      const active = getSubscriptions(adapter, { status: 'active' });
      expect(active).toHaveLength(1);
      expect(active[0].name).toBe('Netflix');
    });

    it('updates a subscription', () => {
      createSubscription(adapter, 's1', {
        name: 'Netflix', price: 1549, billing_cycle: 'monthly',
        status: 'active', start_date: '2026-01-01', next_renewal: '2026-02-01',
      });
      updateSubscription(adapter, 's1', { price: 1699 });
      const sub = getSubscriptionById(adapter, 's1');
      expect(sub!.price).toBe(1699);
    });

    it('deletes a subscription', () => {
      createSubscription(adapter, 's1', {
        name: 'Netflix', price: 1549, billing_cycle: 'monthly',
        status: 'active', start_date: '2026-01-01', next_renewal: '2026-02-01',
      });
      deleteSubscription(adapter, 's1');
      expect(countSubscriptions(adapter)).toBe(0);
    });

    it('settings default from seed', () => {
      expect(getSetting(adapter, 'currency')).toBe('USD');
      expect(getSetting(adapter, 'defaultNotifyDays')).toBe('1');
    });

    it('updates settings', () => {
      setSetting(adapter, 'currency', 'EUR');
      expect(getSetting(adapter, 'currency')).toBe('EUR');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Status transitions
  // ─────────────────────────────────────────────────────────────────────────

  describe('status transitions', () => {
    let adapter: DatabaseAdapter;

    beforeEach(() => {
      adapter = createTestAdapter();
      initializeHubDatabase(adapter);
      runModuleMigrations(adapter, 'subs', SUBS_MODULE.migrations!);
    });

    it('active -> paused is valid', () => {
      expect(validateTransition('active', 'paused')).toBe(true);
    });

    it('active -> cancelled is valid', () => {
      expect(validateTransition('active', 'cancelled')).toBe(true);
    });

    it('cancelled -> active is invalid', () => {
      expect(validateTransition('cancelled', 'active')).toBe(false);
    });

    it('paused -> active is valid', () => {
      expect(validateTransition('paused', 'active')).toBe(true);
    });

    it('trial -> active is valid', () => {
      expect(validateTransition('trial', 'active')).toBe(true);
    });

    it('getValidTransitions returns correct options', () => {
      expect(getValidTransitions('active')).toEqual(['paused', 'cancelled']);
      expect(getValidTransitions('cancelled')).toEqual([]);
    });

    it('transitionSubscription updates status', () => {
      createSubscription(adapter, 's1', {
        name: 'Netflix', price: 1549, billing_cycle: 'monthly',
        status: 'active', start_date: '2026-01-01', next_renewal: '2026-02-01',
      });
      const updated = transitionSubscription(adapter, 's1', 'paused');
      expect(updated.status).toBe('paused');
    });

    it('transitionSubscription to cancelled sets cancelled_date', () => {
      createSubscription(adapter, 's1', {
        name: 'Netflix', price: 1549, billing_cycle: 'monthly',
        status: 'active', start_date: '2026-01-01', next_renewal: '2026-02-01',
      });
      const updated = transitionSubscription(adapter, 's1', 'cancelled');
      expect(updated.status).toBe('cancelled');
      expect(updated.cancelled_date).not.toBeNull();
    });

    it('invalid transition throws', () => {
      createSubscription(adapter, 's1', {
        name: 'Netflix', price: 1549, billing_cycle: 'monthly',
        status: 'cancelled', start_date: '2026-01-01', next_renewal: '2026-02-01',
      });
      expect(() => transitionSubscription(adapter, 's1', 'active')).toThrow(/Invalid transition/);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Price history
  // ─────────────────────────────────────────────────────────────────────────

  describe('price history', () => {
    let adapter: DatabaseAdapter;

    beforeEach(() => {
      adapter = createTestAdapter();
      initializeHubDatabase(adapter);
      runModuleMigrations(adapter, 'subs', SUBS_MODULE.migrations!);
    });

    it('records and retrieves price changes', () => {
      createSubscription(adapter, 's1', {
        name: 'Netflix', price: 1549, billing_cycle: 'monthly',
        status: 'active', start_date: '2026-01-01', next_renewal: '2026-02-01',
      });
      recordPriceChange(adapter, 'ph1', 's1', 1299, '2025-06-01');
      recordPriceChange(adapter, 'ph2', 's1', 1549, '2026-01-01');
      const history = getPriceHistory(adapter, 's1');
      expect(history).toHaveLength(2);
      expect(history[0].price).toBe(1299);
      expect(history[1].price).toBe(1549);
    });

    it('estimates lifetime cost', () => {
      createSubscription(adapter, 's1', {
        name: 'Netflix', price: 1549, billing_cycle: 'monthly',
        status: 'active', start_date: '2026-01-01', next_renewal: '2026-02-01',
      });
      const cost = getLifetimeCost(adapter, getSubscriptionById(adapter, 's1')!, '2026-04-01');
      // ~3 months at 1549/mo ≈ 4647
      expect(cost).toBeGreaterThan(4000);
      expect(cost).toBeLessThan(5500);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Test helper
// ─────────────────────────────────────────────────────────────────────────

let subCounter = 0;
function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  subCounter++;
  return {
    id: `test-${subCounter}`,
    name: `Test Sub ${subCounter}`,
    price: 1000,
    currency: 'USD',
    billing_cycle: 'monthly',
    custom_days: null,
    category: null,
    status: 'active',
    start_date: '2026-01-01',
    next_renewal: '2026-02-01',
    trial_end_date: null,
    cancelled_date: null,
    notes: null,
    url: null,
    icon: null,
    color: null,
    notify_days: 1,
    catalog_id: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
