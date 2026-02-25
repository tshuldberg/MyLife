import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import {
  ALL_TABLES,
  CREATE_INDEXES,
  SEED_DEFAULT_ACCOUNTS,
  SEED_DEFAULT_ENVELOPES,
  SEED_SETTINGS,
} from './db/schema';

const BUDGET_MIGRATION_V1: Migration = {
  version: 1,
  description:
    'Initial budget schema — envelopes, accounts, transactions, goals, settings + indexes + seeds',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
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

export const BUDGET_MODULE: ModuleDefinition = {
  id: 'budget',
  name: 'MyBudget',
  tagline: 'Envelope budgeting made simple',
  icon: '\u{1F4B0}',
  accentColor: '#22C55E',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [BUDGET_MIGRATION_V1],
  schemaVersion: 1,
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

