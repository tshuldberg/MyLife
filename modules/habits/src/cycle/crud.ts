import type { DatabaseAdapter } from '@mylife/db';
import type { CyclePeriod } from '../types';

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

function rowToPeriod(row: Record<string, unknown>): CyclePeriod {
  return {
    id: row.id as string,
    startDate: row.start_date as string,
    endDate: (row.end_date as string) ?? null,
    cycleLength: (row.cycle_length as number) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function logPeriod(
  db: DatabaseAdapter,
  id: string,
  input: { startDate: string; endDate?: string; cycleLength?: number; notes?: string },
): void {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO cy_periods (id, start_date, end_date, cycle_length, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.startDate, input.endDate ?? null, input.cycleLength ?? null, input.notes ?? null, now, now],
  );
}

export function updatePeriod(
  db: DatabaseAdapter,
  id: string,
  updates: Partial<{ startDate: string; endDate: string; cycleLength: number; notes: string }>,
): void {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (updates.startDate !== undefined) { sets.push('start_date = ?'); params.push(updates.startDate); }
  if (updates.endDate !== undefined) { sets.push('end_date = ?'); params.push(updates.endDate); }
  if (updates.cycleLength !== undefined) { sets.push('cycle_length = ?'); params.push(updates.cycleLength); }
  if (updates.notes !== undefined) { sets.push('notes = ?'); params.push(updates.notes); }
  if (sets.length === 0) return;
  sets.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);
  db.execute(`UPDATE cy_periods SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function deletePeriod(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM cy_periods WHERE id = ?', [id]);
}

export function getPeriods(db: DatabaseAdapter): CyclePeriod[] {
  return db.query<Record<string, unknown>>(
    'SELECT * FROM cy_periods ORDER BY start_date DESC',
  ).map(rowToPeriod);
}

export function getPeriodsInRange(
  db: DatabaseAdapter,
  from: string,
  to: string,
): CyclePeriod[] {
  return db.query<Record<string, unknown>>(
    'SELECT * FROM cy_periods WHERE start_date >= ? AND start_date <= ? ORDER BY start_date ASC',
    [from, to],
  ).map(rowToPeriod);
}
