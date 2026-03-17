# TODOS

Tracked work items for MyLife. Updated 2026-03-17.

---

## P1 -- High Priority

### Test all 11 untested budget engines
**Module:** `modules/budget/src/engine/`
**What:** Write dedicated test files for: income-estimator, payday-detector, debt-payoff, reporting, net-worth, alerts, multi-currency, rollover, upcoming, goals, transaction-rules.
**Why:** These engines do real financial math (interest calculations, statistical pattern detection, currency conversion). Multiple have silent failure modes (NaN, division by zero) that only tests would catch. 11 of 14 engine files have zero dedicated test coverage.
**How to apply:** Each test file should cover: happy path, zero/empty inputs, boundary values, and specific failure modes (NaN amounts, zero rates, same-day dates, negative balances). These are pure functions with clear inputs/outputs.
**Effort:** L | **Depends on:** Nothing (can parallelize)

### Derived account balances (V5 migration)
**Module:** `modules/budget/src/db/`
**What:** Add `initial_balance` column to `bg_accounts`. Compute `current_balance = initial_balance + SUM(transactions)`. Write V5 migration that backfills `initial_balance` from existing data.
**Why:** Currently, adding a transaction does not update the account balance. Users must update both manually. Every financial insight (days-until-broke, net worth, cash flow) depends on accurate balances. The dashboard cannot show trustworthy numbers without this.
**How to apply:** Migration V5 must: (1) add `initial_balance` column, (2) compute `initial_balance = current_balance - SUM(existing transactions for that account)`, (3) add `computeAccountBalance(db, accountId)` function. Handle accounts with zero transactions (initial_balance = current_balance).
**Effort:** M | **Depends on:** Nothing

### DB-layer input validation guards
**Module:** `modules/budget/src/db/`
**What:** Add validation at the DB read layer so engines never receive NaN, Infinity, or malformed data. Create `validateBudgetRow()` utility. Apply to all query/get functions in `db/crud.ts`.
**Why:** Multiple engines silently corrupt output when they receive NaN or malformed dates. The DB layer is the right enforcement boundary because it catches bad data regardless of source (migration bugs, manual SQLite edits, CSV imports).
**How to apply:** Check `isFinite()` on numeric fields, validate date regex on string fields. Invalid data coerced to safe defaults (0 for amounts, current date for dates) with console warning.
**Effort:** S | **Depends on:** Nothing

### Mobile dashboard rewrite
**Module:** `apps/mobile/app/(budget)/index.tsx`
**What:** Replace button-grid home screen with Morning Briefing dashboard: ready-to-assign amount, account balances, upcoming bills (next 7 days), active alerts, goal progress bars, rotating insight cards.
**Why:** The home screen IS the product. Currently shows total monthly budget and 6 navigation buttons. The 14 engines compute incredible data that nobody sees. The dashboard turns MyBudget from "a tool I use" to "an app I check every morning."
**How to apply:** Use `getDashboardState()` from the Dashboard Aggregator. Render insight cards as a scrollable feed. ~300-400 lines replacing the existing 273-line button grid.
**Effort:** L | **Depends on:** Dashboard Insight Aggregator (engine/dashboard.ts)

### Fix stale module CLAUDE.md
**Module:** `modules/budget/CLAUDE.md`
**What:** Update to reflect current state: schemaVersion 4 (not 3), 29 tables (not 11), V4 engines, 16 test files.
**Why:** Stale documentation causes agents and contributors to make wrong assumptions. The CLAUDE.md was written before the V4 migration landed.
**How to apply:** Update Storage section (schemaVersion, table list), Engines section (add V4 engines), Test Coverage section (update counts).
**Effort:** S | **Depends on:** Nothing

---

## P2 -- Medium Priority

### Onboarding flow (90-second setup)
**Module:** `apps/mobile/app/(budget)/onboarding.tsx` + web equivalent
**What:** First-run wizard: (1) name accounts with starting balances, (2) set up 4-6 envelope budgets with smart defaults, (3) optional CSV import or bank connect, (4) optional subscription catalog pick. Persist onboarding-complete flag in `bg_settings`.
**Why:** New users see 2 seed accounts and 4 zero-budget envelopes with no guidance. Great onboarding is the difference between "tried it once" and "uses it daily."
**How to apply:** Detect first run via `bg_settings` flag. Multi-step wizard with progress indicator. Subscription catalog (215 entries) perfect for "which services do you pay for?" step.
**Effort:** M | **Depends on:** Derived balances (for initial balance setup)

### Property-based CRDT tests with fast-check
**Module:** `packages/sync/__tests__/`
**What:** Use fast-check property-based testing to verify CRDT algebraic laws (commutativity, associativity, idempotency) for all CRDT types: G-Set, 2P-Set, LWW-Register, PN-Counter.
**Why:** CRDTs have precise mathematical invariants that example-based tests can miss. Property-based tests generate thousands of random merge scenarios and catch edge cases (concurrent edits, reordered ops, duplicate deliveries) that hand-written tests never would. Shared financial data is the highest-stakes sync scenario in MyLife.
**How to apply:** One test file per CRDT type. Properties to verify: merge(a, b) = merge(b, a) (commutative), merge(merge(a, b), c) = merge(a, merge(b, c)) (associative), merge(a, a) = a (idempotent). Also test HLC monotonicity and State Vector convergence.
**Effort:** M | **Depends on:** packages/sync/ implementation

### Supabase schema for sync relay
**Module:** `supabase/migrations/`
**What:** Design and migrate Supabase tables for the sharing sync relay: `sharing_op_log` (queued CRDT ops), `sharing_channels` (active share relationships), `sharing_state_vectors` (per-device progress). Use Supabase Realtime subscriptions for push delivery.
**Why:** The CRDT framework handles conflict resolution locally, but ops need a transport layer between devices. Supabase is already used by MySurf and MyWorkouts, so the infrastructure exists. The relay stores ops temporarily until all devices confirm receipt, then compacts.
**How to apply:** Tables should be minimal: op_log stores serialized CRDT ops with channel_id + hlc timestamp, channels maps device pairs to shared envelope sets, state_vectors track what each device has seen. RLS policies scope access to channel members only.
**Effort:** M | **Depends on:** packages/sync/ implementation, sharing invitation flow

### Sharing invitation table and flow
**Module:** `modules/budget/src/db/schema.ts` + `modules/budget/src/sharing/`
**What:** Add `bg_sharing_invitations` table with columns: id, envelope_id, invite_code (6-char alphanumeric), created_by_device_id, accepted_by_device_id, status (pending/accepted/expired/revoked), created_at, expires_at. Add CRUD and invitation lifecycle functions.
**Why:** The existing `bg_shared_envelopes` table tracks active shares but has no invitation mechanism. Users need to generate a code, share it out-of-band (text/email), and have the partner accept it. The invitation flow is the UX entry point for all sharing.
**How to apply:** V6 migration adds the table. Invitation codes are 6 uppercase alphanumeric characters with 36^6 = 2.1B combinations. Codes expire after 24 hours. Accepting an invitation creates entries in both `bg_shared_envelopes` (local) and `sharing_channels` (Supabase). Validate: no self-accept, no double-accept, no expired codes.
**Effort:** M | **Depends on:** Supabase schema for sync relay

---

## Vision -- Delight Opportunities

### Days Until Broke counter
Dashboard card: "You're covered for 18 days." Current total balance / average daily spend, minus upcoming bills. The financial equivalent of your phone's battery percentage. Uses existing account balances + upcoming.ts + reporting.ts. ~20 min.

### Paycheck Allocation Wizard
When payday detected (via payday-detector.ts), prompt: "You just got paid $2,100. Assign it?" One-tap distribution across envelopes proportionally based on monthly budgets. Uses payday-detector.ts + allocateToEnvelope(). ~30 min.

### Subscription Price Increase Alerts
Surface price changes: "Netflix went from $15.49 to $22.99 (+48%). Your annual cost increased by $90." Engine already tracks price history via recordPriceChange() / getPriceHistory(). ~20 min.

### Envelope Squeeze Quick-Rebalance
When an envelope is overspent, show "Cover this from..." with top 3 surplus envelopes. One-tap fix using moveMoneyBetweenCategories(). Turns stress into action. ~15 min.

### Monthly Financial Health Score
Single 0-100 score: % income budgeted + % envelopes on track + net worth trend + debt-to-income movement + savings rate. Gamification that helps people. All component metrics exist in engines. ~25 min.
