import type { DatabaseAdapter } from '@mylife/db';
import type { Medication, CreateMedicationInput } from '../models/medication';

// ---------------------------------------------------------------------------
// Row mapper (includes v2 columns: pill_count, pills_per_dose, time_slots, end_date)
// ---------------------------------------------------------------------------

function rowToMedication(row: Record<string, unknown>): Medication {
  return {
    id: row.id as string,
    name: row.name as string,
    dosage: (row.dosage as string) ?? null,
    unit: (row.unit as string) ?? null,
    frequency: row.frequency as Medication['frequency'],
    instructions: (row.instructions as string) ?? null,
    prescriber: (row.prescriber as string) ?? null,
    pharmacy: (row.pharmacy as string) ?? null,
    refillDate: (row.refill_date as string) ?? null,
    pillCount: (row.pill_count as number) ?? null,
    pillsPerDose: (row.pills_per_dose as number) ?? 1,
    timeSlots: row.time_slots ? JSON.parse(row.time_slots as string) : [],
    endDate: (row.end_date as string) ?? null,
    isActive: !!(row.is_active as number),
    sortOrder: row.sort_order as number,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Extended medication CRUD
// ---------------------------------------------------------------------------

/**
 * Create a medication with all v2 fields.
 */
export function createMedicationExtended(
  db: DatabaseAdapter,
  id: string,
  input: CreateMedicationInput,
): void {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO md_medications
      (id, name, dosage, unit, frequency, instructions, prescriber, pharmacy,
       refill_date, pill_count, pills_per_dose, time_slots, end_date,
       sort_order, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.dosage ?? null,
      input.unit ?? null,
      input.frequency ?? 'daily',
      input.instructions ?? null,
      input.prescriber ?? null,
      input.pharmacy ?? null,
      input.refillDate ?? null,
      input.pillCount ?? null,
      input.pillsPerDose ?? 1,
      JSON.stringify(input.timeSlots ?? []),
      input.endDate ?? null,
      input.sortOrder ?? 0,
      input.notes ?? null,
      now,
      now,
    ],
  );
}

/**
 * Get a medication by ID with v2 columns.
 */
export function getMedicationExtended(db: DatabaseAdapter, id: string): Medication | null {
  const rows = db.query<Record<string, unknown>>(
    'SELECT * FROM md_medications WHERE id = ?',
    [id],
  );
  return rows.length > 0 ? rowToMedication(rows[0]) : null;
}

/**
 * Get all active medications with v2 columns.
 */
export function getActiveMedications(db: DatabaseAdapter): Medication[] {
  return db
    .query<Record<string, unknown>>(
      'SELECT * FROM md_medications WHERE is_active = 1 ORDER BY sort_order ASC, name ASC',
    )
    .map(rowToMedication);
}

/**
 * Set absolute pill count for a medication.
 */
export function updatePillCount(
  db: DatabaseAdapter,
  medicationId: string,
  count: number,
): void {
  db.execute(
    `UPDATE md_medications SET pill_count = ?, updated_at = ? WHERE id = ?`,
    [count, new Date().toISOString(), medicationId],
  );
}

/**
 * Decrement pill count by pills_per_dose (called when a dose is taken).
 * Clamps at zero.
 */
export function decrementPillCount(
  db: DatabaseAdapter,
  medicationId: string,
): void {
  db.execute(
    `UPDATE md_medications
     SET pill_count = MAX(0, COALESCE(pill_count, 0) - pills_per_dose),
         updated_at = ?
     WHERE id = ?`,
    [new Date().toISOString(), medicationId],
  );
}
