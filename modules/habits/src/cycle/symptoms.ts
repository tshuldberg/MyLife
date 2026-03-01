import type { DatabaseAdapter } from '@mylife/db';
import type { CycleSymptom } from '../types';

// ---------------------------------------------------------------------------
// Predefined symptom types
// ---------------------------------------------------------------------------

export const PREDEFINED_SYMPTOMS = [
  'cramps',
  'headache',
  'bloating',
  'fatigue',
  'mood_swings',
  'back_pain',
  'nausea',
  'breast_tenderness',
  'acne',
  'insomnia',
  'appetite_change',
  'anxiety',
  'irritability',
  'cravings',
  'dizziness',
] as const;

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

function rowToSymptom(row: Record<string, unknown>): CycleSymptom {
  return {
    id: row.id as string,
    periodId: row.period_id as string,
    date: row.date as string,
    symptomType: row.symptom_type as string,
    severity: row.severity as number,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function logSymptom(
  db: DatabaseAdapter,
  id: string,
  input: { periodId: string; date: string; symptomType: string; severity: number; notes?: string },
): void {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO cy_symptoms (id, period_id, date, symptom_type, severity, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.periodId, input.date, input.symptomType, input.severity, input.notes ?? null, now],
  );
}

export function getSymptoms(
  db: DatabaseAdapter,
  periodId: string,
): CycleSymptom[] {
  return db.query<Record<string, unknown>>(
    'SELECT * FROM cy_symptoms WHERE period_id = ? ORDER BY date ASC',
    [periodId],
  ).map(rowToSymptom);
}

export function updateSymptom(
  db: DatabaseAdapter,
  id: string,
  updates: Partial<{ symptomType: string; severity: number; notes: string }>,
): void {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (updates.symptomType !== undefined) { sets.push('symptom_type = ?'); params.push(updates.symptomType); }
  if (updates.severity !== undefined) { sets.push('severity = ?'); params.push(updates.severity); }
  if (updates.notes !== undefined) { sets.push('notes = ?'); params.push(updates.notes); }
  if (sets.length === 0) return;
  params.push(id);
  db.execute(`UPDATE cy_symptoms SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function deleteSymptom(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM cy_symptoms WHERE id = ?', [id]);
}
