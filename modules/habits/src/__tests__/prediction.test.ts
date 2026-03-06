import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { HABITS_MODULE } from '../definition';
import { predictNextPeriod, getLatestPrediction, estimateFertilityWindow } from '../cycle/prediction';
import { logPeriod } from '../cycle/crud';

describe('cycle prediction engine', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('habits', HABITS_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
  });

  // ── predictNextPeriod ──────────────────────────────────────────────────

  describe('predictNextPeriod', () => {
    it('returns null with 0 completed cycles', () => {
      const result = predictNextPeriod(adapter);
      expect(result).toBeNull();
    });

    it('returns null with only 1 completed cycle', () => {
      logPeriod(adapter, 'p1', { startDate: '2025-10-01', endDate: '2025-10-06' });
      const result = predictNextPeriod(adapter);
      expect(result).toBeNull();
    });

    it('predicts with exactly 3 completed periods (minimum 2 cycle lengths)', () => {
      logPeriod(adapter, 'p1', { startDate: '2025-09-03', endDate: '2025-09-08' });
      logPeriod(adapter, 'p2', { startDate: '2025-10-01', endDate: '2025-10-06' });
      logPeriod(adapter, 'p3', { startDate: '2025-10-29', endDate: '2025-11-03' });

      const result = predictNextPeriod(adapter);
      expect(result).not.toBeNull();
      expect(result!.predictedStart).toBeTruthy();
      expect(result!.predictedEnd).toBeTruthy();
      expect(result!.algorithmVersion).toBe('moving_avg_v1');
    });

    it('predicts accurately with regular 28-day cycles', () => {
      // 3 periods exactly 28 days apart
      logPeriod(adapter, 'p1', { startDate: '2025-09-03', endDate: '2025-09-08' });
      logPeriod(adapter, 'p2', { startDate: '2025-10-01', endDate: '2025-10-06' });
      logPeriod(adapter, 'p3', { startDate: '2025-10-29', endDate: '2025-11-03' });

      const result = predictNextPeriod(adapter);
      expect(result).not.toBeNull();
      // Cycle lengths: Oct29-Oct01=28, Oct01-Sep03=28. Average = 28
      // Predicted start = Oct29 + 28 = Nov26
      expect(result!.predictedStart).toBe('2025-11-26');
      // Confidence (stdDev) should be 0 for perfectly regular cycles
      expect(result!.confidenceDays).toBe(0);
    });

    it('predicts with regular 30-day cycles', () => {
      logPeriod(adapter, 'p1', { startDate: '2025-08-01', endDate: '2025-08-06' });
      logPeriod(adapter, 'p2', { startDate: '2025-08-31', endDate: '2025-09-05' });
      logPeriod(adapter, 'p3', { startDate: '2025-09-30', endDate: '2025-10-05' });

      const result = predictNextPeriod(adapter);
      expect(result).not.toBeNull();
      // Cycle lengths: Sep30-Aug31=30, Aug31-Aug01=30. Average = 30
      // Predicted start = Sep30 + 30 = Oct30
      expect(result!.predictedStart).toBe('2025-10-30');
      expect(result!.confidenceDays).toBe(0);
    });

    it('handles irregular cycles with nonzero confidence', () => {
      // Irregular: 26, 30, 28 days
      logPeriod(adapter, 'p1', { startDate: '2025-09-01', endDate: '2025-09-06' });
      logPeriod(adapter, 'p2', { startDate: '2025-09-27', endDate: '2025-10-02' });  // 26 days
      logPeriod(adapter, 'p3', { startDate: '2025-10-27', endDate: '2025-11-01' });  // 30 days
      logPeriod(adapter, 'p4', { startDate: '2025-11-24', endDate: '2025-11-29' });  // 28 days

      const result = predictNextPeriod(adapter);
      expect(result).not.toBeNull();
      // Average = (28+30+26)/3 = 28
      // StdDev should be nonzero since cycles differ
      expect(result!.confidenceDays).toBeGreaterThan(0);
    });

    it('predicts end date using average period duration', () => {
      // Periods that last 5 days each
      logPeriod(adapter, 'p1', { startDate: '2025-10-01', endDate: '2025-10-06' }); // 5 days
      logPeriod(adapter, 'p2', { startDate: '2025-10-29', endDate: '2025-11-03' }); // 5 days
      logPeriod(adapter, 'p3', { startDate: '2025-11-26', endDate: '2025-12-01' }); // 5 days

      const result = predictNextPeriod(adapter);
      expect(result).not.toBeNull();

      // Predicted end should be start + 5 days
      const startDate = new Date(result!.predictedStart + 'T00:00:00Z');
      const endDate = new Date(result!.predictedEnd + 'T00:00:00Z');
      const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
      expect(durationDays).toBe(5);
    });

    it('handles February boundary crossing', () => {
      // Cycles that span across Feb boundary -- need 3 periods for 2 cycle lengths
      logPeriod(adapter, 'p1', { startDate: '2025-12-08', endDate: '2025-12-13' });
      logPeriod(adapter, 'p2', { startDate: '2026-01-05', endDate: '2026-01-10' }); // 28 days
      logPeriod(adapter, 'p3', { startDate: '2026-02-02', endDate: '2026-02-07' }); // 28 days

      const result = predictNextPeriod(adapter);
      expect(result).not.toBeNull();
      // Predicted start = Feb 02 + 28 = Mar 02
      expect(result!.predictedStart).toBe('2026-03-02');
    });

    it('handles leap year February', () => {
      // 2024 is a leap year (Feb has 29 days)
      logPeriod(adapter, 'p1', { startDate: '2024-01-05', endDate: '2024-01-10' });
      logPeriod(adapter, 'p2', { startDate: '2024-02-02', endDate: '2024-02-07' }); // 28 days
      logPeriod(adapter, 'p3', { startDate: '2024-03-01', endDate: '2024-03-06' }); // 28 days

      const result = predictNextPeriod(adapter);
      expect(result).not.toBeNull();
      // Predicted start = Mar 01 + 28 = Mar 29
      expect(result!.predictedStart).toBe('2024-03-29');
    });

    it('stores prediction in the database', () => {
      logPeriod(adapter, 'p1', { startDate: '2025-10-01', endDate: '2025-10-06' });
      logPeriod(adapter, 'p2', { startDate: '2025-10-29', endDate: '2025-11-03' });
      logPeriod(adapter, 'p3', { startDate: '2025-11-26', endDate: '2025-12-01' });

      const prediction = predictNextPeriod(adapter);
      expect(prediction).not.toBeNull();

      const stored = getLatestPrediction(adapter);
      expect(stored).not.toBeNull();
      expect(stored!.id).toBe(prediction!.id);
      expect(stored!.predictedStart).toBe(prediction!.predictedStart);
    });

    it('uses at most MAX_CYCLES_FOR_AVERAGE (6) recent cycles', () => {
      // Create 8 periods to produce 7 cycle lengths; only most recent 6 should be used
      const baseDates = [
        { start: '2025-04-01', end: '2025-04-06' },
        { start: '2025-04-29', end: '2025-05-04' }, // 28 days
        { start: '2025-05-27', end: '2025-06-01' }, // 28 days
        { start: '2025-06-24', end: '2025-06-29' }, // 28 days
        { start: '2025-07-22', end: '2025-07-27' }, // 28 days
        { start: '2025-08-19', end: '2025-08-24' }, // 28 days
        { start: '2025-09-16', end: '2025-09-21' }, // 28 days
        { start: '2025-10-14', end: '2025-10-19' }, // 28 days
      ];

      baseDates.forEach((d, i) => {
        logPeriod(adapter, `p${i + 1}`, { startDate: d.start, endDate: d.end });
      });

      const result = predictNextPeriod(adapter);
      expect(result).not.toBeNull();
      // Still should predict 28 days from last start
      expect(result!.predictedStart).toBe('2025-11-11');
    });

    it('ignores periods without end dates', () => {
      // This period has no end_date so it should not be counted
      logPeriod(adapter, 'p1', { startDate: '2025-10-01' });
      logPeriod(adapter, 'p2', { startDate: '2025-10-29', endDate: '2025-11-03' });
      logPeriod(adapter, 'p3', { startDate: '2025-11-26', endDate: '2025-12-01' });

      const result = predictNextPeriod(adapter);
      // Only 2 completed periods, which gives 1 cycle length -- needs minimum 2
      // Actually: query filters WHERE end_date IS NOT NULL, so p2 and p3 are returned
      // That gives only 1 cycle length (p3-start minus p2-start), which < MIN_CYCLES_FOR_PREDICTION=2
      expect(result).toBeNull();
    });
  });

  // ── getLatestPrediction ────────────────────────────────────────────────

  describe('getLatestPrediction', () => {
    it('returns null when no predictions exist', () => {
      const result = getLatestPrediction(adapter);
      expect(result).toBeNull();
    });

    it('returns the most recent prediction', async () => {
      logPeriod(adapter, 'p1', { startDate: '2025-10-01', endDate: '2025-10-06' });
      logPeriod(adapter, 'p2', { startDate: '2025-10-29', endDate: '2025-11-03' });
      logPeriod(adapter, 'p3', { startDate: '2025-11-26', endDate: '2025-12-01' });

      predictNextPeriod(adapter);
      // Small delay to ensure different Date.now() for the prediction ID
      await new Promise((r) => setTimeout(r, 5));
      // Add another period and predict again
      logPeriod(adapter, 'p4', { startDate: '2025-12-24', endDate: '2025-12-29' });
      const second = predictNextPeriod(adapter);

      const latest = getLatestPrediction(adapter);
      expect(latest).not.toBeNull();
      expect(latest!.id).toBe(second!.id);
    });
  });

  // ── estimateFertilityWindow ────────────────────────────────────────────

  describe('estimateFertilityWindow', () => {
    it('returns null with no prediction', () => {
      const result = estimateFertilityWindow(adapter);
      expect(result).toBeNull();
    });

    it('returns null with insufficient cycle data', () => {
      // Only 1 period -- no prediction possible
      logPeriod(adapter, 'p1', { startDate: '2025-10-01', endDate: '2025-10-06' });
      const result = estimateFertilityWindow(adapter);
      expect(result).toBeNull();
    });

    it('returns fertility window for regular 28-day cycles', () => {
      logPeriod(adapter, 'p1', { startDate: '2025-10-01', endDate: '2025-10-06' });
      logPeriod(adapter, 'p2', { startDate: '2025-10-29', endDate: '2025-11-03' });
      logPeriod(adapter, 'p3', { startDate: '2025-11-26', endDate: '2025-12-01' });

      // Create a prediction first
      predictNextPeriod(adapter);

      const window = estimateFertilityWindow(adapter);
      expect(window).not.toBeNull();
      expect(window!.start).toBeTruthy();
      expect(window!.end).toBeTruthy();

      // For 28-day cycle: ovulation = 28-14 = day 14
      // Fertile start = day 14-5 = day 9
      // Fertile end = day 14+1 = day 15
      // From last period start (Nov 26):
      const start = new Date(window!.start + 'T00:00:00Z');
      const end = new Date(window!.end + 'T00:00:00Z');
      expect(end.getTime()).toBeGreaterThan(start.getTime());
    });

    it('adjusts window for longer cycles', () => {
      // 35-day cycles
      logPeriod(adapter, 'p1', { startDate: '2025-09-01', endDate: '2025-09-06' });
      logPeriod(adapter, 'p2', { startDate: '2025-10-06', endDate: '2025-10-11' }); // 35 days
      logPeriod(adapter, 'p3', { startDate: '2025-11-10', endDate: '2025-11-15' }); // 35 days

      predictNextPeriod(adapter);

      const window = estimateFertilityWindow(adapter);
      expect(window).not.toBeNull();

      // For 35-day cycle: ovulation = 35-14 = day 21
      // Fertile start = day 21-5 = day 16
      // Fertile end = day 21+1 = day 22
      // From last period start (Nov 10):
      const lastStart = new Date('2025-11-10T00:00:00Z');
      const windowStart = new Date(window!.start + 'T00:00:00Z');
      const dayOffset = Math.round((windowStart.getTime() - lastStart.getTime()) / 86400000);
      expect(dayOffset).toBe(16); // fertileStart = max(1, 21-5) = 16
    });

    it('clamps fertile start to day 1 minimum for short cycles', () => {
      // Very short cycles (21 days)
      logPeriod(adapter, 'p1', { startDate: '2025-10-01', endDate: '2025-10-06' });
      logPeriod(adapter, 'p2', { startDate: '2025-10-22', endDate: '2025-10-27' }); // 21 days
      logPeriod(adapter, 'p3', { startDate: '2025-11-12', endDate: '2025-11-17' }); // 21 days

      predictNextPeriod(adapter);

      const window = estimateFertilityWindow(adapter);
      expect(window).not.toBeNull();

      // For 21-day cycle: ovulation = 21-14 = day 7
      // Fertile start = max(1, 7-5) = 2
      // Fertile end = day 7+1 = day 8
      const lastStart = new Date('2025-11-12T00:00:00Z');
      const windowStart = new Date(window!.start + 'T00:00:00Z');
      const dayOffset = Math.round((windowStart.getTime() - lastStart.getTime()) / 86400000);
      expect(dayOffset).toBe(2);
    });
  });
});
