/**
 * Budget allocation operations.
 *
 * Unlike most engine modules, this one interacts with the database to persist
 * allocation records. Uses the hub's DatabaseAdapter interface and bg_ table
 * prefix convention.
 *
 * All amounts in integer cents.
 */

import type { DatabaseAdapter } from '@mylife/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AllocationRow {
  id: string;
  envelope_id: string;
  month: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Allocate (or update) an amount to an envelope for a given month.
 * Uses INSERT OR REPLACE to upsert.
 */
export async function allocateToEnvelope(
  db: DatabaseAdapter,
  envelopeId: string,
  month: string,
  amount: number,
): Promise<void> {
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO bg_budget_allocations (id, envelope_id, month, amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(envelope_id, month) DO UPDATE SET amount = excluded.amount, updated_at = excluded.updated_at`,
    [`${envelopeId}:${month}`, envelopeId, month, amount, now, now],
  );
}

/**
 * Move an allocation amount from one envelope to another within the same month.
 */
export async function moveAllocation(
  db: DatabaseAdapter,
  fromEnvelopeId: string,
  toEnvelopeId: string,
  month: string,
  amount: number,
): Promise<void> {
  await db.transaction(async () => {
    // Get current allocations
    const fromRows = await db.query<AllocationRow>(
      `SELECT * FROM bg_budget_allocations WHERE envelope_id = ? AND month = ?`,
      [fromEnvelopeId, month],
    );
    const toRows = await db.query<AllocationRow>(
      `SELECT * FROM bg_budget_allocations WHERE envelope_id = ? AND month = ?`,
      [toEnvelopeId, month],
    );

    const fromAmount = fromRows[0]?.amount ?? 0;
    const toAmount = toRows[0]?.amount ?? 0;

    await allocateToEnvelope(db, fromEnvelopeId, month, fromAmount - amount);
    await allocateToEnvelope(db, toEnvelopeId, month, toAmount + amount);
  });
}

/**
 * Get all allocations for a given month.
 */
export async function getAllocationsForMonth(
  db: DatabaseAdapter,
  month: string,
): Promise<{ envelopeId: string; amount: number }[]> {
  const rows = await db.query<AllocationRow>(
    `SELECT * FROM bg_budget_allocations WHERE month = ?`,
    [month],
  );

  return rows.map((r) => ({
    envelopeId: r.envelope_id,
    amount: r.amount,
  }));
}

/**
 * Build a lookup map of envelope_id -> allocated amount for a month.
 */
export async function getAllocationMap(
  db: DatabaseAdapter,
  month: string,
): Promise<Map<string, number>> {
  const allocations = await getAllocationsForMonth(db, month);
  const map = new Map<string, number>();
  for (const a of allocations) {
    map.set(a.envelopeId, a.amount);
  }
  return map;
}
