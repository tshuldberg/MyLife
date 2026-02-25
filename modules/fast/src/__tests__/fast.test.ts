import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import type { DatabaseAdapter } from '@mylife/db';
import { initializeHubDatabase, runModuleMigrations } from '@mylife/db';
import { FAST_MODULE } from '../definition';
import { computeTimerState, formatDuration } from '../timer';
import { PRESET_PROTOCOLS } from '../protocols';
import {
  startFast,
  endFast,
  getActiveFast,
  listFasts,
  countFasts,
  deleteFast,
  getProtocols,
  getSetting,
  setSetting,
} from '../db/fasts';
import { computeStreaks } from '../stats/streaks';
import { averageDuration, adherenceRate } from '../stats/aggregation';
import { exportFastsCSV } from '../export';

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

describe('@mylife/fast', () => {
  let adapter: DatabaseAdapter;

  beforeEach(() => {
    adapter = createTestAdapter();
    initializeHubDatabase(adapter);
    runModuleMigrations(adapter, 'fast', FAST_MODULE.migrations!);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Module definition
  // ─────────────────────────────────────────────────────────────────────────

  describe('FAST_MODULE definition', () => {
    it('has correct metadata', () => {
      expect(FAST_MODULE.id).toBe('fast');
      expect(FAST_MODULE.tier).toBe('free');
      expect(FAST_MODULE.storageType).toBe('sqlite');
      expect(FAST_MODULE.tablePrefix).toBe('ft_');
    });

    it('has 4 navigation tabs', () => {
      expect(FAST_MODULE.navigation.tabs).toHaveLength(4);
    });

    it('has at least one migration', () => {
      expect(FAST_MODULE.migrations).toBeDefined();
      expect(FAST_MODULE.migrations!.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Timer state machine
  // ─────────────────────────────────────────────────────────────────────────

  describe('computeTimerState', () => {
    it('returns idle state when no active fast', () => {
      const state = computeTimerState(null, new Date());
      expect(state.state).toBe('idle');
      expect(state.elapsed).toBe(0);
      expect(state.progress).toBe(0);
      expect(state.targetReached).toBe(false);
    });

    it('returns fasting state with progress', () => {
      const started = '2026-01-01T08:00:00.000Z';
      const now = new Date('2026-01-01T12:00:00.000Z'); // 4 hours later
      const activeFast = {
        id: 'current',
        fastId: 'f1',
        protocol: '16:8',
        targetHours: 16,
        startedAt: started,
      };
      const state = computeTimerState(activeFast, now);
      expect(state.state).toBe('fasting');
      expect(state.elapsed).toBe(4 * 3600);
      expect(state.progress).toBeCloseTo(0.25, 2);
      expect(state.targetReached).toBe(false);
    });

    it('returns targetReached when past target', () => {
      const started = '2026-01-01T08:00:00.000Z';
      const now = new Date('2026-01-02T01:00:00.000Z'); // 17 hours later
      const activeFast = {
        id: 'current',
        fastId: 'f1',
        protocol: '16:8',
        targetHours: 16,
        startedAt: started,
      };
      const state = computeTimerState(activeFast, now);
      expect(state.state).toBe('fasting');
      expect(state.targetReached).toBe(true);
      expect(state.progress).toBe(1);
      expect(state.remaining).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('formats 0 seconds', () => {
      expect(formatDuration(0)).toBe('00:00:00');
    });

    it('formats hours, minutes, seconds', () => {
      expect(formatDuration(3661)).toBe('01:01:01');
    });

    it('handles large durations', () => {
      expect(formatDuration(86400)).toBe('24:00:00');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Protocols
  // ─────────────────────────────────────────────────────────────────────────

  describe('PRESET_PROTOCOLS', () => {
    it('has 6 presets', () => {
      expect(PRESET_PROTOCOLS).toHaveLength(6);
    });

    it('each preset has required fields', () => {
      for (const p of PRESET_PROTOCOLS) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.fastingHours).toBeGreaterThan(0);
        expect(p.eatingHours).toBeGreaterThanOrEqual(0);
      }
    });

    it('fasting + eating hours equal 24 or more', () => {
      for (const p of PRESET_PROTOCOLS) {
        expect(p.fastingHours + p.eatingHours).toBeGreaterThanOrEqual(24);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Seeded data
  // ─────────────────────────────────────────────────────────────────────────

  describe('seeded data', () => {
    it('has 6 protocols seeded', () => {
      const protocols = getProtocols(adapter);
      expect(protocols).toHaveLength(6);
    });

    it('has default settings seeded', () => {
      expect(getSetting(adapter, 'defaultProtocol')).toBe('16:8');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────

  describe('CRUD operations', () => {
    it('starts with no fasts', () => {
      expect(countFasts(adapter)).toBe(0);
      expect(getActiveFast(adapter)).toBeNull();
    });

    it('starts and ends a fast', () => {
      startFast(adapter, 'f1', '16:8', 16);
      const active = getActiveFast(adapter);
      expect(active).not.toBeNull();
      expect(active!.protocol).toBe('16:8');

      endFast(adapter);
      expect(getActiveFast(adapter)).toBeNull();
      expect(countFasts(adapter)).toBe(1);
    });

    it('lists fasts in reverse chronological order', () => {
      startFast(adapter, 'f1', '16:8', 16, new Date('2026-01-01T08:00:00Z'));
      endFast(adapter, new Date('2026-01-02T00:00:00Z'));
      startFast(adapter, 'f2', '18:6', 18, new Date('2026-01-02T08:00:00Z'));
      endFast(adapter, new Date('2026-01-03T02:00:00Z'));
      const fasts = listFasts(adapter);
      expect(fasts).toHaveLength(2);
      // Most recent first
      expect(fasts[0].id).toBe('f2');
    });

    it('deletes a fast', () => {
      startFast(adapter, 'f1', '16:8', 16);
      endFast(adapter);
      deleteFast(adapter, 'f1');
      expect(countFasts(adapter)).toBe(0);
    });

    it('updates settings', () => {
      setSetting(adapter, 'defaultProtocol', '20:4');
      expect(getSetting(adapter, 'defaultProtocol')).toBe('20:4');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────────────────────────────────────

  describe('stats', () => {
    beforeEach(() => {
      // Create two completed fasts — both hit target
      startFast(adapter, 'f1', '16:8', 16, new Date('2026-01-01T08:00:00Z'));
      endFast(adapter, new Date('2026-01-02T00:00:00Z')); // 16h exactly
      startFast(adapter, 'f2', '16:8', 16, new Date('2026-01-02T08:00:00Z'));
      endFast(adapter, new Date('2026-01-03T02:00:00Z')); // 18h
    });

    it('computes average duration', () => {
      const avg = averageDuration(adapter);
      // (16h + 18h) / 2 = 17h = 61200s
      expect(avg).toBe(61200);
    });

    it('computes adherence rate as percentage', () => {
      const rate = adherenceRate(adapter);
      // Both hit target -> 100%
      expect(rate).toBe(100);
    });

    it('computes streaks', () => {
      const streaks = computeStreaks(adapter);
      expect(streaks.currentStreak).toBeGreaterThanOrEqual(0);
      expect(streaks.longestStreak).toBeGreaterThanOrEqual(0);
      expect(streaks.totalFasts).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Export
  // ─────────────────────────────────────────────────────────────────────────

  describe('CSV export', () => {
    it('exports header when no fasts', () => {
      const csv = exportFastsCSV(adapter);
      expect(csv).toContain('id,');
      const lines = csv.trim().split('\n');
      expect(lines).toHaveLength(1); // header only
    });

    it('exports fasts as CSV rows', () => {
      startFast(adapter, 'f1', '16:8', 16, new Date('2026-01-01T08:00:00Z'));
      endFast(adapter, new Date('2026-01-02T00:00:00Z'));
      const csv = exportFastsCSV(adapter);
      const lines = csv.trim().split('\n');
      expect(lines).toHaveLength(2); // header + 1 row
      expect(lines[1]).toContain('f1');
    });
  });
});
