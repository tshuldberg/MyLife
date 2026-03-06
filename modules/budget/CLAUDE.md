# @mylife/budget

## Overview

Envelope budgeting module with integrated subscription tracking and bank sync. YNAB-style envelope budgeting merged with a subscription catalog, renewal calendar, and cost dashboard. Privacy-first with all data on-device via SQLite. Optional bank sync via Plaid for automated transaction import.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `BUDGET_MODULE` | ModuleDefinition | Module registration contract (id: `budget`, prefix: `bg_`, tier: premium) |
| `EnvelopeSchema` / `Envelope` | Zod schema + type | Budget envelope (name, monthly budget, rollover, sort order) |
| `AccountSchema` / `Account` | Zod schema + type | Financial account (checking, savings, credit card, cash) |
| `BudgetTransactionSchema` | Zod schema + type | Transaction records with envelope assignment and filtering |
| `BudgetGoalSchema` | Zod schema + type | Savings goals |
| `BudgetSubscriptionSchema` | Zod schema + type | Subscription tracker with billing cycle, renewal, cost |
| `SUBSCRIPTION_CATALOG` | Data | 215-entry subscription service catalog |
| `bank-sync/*` | Module | Plaid provider, token vault, webhook security, audit log, recurring detector |
| CRUD functions | Functions | Full CRUD for envelopes, accounts, transactions, goals, settings, subscriptions |

## Storage

- **Type:** sqlite
- **Table prefix:** `bg_`
- **Schema version:** 3
- **Key tables:** `bg_envelopes`, `bg_accounts`, `bg_transactions`, `bg_goals`, `bg_settings`, `bg_subscriptions`, `bg_bank_connections`, `bg_bank_accounts`, `bg_bank_transactions_raw`, `bg_bank_sync_state`, `bg_bank_webhook_events`

## Engines

- **bank-sync/connector-service.ts** -- Bank connection lifecycle, sync orchestration
- **bank-sync/provider-router.ts** -- Multi-provider routing (Plaid, future providers)
- **bank-sync/providers/plaid.ts** -- Plaid API integration
- **bank-sync/token-vault.ts** -- Encrypted credential storage
- **bank-sync/webhook-security.ts** -- Webhook signature verification
- **bank-sync/audit-log.ts** -- Audit trail for bank sync operations
- **bank-sync/recurring-detector.ts** -- Automatic recurring transaction detection
- **bank-sync/subscription-discovery.ts** -- Auto-discover subscriptions from bank data
- **db/subscription-catalog.ts** -- 215-entry catalog with search, normalize, renewal calc

## Schemas

- `EnvelopeSchema`, `EnvelopeInsertSchema`, `EnvelopeUpdateSchema`
- `AccountSchema`, `AccountInsertSchema`, `AccountUpdateSchema`, `AccountType`
- `BudgetTransactionSchema`, `BudgetTransactionInsertSchema`, `BudgetTransactionUpdateSchema`, `BudgetTransactionFilterSchema`, `TransactionDirection`
- `BudgetGoalSchema`, `BudgetGoalInsertSchema`, `BudgetGoalUpdateSchema`
- `BudgetSettingSchema`
- `BudgetSubscriptionSchema`, `BudgetSubscriptionInsertSchema`, `BudgetSubscriptionUpdateSchema`, `BudgetSubscriptionFilterSchema`, `BillingCycle`, `SubscriptionStatus`
- `CatalogCategorySchema`
- Bank sync types (`bank-sync/types.ts`)

## Test Coverage

- **Test files:** 10
- **Covered:** Core budget CRUD (`__tests__/budget.test.ts`), bank sync audit log, cloud adapters, connector service, Plaid provider, provider router, server runtime, token vault, webhook security, bank sync types
- **Gaps:** Subscription catalog search, recurring detector, subscription discovery

## Parity Status

- **Standalone repo:** MyBudget (exists as standalone submodule)
- **Hub integration:** wired

## Key Files

- `src/definition.ts` -- Module definition (3 migrations, 11 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All Zod schemas and TypeScript types
- `src/db/crud.ts` -- Core CRUD for envelopes, accounts, transactions, goals, settings
- `src/db/schema.ts` -- All CREATE TABLE statements
- `src/db/subscription-catalog.ts` -- 215-entry subscription service catalog
- `src/bank-sync/index.ts` -- Bank sync subsystem barrel export
- `src/bank-sync/connector-service.ts` -- Bank connection orchestration
