import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
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
import { getWaterIntake, incrementWaterIntake, setWaterTarget } from '../db/water';
import { getNotificationPreferences, setNotificationPreference } from '../db/notifications';
import { createGoal, getGoalProgress, refreshGoalProgress, listGoalProgress } from '../db/goals';
import { computeStreaks } from '../stats/streaks';
import { averageDuration, adherenceRate } from '../stats/aggregation';
import { getMonthlySummary } from '../stats/summary';
import { exportFastsCSV } from '../export';
import { getCurrentFastingZone } from '../zones';

describe('@mylife/fast', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('fast', FAST_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
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

    it('has default notification config seeded', () => {
      const prefs = getNotificationPreferences(adapter);
      expect(prefs.fastStart).toBe(true);
      expect(prefs.fastComplete).toBe(true);
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
  // Water Intake
  // ─────────────────────────────────────────────────────────────────────────

  describe('water intake', () => {
    it('increments and completes against target', () => {
      const date = new Date('2026-01-15T08:00:00Z');
      incrementWaterIntake(adapter, 5, date);
      incrementWaterIntake(adapter, 3, date);

      const intake = getWaterIntake(adapter, date);
      expect(intake.count).toBe(8);
      expect(intake.target).toBe(8);
      expect(intake.completed).toBe(true);
    });

    it('supports custom target', () => {
      const date = new Date('2026-01-15T08:00:00Z');
      setWaterTarget(adapter, 10, date);
      incrementWaterIntake(adapter, 4, date);
      const intake = getWaterIntake(adapter, date);
      expect(intake.target).toBe(10);
      expect(intake.count).toBe(4);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Notification Preferences
  // ─────────────────────────────────────────────────────────────────────────

  describe('notification preferences', () => {
    it('updates notification preference', () => {
      setNotificationPreference(adapter, 'progress25', true);
      const prefs = getNotificationPreferences(adapter);
      expect(prefs.progress25).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Goals + Summary + Zones
  // ─────────────────────────────────────────────────────────────────────────

  describe('goals and summary', () => {
    it('computes weekly fast-count goal progress', () => {
      const goal = createGoal(adapter, { type: 'fasts_per_week', targetValue: 5 });

      startFast(adapter, 'f1', '16:8', 16, new Date('2026-01-05T08:00:00Z'));
      endFast(adapter, new Date('2026-01-06T00:00:00Z'));
      startFast(adapter, 'f2', '16:8', 16, new Date('2026-01-06T08:00:00Z'));
      endFast(adapter, new Date('2026-01-07T00:00:00Z'));
      startFast(adapter, 'f3', '16:8', 16, new Date('2026-01-07T08:00:00Z'));
      endFast(adapter, new Date('2026-01-08T00:00:00Z'));

      const progress = getGoalProgress(adapter, goal.id, new Date('2026-01-07T20:00:00Z'));
      expect(progress).not.toBeNull();
      expect(progress!.currentValue).toBe(3);
      expect(progress!.completed).toBe(false);
    });

    it('refreshGoalProgress keeps one row per period', () => {
      const goal = createGoal(adapter, { type: 'fasts_per_week', targetValue: 2 });
      startFast(adapter, 'f1', '16:8', 16, new Date('2026-01-05T08:00:00Z'));
      endFast(adapter, new Date('2026-01-06T00:00:00Z'));

      refreshGoalProgress(adapter, new Date('2026-01-05T20:00:00Z'));
      refreshGoalProgress(adapter, new Date('2026-01-06T20:00:00Z'));

      const progressRows = listGoalProgress(adapter, goal.id, 10);
      expect(progressRows).toHaveLength(1);
      expect(progressRows[0].currentValue).toBe(1);
    });

    it('computes monthly summary', () => {
      startFast(adapter, 'f1', '16:8', 16, new Date('2026-01-01T08:00:00Z'));
      endFast(adapter, new Date('2026-01-02T00:00:00Z'));
      startFast(adapter, 'f2', '16:8', 16, new Date('2026-01-03T08:00:00Z'));
      endFast(adapter, new Date('2026-01-04T02:00:00Z'));

      const summary = getMonthlySummary(adapter, 2026, 1);
      expect(summary.totalFasts).toBe(2);
      expect(summary.totalHours).toBe(34);
      expect(summary.longestFastHours).toBe(18);
    });

    it('resolves fasting zone from elapsed time', () => {
      const zone = getCurrentFastingZone(10 * 3600);
      expect(zone.name).toBe('Fat Burning');
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
