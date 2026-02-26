// @mylife/budget — MyBudget module

// Module definition
export { BUDGET_MODULE } from './definition';

// Types & schemas
export {
  AccountType,
  TransactionDirection,
  EnvelopeSchema,
  EnvelopeInsertSchema,
  EnvelopeUpdateSchema,
  AccountSchema,
  AccountInsertSchema,
  AccountUpdateSchema,
  BudgetTransactionSchema,
  BudgetTransactionInsertSchema,
  BudgetTransactionUpdateSchema,
  BudgetTransactionFilterSchema,
  BudgetGoalSchema,
  BudgetGoalInsertSchema,
  BudgetGoalUpdateSchema,
  BudgetSettingSchema,
} from './types';

// Bank sync contract
export * from './bank-sync';
export type {
  Envelope,
  EnvelopeInsert,
  EnvelopeUpdate,
  Account,
  AccountInsert,
  AccountUpdate,
  BudgetTransaction,
  BudgetTransactionInsert,
  BudgetTransactionUpdate,
  BudgetTransactionFilter,
  BudgetGoal,
  BudgetGoalInsert,
  BudgetGoalUpdate,
  BudgetSetting,
} from './types';

// Database operations
export {
  ALL_TABLES,
  CREATE_ENVELOPES,
  CREATE_ACCOUNTS,
  CREATE_TRANSACTIONS,
  CREATE_GOALS,
  CREATE_SETTINGS,
  CREATE_BANK_CONNECTIONS,
  CREATE_BANK_ACCOUNTS,
  CREATE_BANK_TRANSACTIONS_RAW,
  CREATE_BANK_SYNC_STATE,
  CREATE_BANK_WEBHOOK_EVENTS,
  CORE_TABLES,
  BANK_SYNC_TABLES,
  CORE_INDEXES,
  BANK_SYNC_INDEXES,
  CREATE_INDEXES,
  SEED_SETTINGS,
  SEED_DEFAULT_ACCOUNTS,
  SEED_DEFAULT_ENVELOPES,
  createEnvelope,
  getEnvelope,
  listEnvelopes,
  updateEnvelope,
  deleteEnvelope,
  createAccount,
  getAccount,
  listAccounts,
  updateAccount,
  deleteAccount,
  createTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  createGoal,
  getGoalById,
  getGoals,
  updateGoal,
  deleteGoal,
  getSetting,
  setSetting,
} from './db';
