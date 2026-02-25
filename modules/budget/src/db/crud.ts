/**
 * Budget CRUD operations.
 *
 * All currency amounts are integer cents.
 * Booleans are stored as INTEGER (0/1) in SQLite.
 */

import type { DatabaseAdapter } from '@mylife/db';
import type {
  Account,
  AccountInsert,
  AccountUpdate,
  BudgetGoal,
  BudgetGoalInsert,
  BudgetGoalUpdate,
  BudgetTransaction,
  BudgetTransactionFilter,
  BudgetTransactionInsert,
  BudgetTransactionUpdate,
  Envelope,
  EnvelopeInsert,
  EnvelopeUpdate,
} from '../types';

// ---------------------------------------------------------------------------
// Envelopes
// ---------------------------------------------------------------------------

export function createEnvelope(
  db: DatabaseAdapter,
  id: string,
  input: EnvelopeInsert,
): Envelope {
  const now = new Date().toISOString();
  const envelope: Envelope = {
    id,
    name: input.name,
    icon: input.icon ?? null,
    color: input.color ?? null,
    monthly_budget: input.monthly_budget ?? 0,
    rollover_enabled: input.rollover_enabled ?? 1,
    archived: input.archived ?? 0,
    sort_order: input.sort_order ?? 0,
    created_at: now,
    updated_at: now,
  };

  db.execute(
    `INSERT INTO bg_envelopes
      (id, name, icon, color, monthly_budget, rollover_enabled, archived, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      envelope.id,
      envelope.name,
      envelope.icon,
      envelope.color,
      envelope.monthly_budget,
      envelope.rollover_enabled,
      envelope.archived,
      envelope.sort_order,
      envelope.created_at,
      envelope.updated_at,
    ],
  );

  return envelope;
}

export function getEnvelopeById(db: DatabaseAdapter, id: string): Envelope | null {
  const rows = db.query<Envelope>(
    `SELECT * FROM bg_envelopes WHERE id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

/** @deprecated Use getEnvelopeById */
export const getEnvelope = getEnvelopeById;

export function getEnvelopes(
  db: DatabaseAdapter,
  includeArchived = false,
): Envelope[] {
  const rows = includeArchived
    ? db.query<Envelope>(
        `SELECT * FROM bg_envelopes ORDER BY archived ASC, sort_order ASC, name ASC`,
      )
    : db.query<Envelope>(
        `SELECT * FROM bg_envelopes WHERE archived = 0 ORDER BY sort_order ASC, name ASC`,
      );
  return rows;
}

/** @deprecated Use getEnvelopes */
export const listEnvelopes = getEnvelopes;

export function updateEnvelope(
  db: DatabaseAdapter,
  id: string,
  updates: EnvelopeUpdate,
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  db.execute(`UPDATE bg_envelopes SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deleteEnvelope(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM bg_envelopes WHERE id = ?`, [id]);
}

export function countEnvelopes(db: DatabaseAdapter): number {
  const rows = db.query<{ count: number }>(
    'SELECT COUNT(*) as count FROM bg_envelopes',
  );
  return rows[0]?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export function createAccount(
  db: DatabaseAdapter,
  id: string,
  input: AccountInsert,
): Account {
  const now = new Date().toISOString();
  const account: Account = {
    id,
    name: input.name,
    type: input.type ?? 'checking',
    current_balance: input.current_balance ?? 0,
    currency: input.currency ?? 'USD',
    archived: input.archived ?? 0,
    sort_order: input.sort_order ?? 0,
    created_at: now,
    updated_at: now,
  };

  db.execute(
    `INSERT INTO bg_accounts
      (id, name, type, current_balance, currency, archived, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      account.id,
      account.name,
      account.type,
      account.current_balance,
      account.currency,
      account.archived,
      account.sort_order,
      account.created_at,
      account.updated_at,
    ],
  );

  return account;
}

export function getAccountById(db: DatabaseAdapter, id: string): Account | null {
  const rows = db.query<Account>(
    `SELECT * FROM bg_accounts WHERE id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

/** @deprecated Use getAccountById */
export const getAccount = getAccountById;

export function getAccounts(
  db: DatabaseAdapter,
  includeArchived = false,
): Account[] {
  return includeArchived
    ? db.query<Account>(
        `SELECT * FROM bg_accounts ORDER BY archived ASC, sort_order ASC, name ASC`,
      )
    : db.query<Account>(
        `SELECT * FROM bg_accounts WHERE archived = 0 ORDER BY sort_order ASC, name ASC`,
      );
}

/** @deprecated Use getAccounts */
export const listAccounts = getAccounts;

export function updateAccount(
  db: DatabaseAdapter,
  id: string,
  updates: AccountUpdate,
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  db.execute(`UPDATE bg_accounts SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deleteAccount(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM bg_accounts WHERE id = ?`, [id]);
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export function createTransaction(
  db: DatabaseAdapter,
  id: string,
  input: BudgetTransactionInsert,
): BudgetTransaction {
  const now = new Date().toISOString();
  const tx: BudgetTransaction = {
    id,
    envelope_id: input.envelope_id ?? null,
    account_id: input.account_id ?? null,
    amount: input.amount,
    direction: input.direction,
    merchant: input.merchant ?? null,
    note: input.note ?? null,
    occurred_on: input.occurred_on,
    created_at: now,
    updated_at: now,
  };

  db.execute(
    `INSERT INTO bg_transactions
      (id, envelope_id, account_id, amount, direction, merchant, note, occurred_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.id,
      tx.envelope_id,
      tx.account_id,
      tx.amount,
      tx.direction,
      tx.merchant,
      tx.note,
      tx.occurred_on,
      tx.created_at,
      tx.updated_at,
    ],
  );

  return tx;
}

export function getTransactionById(
  db: DatabaseAdapter,
  id: string,
): BudgetTransaction | null {
  const rows = db.query<BudgetTransaction>(
    `SELECT * FROM bg_transactions WHERE id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

/** @deprecated Use getTransactionById */
export const getTransaction = getTransactionById;

export function getTransactions(
  db: DatabaseAdapter,
  filters: BudgetTransactionFilter = {},
): BudgetTransaction[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.envelope_id) {
    where.push('envelope_id = ?');
    params.push(filters.envelope_id);
  }
  if (filters.account_id) {
    where.push('account_id = ?');
    params.push(filters.account_id);
  }
  if (filters.direction) {
    where.push('direction = ?');
    params.push(filters.direction);
  }
  if (filters.from_date) {
    where.push('occurred_on >= ?');
    params.push(filters.from_date);
  }
  if (filters.to_date) {
    where.push('occurred_on <= ?');
    params.push(filters.to_date);
  }

  let sql = 'SELECT * FROM bg_transactions';
  if (where.length > 0) {
    sql += ` WHERE ${where.join(' AND ')}`;
  }
  sql += ' ORDER BY occurred_on DESC, created_at DESC';

  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
    if (filters.offset) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }
  }

  return db.query<BudgetTransaction>(sql, params);
}

/** @deprecated Use getTransactions */
export const listTransactions = getTransactions;

export function updateTransaction(
  db: DatabaseAdapter,
  id: string,
  updates: BudgetTransactionUpdate,
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  db.execute(
    `UPDATE bg_transactions SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
}

export function deleteTransaction(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM bg_transactions WHERE id = ?`, [id]);
}

export function countTransactions(db: DatabaseAdapter): number {
  const rows = db.query<{ count: number }>(
    'SELECT COUNT(*) as count FROM bg_transactions',
  );
  return rows[0]?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export function createGoal(
  db: DatabaseAdapter,
  id: string,
  input: BudgetGoalInsert,
): BudgetGoal {
  const now = new Date().toISOString();
  const goal: BudgetGoal = {
    id,
    envelope_id: input.envelope_id,
    name: input.name,
    target_amount: input.target_amount,
    target_date: input.target_date ?? null,
    completed_amount: input.completed_amount ?? 0,
    is_completed: input.is_completed ?? 0,
    created_at: now,
    updated_at: now,
  };

  db.execute(
    `INSERT INTO bg_goals
      (id, envelope_id, name, target_amount, target_date, completed_amount, is_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      goal.id,
      goal.envelope_id,
      goal.name,
      goal.target_amount,
      goal.target_date,
      goal.completed_amount,
      goal.is_completed,
      goal.created_at,
      goal.updated_at,
    ],
  );

  return goal;
}

export function getGoalById(db: DatabaseAdapter, id: string): BudgetGoal | null {
  const rows = db.query<BudgetGoal>(
    `SELECT * FROM bg_goals WHERE id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

export function getGoals(
  db: DatabaseAdapter,
  envelopeId?: string,
): BudgetGoal[] {
  if (envelopeId) {
    return db.query<BudgetGoal>(
      `SELECT * FROM bg_goals WHERE envelope_id = ? ORDER BY created_at DESC`,
      [envelopeId],
    );
  }
  return db.query<BudgetGoal>(
    `SELECT * FROM bg_goals ORDER BY created_at DESC`,
  );
}

export function updateGoal(
  db: DatabaseAdapter,
  id: string,
  updates: BudgetGoalUpdate,
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  db.execute(`UPDATE bg_goals SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deleteGoal(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM bg_goals WHERE id = ?`, [id]);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSetting(db: DatabaseAdapter, key: string): string | null {
  const rows = db.query<{ value: string }>(
    `SELECT value FROM bg_settings WHERE key = ?`,
    [key],
  );
  return rows[0]?.value ?? null;
}

export function setSetting(db: DatabaseAdapter, key: string, value: string): void {
  db.execute(
    `INSERT OR REPLACE INTO bg_settings (key, value) VALUES (?, ?)`,
    [key, value],
  );
}
