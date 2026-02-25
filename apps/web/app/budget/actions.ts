'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createEnvelope,
  updateEnvelope,
  deleteEnvelope,
  listEnvelopes,
  createAccount,
  updateAccount,
  deleteAccount,
  listAccounts,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listTransactions,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoals,
  type AccountInsert,
  type AccountUpdate,
  type BudgetGoalInsert,
  type BudgetGoalUpdate,
  type BudgetTransactionFilter,
  type BudgetTransactionInsert,
  type BudgetTransactionUpdate,
  type EnvelopeInsert,
  type EnvelopeUpdate,
} from '@mylife/budget';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('budget');
  return adapter;
}

export async function fetchEnvelopes(includeArchived = false) {
  return listEnvelopes(db(), includeArchived);
}

export async function doCreateEnvelope(id: string, input: EnvelopeInsert) {
  return createEnvelope(db(), id, input);
}

export async function doUpdateEnvelope(id: string, updates: EnvelopeUpdate) {
  return updateEnvelope(db(), id, updates);
}

export async function doArchiveEnvelope(id: string) {
  return updateEnvelope(db(), id, { archived: 1 });
}

export async function doRestoreEnvelope(id: string) {
  return updateEnvelope(db(), id, { archived: 0 });
}

export async function doDeleteEnvelope(id: string) {
  return deleteEnvelope(db(), id);
}

export async function fetchAccounts(includeArchived = false) {
  return listAccounts(db(), includeArchived);
}

export async function doCreateAccount(id: string, input: AccountInsert) {
  return createAccount(db(), id, input);
}

export async function doUpdateAccount(id: string, updates: AccountUpdate) {
  return updateAccount(db(), id, updates);
}

export async function doArchiveAccount(id: string) {
  return updateAccount(db(), id, { archived: 1 });
}

export async function doRestoreAccount(id: string) {
  return updateAccount(db(), id, { archived: 0 });
}

export async function doDeleteAccount(id: string) {
  return deleteAccount(db(), id);
}

export async function fetchTransactions(filters?: BudgetTransactionFilter) {
  return listTransactions(db(), filters);
}

export async function doCreateTransaction(
  id: string,
  input: BudgetTransactionInsert,
) {
  return createTransaction(db(), id, input);
}

export async function doUpdateTransaction(
  id: string,
  updates: BudgetTransactionUpdate,
) {
  return updateTransaction(db(), id, updates);
}

export async function doDeleteTransaction(id: string) {
  return deleteTransaction(db(), id);
}

export async function fetchGoals(envelopeId?: string) {
  return getGoals(db(), envelopeId);
}

export async function doCreateGoal(id: string, input: BudgetGoalInsert) {
  return createGoal(db(), id, input);
}

export async function doUpdateGoal(id: string, updates: BudgetGoalUpdate) {
  return updateGoal(db(), id, updates);
}

export async function doDeleteGoal(id: string) {
  return deleteGoal(db(), id);
}
