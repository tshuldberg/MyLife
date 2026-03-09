export {
  // V1-V3
  ALL_TABLES,
  CREATE_ENVELOPES,
  CREATE_ACCOUNTS,
  CREATE_TRANSACTIONS,
  CREATE_GOALS,
  CREATE_SETTINGS,
  CREATE_SUBSCRIPTIONS,
  CREATE_BANK_CONNECTIONS,
  CREATE_BANK_ACCOUNTS,
  CREATE_BANK_TRANSACTIONS_RAW,
  CREATE_BANK_SYNC_STATE,
  CREATE_BANK_WEBHOOK_EVENTS,
  CORE_TABLES,
  BANK_SYNC_TABLES,
  SUBSCRIPTION_TABLES,
  SUBSCRIPTION_INDEXES,
  CORE_INDEXES,
  BANK_SYNC_INDEXES,
  CREATE_INDEXES,
  SEED_SETTINGS,
  SEED_DEFAULT_ACCOUNTS,
  SEED_DEFAULT_ENVELOPES,
  // V4
  V4_ALL_TABLES,
  V4_INDEXES,
  V4_ALTER_STATEMENTS,
  V4_BUDGET_ENGINE_TABLES,
  V4_RULES_GOALS_TABLES,
  V4_REPORTING_TABLES,
  CREATE_CATEGORY_GROUPS,
  CREATE_BUDGET_ALLOCATIONS,
  CREATE_TRANSACTION_SPLITS,
  CREATE_RECURRING_TEMPLATES,
  CREATE_PAYEE_CACHE,
  CREATE_CSV_PROFILES,
  CREATE_PRICE_HISTORY,
  CREATE_NOTIFICATION_LOG,
  CREATE_TRANSACTION_RULES,
  CREATE_NET_WORTH_SNAPSHOTS,
  CREATE_DEBT_PAYOFF_PLANS,
  CREATE_DEBT_PAYOFF_DEBTS,
  CREATE_BUDGET_ROLLOVERS,
  CREATE_BUDGET_ALERTS,
  CREATE_ALERT_HISTORY,
  CREATE_CURRENCIES,
  CREATE_EXCHANGE_RATES,
  CREATE_SHARED_ENVELOPES,
} from './schema';

export {
  // Envelopes
  createEnvelope,
  getEnvelopeById,
  getEnvelope,
  getEnvelopes,
  listEnvelopes,
  updateEnvelope,
  deleteEnvelope,
  countEnvelopes,
  // Accounts
  createAccount,
  getAccountById,
  getAccount,
  getAccounts,
  listAccounts,
  updateAccount,
  deleteAccount,
  // Transactions
  createTransaction,
  getTransactionById,
  getTransaction,
  getTransactions,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  countTransactions,
  // Goals
  createGoal,
  getGoalById,
  getGoals,
  updateGoal,
  deleteGoal,
  // Settings
  getSetting,
  setSetting,
  // Subscriptions
  createSubscription,
  getSubscriptionById,
  getSubscriptions,
  updateSubscription,
  deleteSubscription,
  pauseSubscription,
  cancelSubscription,
  resumeSubscription,
} from './crud';

// V4 — Category Groups
export {
  createCategoryGroup,
  getCategoryGroupById,
  getCategoryGroups,
  updateCategoryGroup,
  deleteCategoryGroup,
  getEnvelopesByGroup,
  setEnvelopeGroup,
} from './categories';

// V4 — Transaction Splits & Budget Helpers
export {
  createTransactionSplits,
  getSplitsByTransaction,
  replaceSplits,
  deleteSplitsByTransaction,
  getActivityByEnvelope,
  getTotalIncome,
} from './transactions-v4';
export type { TransactionWithSplits } from './transactions-v4';

// V4 — Recurring Templates
export {
  createRecurringTemplate,
  getRecurringTemplateById,
  getRecurringTemplateBySubscriptionId,
  getActiveTemplates,
  updateRecurringTemplate,
  getDueTemplates,
} from './recurring';

// V4 — Transaction Rules
export {
  createTransactionRule,
  getTransactionRuleById,
  getTransactionRules,
  getEnabledTransactionRules,
  updateTransactionRule,
  deleteTransactionRule,
} from './transaction-rules';

// V4 — Payee Cache
export {
  updatePayeeCache,
  getPayeeSuggestions,
  getEnvelopeSuggestion,
} from './payee-cache';

// V4 — Transfers
export {
  createTransfer,
  getTransferPair,
} from './transfers';

// V4 — Net Worth Snapshots
export {
  createNetWorthSnapshot,
  getNetWorthSnapshotById,
  getNetWorthSnapshotByMonth,
  getNetWorthSnapshots,
  updateNetWorthSnapshot,
  deleteNetWorthSnapshot,
} from './net-worth';
export type {
  NetWorthSnapshotInsert,
  NetWorthSnapshotUpdate,
} from './net-worth';

// V4 — Debt Payoff
export {
  createDebtPayoffPlan,
  getDebtPayoffPlanById,
  getDebtPayoffPlans,
  getActiveDebtPayoffPlans,
  updateDebtPayoffPlan,
  deleteDebtPayoffPlan,
  createDebtPayoffDebt,
  getDebtPayoffDebtById,
  getDebtsByPlan,
  updateDebtPayoffDebt,
  deleteDebtPayoffDebt,
} from './debt-payoff';

// V4 — Budget Rollovers
export {
  createRollover,
  getRolloverById,
  getRollovers,
  getRolloversByMonth,
  getRolloversByEnvelope,
  deleteRollover,
  deleteRolloversByMonth,
} from './rollovers';
export type { BudgetRolloverInsert } from './rollovers';

// V4 — Budget Alerts
export {
  createBudgetAlert,
  getBudgetAlertById,
  getBudgetAlerts,
  getAlertsByEnvelope,
  updateBudgetAlert,
  deleteBudgetAlert,
  createAlertHistory,
  getAlertHistoryByAlert,
  getAlertHistoryByMonth,
  deleteAlertHistory,
} from './alerts';
export type { AlertHistoryInsert } from './alerts';

// V4 — Currencies & Exchange Rates
export {
  createCurrency,
  getCurrency,
  getCurrencies,
  getBaseCurrency,
  deleteCurrency,
  upsertExchangeRate,
  getExchangeRate,
  getExchangeRates,
  deleteExchangeRate,
} from './currency';
export type { CurrencyInsert, ExchangeRateInsert } from './currency';
