import type { DatabaseAdapter } from '@mylife/db';
import type { CyclePrediction } from '../types';

const ALGORITHM_VERSION = 'moving_avg_v1';
const MIN_CYCLES_FOR_PREDICTION = 2;
const MAX_CYCLES_FOR_AVERAGE = 6;

/**
 * Predict the next period start/end using a moving average of recent cycle lengths.
 * Confidence interval is based on standard deviation of cycle lengths.
 *
 * Returns null if insufficient data (fewer than MIN_CYCLES_FOR_PREDICTION completed cycles).
 */
export function predictNextPeriod(
  db: DatabaseAdapter,
): CyclePrediction | null {
  // Get completed periods (those with both start and end dates) ordered by most recent
  const periods = db.query<{
    id: string;
    start_date: string;
    end_date: string | null;
    cycle_length: number | null;
  }>(
    `SELECT id, start_date, end_date, cycle_length FROM cy_periods
     WHERE end_date IS NOT NULL
     ORDER BY start_date DESC
     LIMIT ?`,
    [MAX_CYCLES_FOR_AVERAGE + 1],
  );

  if (periods.length < MIN_CYCLES_FOR_PREDICTION) return null;

  // Compute cycle lengths from consecutive periods
  const cycleLengths: number[] = [];
  for (let i = 0; i < periods.length - 1; i++) {
    // Cycle length = days from this period's start to next period's start
    const current = new Date(periods[i].start_date + 'T00:00:00Z');
    const next = new Date(periods[i + 1].start_date + 'T00:00:00Z');
    const days = Math.round((current.getTime() - next.getTime()) / 86400000);
    if (days > 0) cycleLengths.push(days);
  }

  // Also use explicitly stored cycle_length if available and no computed gap
  if (cycleLengths.length === 0) {
    for (const p of periods) {
      if (p.cycle_length && p.cycle_length > 0) cycleLengths.push(p.cycle_length);
    }
  }

  if (cycleLengths.length < MIN_CYCLES_FOR_PREDICTION) return null;

  // Take at most MAX_CYCLES_FOR_AVERAGE
  const recent = cycleLengths.slice(0, MAX_CYCLES_FOR_AVERAGE);

  // Moving average
  const avgCycleLength = recent.reduce((a, b) => a + b, 0) / recent.length;

  // Standard deviation for confidence
  const variance = recent.reduce((sum, v) => sum + (v - avgCycleLength) ** 2, 0) / recent.length;
  const stdDev = Math.sqrt(variance);

  // Average period duration
  const periodDurations: number[] = [];
  for (const p of periods) {
    if (p.end_date) {
      const start = new Date(p.start_date + 'T00:00:00Z');
      const end = new Date(p.end_date + 'T00:00:00Z');
      const days = Math.round((end.getTime() - start.getTime()) / 86400000);
      if (days > 0) periodDurations.push(days);
    }
  }
  const avgPeriodDuration = periodDurations.length > 0
    ? periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length
    : 5; // default 5 days

  // Predict from most recent period start
  const lastStart = new Date(periods[0].start_date + 'T00:00:00Z');
  const predictedStartMs = lastStart.getTime() + avgCycleLength * 86400000;
  const predictedStart = new Date(predictedStartMs).toISOString().slice(0, 10);
  const predictedEndMs = predictedStartMs + Math.round(avgPeriodDuration) * 86400000;
  const predictedEnd = new Date(predictedEndMs).toISOString().slice(0, 10);

  const id = `pred_${Date.now()}`;
  const now = new Date().toISOString();

  // Store the prediction
  db.execute(
    `INSERT INTO cy_predictions (id, predicted_start, predicted_end, confidence_days, algorithm_version, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, predictedStart, predictedEnd, Math.round(stdDev * 100) / 100, ALGORITHM_VERSION, now],
  );

  return {
    id,
    predictedStart,
    predictedEnd,
    confidenceDays: Math.round(stdDev * 100) / 100,
    algorithmVersion: ALGORITHM_VERSION,
    createdAt: now,
  };
}

/**
 * Get the most recent prediction.
 */
export function getLatestPrediction(db: DatabaseAdapter): CyclePrediction | null {
  const rows = db.query<Record<string, unknown>>(
    'SELECT * FROM cy_predictions ORDER BY created_at DESC LIMIT 1',
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id as string,
    predictedStart: row.predicted_start as string,
    predictedEnd: row.predicted_end as string,
    confidenceDays: row.confidence_days as number,
    algorithmVersion: row.algorithm_version as string,
    createdAt: row.created_at as string,
  };
}

/**
 * Estimate the fertility window based on predicted cycle.
 * Returns approximate ovulation window (cycle day 10-16 of predicted cycle).
 */
export function estimateFertilityWindow(
  db: DatabaseAdapter,
): { start: string; end: string } | null {
  const prediction = getLatestPrediction(db);
  if (!prediction) return null;

  // Get average cycle length
  const periods = db.query<{ start_date: string }>(
    'SELECT start_date FROM cy_periods WHERE end_date IS NOT NULL ORDER BY start_date DESC LIMIT 6',
  );
  if (periods.length < 2) return null;

  const cycleLengths: number[] = [];
  for (let i = 0; i < periods.length - 1; i++) {
    const curr = new Date(periods[i].start_date + 'T00:00:00Z');
    const next = new Date(periods[i + 1].start_date + 'T00:00:00Z');
    const days = Math.round((curr.getTime() - next.getTime()) / 86400000);
    if (days > 0) cycleLengths.push(days);
  }
  if (cycleLengths.length === 0) return null;

  const avgCycle = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;

  // Ovulation is typically 14 days before end of cycle
  // Fertility window: ~5 days before ovulation to 1 day after
  const ovulationDay = Math.round(avgCycle - 14);
  const fertileStart = Math.max(1, ovulationDay - 5);
  const fertileEnd = ovulationDay + 1;

  const lastStart = new Date(periods[0].start_date + 'T00:00:00Z');
  const windowStart = new Date(lastStart.getTime() + fertileStart * 86400000);
  const windowEnd = new Date(lastStart.getTime() + fertileEnd * 86400000);

  return {
    start: windowStart.toISOString().slice(0, 10),
    end: windowEnd.toISOString().slice(0, 10),
  };
}
