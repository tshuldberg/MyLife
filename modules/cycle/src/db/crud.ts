import type { DatabaseAdapter } from '@mylife/db';
import type {
  Cycle,
  CycleDay,
  Symptom,
  CreateCycleInput,
  CreateCycleDayInput,
  UpdateCycleDayInput,
  CycleStats,
} from '../types';
import { CreateCycleDayInputSchema } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function rowToCycle(row: Record<string, unknown>): Cycle {
  return {
    id: row.id as string,
    startDate: row.start_date as string,
    endDate: (row.end_date as string) ?? null,
    periodEndDate: (row.period_end_date as string) ?? null,
    lengthDays: (row.cycle_length as number) ?? null,
    periodLength: (row.period_length as number) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToCycleDay(row: Record<string, unknown>): CycleDay {
  return {
    id: row.id as string,
    date: row.date as string,
    cycleId: (row.cycle_id as string) ?? null,
    phase: (row.phase as CycleDay['phase']) ?? null,
    flowLevel: (row.flow_level as CycleDay['flowLevel']) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToSymptom(row: Record<string, unknown>): Symptom {
  return {
    id: row.id as string,
    cycleDayId: row.cycle_day_id as string,
    category: row.category as Symptom['category'],
    symptom: row.symptom as string,
    intensity: row.intensity as Symptom['intensity'],
    createdAt: row.created_at as string,
  };
}

// ── Cycles ─────────────────────────────────────────────────────────────

export function createCycle(
  db: DatabaseAdapter,
  input: CreateCycleInput,
): Cycle {
  const id = crypto.randomUUID();
  const now = nowIso();

  let periodLength: number | null = null;
  if (input.periodEndDate) {
    const start = new Date(input.startDate + 'T00:00:00Z');
    const end = new Date(input.periodEndDate + 'T00:00:00Z');
    periodLength = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  db.execute(
    `INSERT INTO cy_cycles (id, start_date, period_end_date, period_length, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.startDate, input.periodEndDate ?? null, periodLength, now],
  );

  return {
    id,
    startDate: input.startDate,
    endDate: null,
    periodEndDate: input.periodEndDate ?? null,
    lengthDays: null,
    periodLength,
    createdAt: now,
  };
}

export function getCycle(db: DatabaseAdapter, id: string): Cycle | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM cy_cycles WHERE id = ?`,
    [id],
  );
  return rows.length > 0 ? rowToCycle(rows[0]) : null;
}

export function getCycles(
  db: DatabaseAdapter,
  limit = 50,
  offset = 0,
): Cycle[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM cy_cycles ORDER BY start_date DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows.map(rowToCycle);
}

export function endCycle(
  db: DatabaseAdapter,
  cycleId: string,
  nextStartDate: string,
): Cycle | null {
  const cycle = getCycle(db, cycleId);
  if (!cycle) return null;

  const start = new Date(cycle.startDate + 'T00:00:00Z');
  const end = new Date(nextStartDate + 'T00:00:00Z');
  const lengthDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // The end date is the day before the next cycle starts
  const endDate = new Date(end);
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  const endDateStr = endDate.toISOString().slice(0, 10);

  db.execute(
    `UPDATE cy_cycles SET end_date = ?, cycle_length = ? WHERE id = ?`,
    [endDateStr, lengthDays, cycleId],
  );

  return {
    ...cycle,
    endDate: endDateStr,
    lengthDays,
  };
}

export function deleteCycle(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM cy_cycles WHERE id = ?`, [id]);
  return true;
}

// ── Cycle Days ─────────────────────────────────────────────────────────

export function createCycleDay(
  db: DatabaseAdapter,
  rawInput: CreateCycleDayInput,
): CycleDay {
  const input = CreateCycleDayInputSchema.parse(rawInput);
  const id = crypto.randomUUID();
  const now = nowIso();

  db.transaction(() => {
    db.execute(
      `INSERT INTO cy_cycle_days (id, date, cycle_id, phase, flow_level, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.date,
        input.cycleId ?? null,
        input.phase ?? null,
        input.flowLevel ?? null,
        input.notes ?? null,
        now,
      ],
    );

    for (const symptomInput of input.symptoms) {
      const symptomId = crypto.randomUUID();
      db.execute(
        `INSERT INTO cy_symptoms (id, cycle_day_id, category, symptom, intensity, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [symptomId, id, symptomInput.category, symptomInput.symptom, symptomInput.intensity, now],
      );
    }
  });

  return {
    id,
    date: input.date,
    cycleId: input.cycleId ?? null,
    phase: input.phase ?? null,
    flowLevel: input.flowLevel ?? null,
    notes: input.notes ?? null,
    createdAt: now,
  };
}

export function getCycleDaysByDate(
  db: DatabaseAdapter,
  date: string,
): CycleDay[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM cy_cycle_days WHERE date = ? ORDER BY created_at DESC`,
    [date],
  );
  return rows.map(rowToCycleDay);
}

export function getCycleDaysByCycle(
  db: DatabaseAdapter,
  cycleId: string,
): CycleDay[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM cy_cycle_days WHERE cycle_id = ? ORDER BY date ASC`,
    [cycleId],
  );
  return rows.map(rowToCycleDay);
}

export function getCycleDayByDate(
  db: DatabaseAdapter,
  date: string,
): CycleDay | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM cy_cycle_days WHERE date = ?`,
    [date],
  );
  return rows.length > 0 ? rowToCycleDay(rows[0]) : null;
}

export function updateCycleDay(
  db: DatabaseAdapter,
  id: string,
  input: UpdateCycleDayInput,
): CycleDay | null {
  const existing = db.query<Record<string, unknown>>(
    `SELECT * FROM cy_cycle_days WHERE id = ?`,
    [id],
  );
  if (existing.length === 0) return null;

  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.phase !== undefined) {
    updates.push('phase = ?');
    params.push(input.phase);
  }
  if (input.flowLevel !== undefined) {
    updates.push('flow_level = ?');
    params.push(input.flowLevel);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    params.push(input.notes);
  }

  if (updates.length === 0) return rowToCycleDay(existing[0]);

  params.push(id);
  db.execute(`UPDATE cy_cycle_days SET ${updates.join(', ')} WHERE id = ?`, params);

  const updated = db.query<Record<string, unknown>>(
    `SELECT * FROM cy_cycle_days WHERE id = ?`,
    [id],
  );
  return updated.length > 0 ? rowToCycleDay(updated[0]) : null;
}

export function deleteCycleDay(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM cy_cycle_days WHERE id = ?`, [id]);
  return true;
}

// ── Symptoms ───────────────────────────────────────────────────────────

export function getSymptomsForDay(
  db: DatabaseAdapter,
  cycleDayId: string,
): Symptom[] {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM cy_symptoms WHERE cycle_day_id = ?`,
    [cycleDayId],
  );
  return rows.map(rowToSymptom);
}

export function addSymptom(
  db: DatabaseAdapter,
  cycleDayId: string,
  category: string,
  symptom: string,
  intensity = 'moderate',
): Symptom {
  const id = crypto.randomUUID();
  const now = nowIso();
  db.execute(
    `INSERT INTO cy_symptoms (id, cycle_day_id, category, symptom, intensity, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, cycleDayId, category, symptom, intensity, now],
  );
  return {
    id,
    cycleDayId,
    category: category as Symptom['category'],
    symptom,
    intensity: intensity as Symptom['intensity'],
    createdAt: now,
  };
}

export function deleteSymptom(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM cy_symptoms WHERE id = ?`, [id]);
  return true;
}

// ── Analytics ──────────────────────────────────────────────────────────

export function getCycleStats(db: DatabaseAdapter): CycleStats {
  const completedCycles = db.query<Record<string, unknown>>(
    `SELECT cycle_length, period_length FROM cy_cycles
     WHERE cycle_length IS NOT NULL
     ORDER BY start_date DESC
     LIMIT 12`,
  );

  const totalCycles = db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM cy_cycles`,
  )[0].count;

  if (completedCycles.length === 0) {
    return {
      totalCycles,
      averageCycleLength: null,
      averagePeriodLength: null,
      shortestCycle: null,
      longestCycle: null,
      cycleLengthStdDev: null,
    };
  }

  const lengths = completedCycles.map((r) => r.cycle_length as number);
  const periodLengths = completedCycles
    .filter((r) => r.period_length != null)
    .map((r) => r.period_length as number);

  const sum = lengths.reduce((a, b) => a + b, 0);
  const avg = sum / lengths.length;

  const periodAvg =
    periodLengths.length > 0
      ? periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
      : null;

  const shortest = Math.min(...lengths);
  const longest = Math.max(...lengths);

  // Standard deviation
  const variance = lengths.reduce((s, l) => s + (l - avg) ** 2, 0) / lengths.length;
  const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

  return {
    totalCycles,
    averageCycleLength: Math.round(avg * 10) / 10,
    averagePeriodLength: periodAvg !== null ? Math.round(periodAvg * 10) / 10 : null,
    shortestCycle: shortest,
    longestCycle: longest,
    cycleLengthStdDev: stdDev,
  };
}

export function getSymptomFrequencies(
  db: DatabaseAdapter,
  limit = 20,
): { symptom: string; category: string; count: number }[] {
  return db.query<{ symptom: string; category: string; count: number }>(
    `SELECT symptom, category, COUNT(*) as count
     FROM cy_symptoms
     GROUP BY symptom, category
     ORDER BY count DESC
     LIMIT ?`,
    [limit],
  );
}

export function getCycleCount(db: DatabaseAdapter): number {
  const rows = db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM cy_cycles`,
  );
  return rows[0].count;
}
