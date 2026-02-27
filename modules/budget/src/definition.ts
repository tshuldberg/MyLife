import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import {
  BANK_SYNC_INDEXES,
  BANK_SYNC_TABLES,
  CORE_INDEXES,
  CORE_TABLES,
  SEED_DEFAULT_ACCOUNTS,
  SEED_DEFAULT_ENVELOPES,
  SEED_SETTINGS,
} from './db/schema';

const BUDGET_MIGRATION_V1: Migration = {
  version: 1,
  description:
    'Initial budget schema — envelopes, accounts, transactions, goals, settings + indexes + seeds',
  up: [
    ...CORE_TABLES,
    ...CORE_INDEXES,
    ...SEED_DEFAULT_ACCOUNTS,
    ...SEED_DEFAULT_ENVELOPES,
    ...SEED_SETTINGS,
  ],
  down: [
    'DROP TABLE IF EXISTS bg_goals',
    'DROP TABLE IF EXISTS bg_transactions',
    'DROP TABLE IF EXISTS bg_settings',
    'DROP TABLE IF EXISTS bg_accounts',
    'DROP TABLE IF EXISTS bg_envelopes',
  ],
};

const BUDGET_MIGRATION_V2: Migration = {
  version: 2,
  description: 'Add bank sync scaffolding tables and indexes',
  up: [
    ...BANK_SYNC_TABLES,
    ...BANK_SYNC_INDEXES,
  ],
  down: [
    'DROP TABLE IF EXISTS bg_bank_webhook_events',
    'DROP TABLE IF EXISTS bg_bank_sync_state',
    'DROP TABLE IF EXISTS bg_bank_transactions_raw',
    'DROP TABLE IF EXISTS bg_bank_accounts',
    'DROP TABLE IF EXISTS bg_bank_connections',
  ],
};

export const BUDGET_MODULE: ModuleDefinition = {
  id: 'budget',
  name: 'MyBudget',
  tagline: 'Envelope budgeting made simple',
  icon: '\u{1F4B0}',
  accentColor: '#22C55E',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [BUDGET_MIGRATION_V1, BUDGET_MIGRATION_V2],
  schemaVersion: 2,
  tablePrefix: 'bg_',
  navigation: {
    tabs: [
      { key: 'budget', label: 'Budget', icon: 'wallet' },
      { key: 'transactions', label: 'Transactions', icon: 'list' },
      { key: 'subscriptions', label: 'Subscriptions', icon: 'repeat' },
      { key: 'reports', label: 'Reports', icon: 'pie-chart' },
      { key: 'accounts', label: 'Accounts', icon: 'credit-card' },
    ],
    screens: [
      { name: 'envelope-detail', title: 'Envelope' },
      { name: 'add-transaction', title: 'Add Transaction' },
      { name: 'subscription-detail', title: 'Subscription' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
