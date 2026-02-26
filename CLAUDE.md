# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MyLife is a unified hub app consolidating 11+ privacy-first personal app modules into a single cross-platform application. Users enable/disable modules from a hub dashboard, funded by a suite subscription.

**Platforms:** iOS (Expo), Android (Expo), Web (Next.js 15), macOS (SwiftUI — future)
**Monetization:** Suite subscription via RevenueCat (mobile) + Stripe (web)

## Stack

- **Language:** TypeScript everywhere
- **Mobile:** Expo (React Native) via `apps/mobile/`
- **Web:** Next.js 15 (App Router) via `apps/web/`
- **Database:** SQLite (expo-sqlite mobile, better-sqlite3 web) — single file, prefixed tables per module
- **Cloud Modules:** Supabase (MySurf, MyWorkouts), Drizzle + tRPC (MyHomes)
- **Monorepo:** Turborepo
- **Package Manager:** pnpm 9.15.x
- **Validation:** Zod 3.24
- **Testing:** Vitest

## TypeScript Requirement

- TypeScript-first across all apps and packages in this project.
- New runtime code should be .ts/.tsx with strict typing and no implicit any.
- Use .js/.cjs only where required by tooling or platform constraints.

## App Isolation + Hub Inclusion (Critical)

- Any app added to the `/Users/trey/Desktop/Apps` workspace must be either:
  - a fully isolated standalone app directory (for example `MyWords/`), or
  - a module integrated into the MyLife hub (`modules/<name>/` with routes wired in `apps/mobile` and/or `apps/web`).
- If an app exists in both forms, keep the standalone app fully isolated in its own directory and keep hub integration inside MyLife module/app boundaries.
- Do not scatter standalone app files directly in the MyLife root.

## Standalone/Module Parity (Critical)

- Standalone app repositories are the canonical product sources of truth.
- If an app exists as both a standalone repo and a MyLife module, both must remain identical products (features, behavior, data model intent, and UX intent).
- Do not ship module-only or standalone-only capabilities.
- Any parity-impacting change must be applied in both codebases in the same session and reflected in both instruction pairs (`AGENTS.md` + `CLAUDE.md`).
- Optional networked capabilities (for example bank sync) are allowed, but option availability and behavior must match between standalone and module versions.
- Hub implementations must be parity adapters, not independent rewrites.
- For any standalone + module pair, route/screen structure, user-visible labels, controls, and settings must match exactly; only hub shell chrome (sidebar/top-level hub navigation) may differ.
- Hub shell theming may differ, but module screen theming must match the standalone app for that module.
- Avoid duplicate UI logic across standalone and hub. Prefer shared components/packages or thin adapter layers that keep one canonical source.
- Web passthrough parity is enforced by direct route reuse for passthrough-enabled modules (`books`, `habits`, `words`, `workouts`): hub files under `apps/web/app/<module>/**` must stay thin wrappers that import standalone pages from the corresponding `@my<module>-web/app/**` alias.
- Any parity validation failure is a release blocker. Run `pnpm check:parity` before merging parity-impacting work.
- Use `pnpm check:module-parity` for cross-module parity inventory checks, `pnpm check:passthrough-parity` for standalone↔hub parity matrix plus strict passthrough wrapper enforcement, and `pnpm check:workouts-parity` for strict MyWorkouts UI/data parity checks.
- Modules with standalone repos that only contain design docs are parity-deferred until standalone runtime code exists.

## Agent Instructions and Tooling

- Persistent agent instructions are stored in both `AGENTS.md` and `CLAUDE.md`. Keep them in sync when rules change.
- Global Codex skills are sourced from `/Users/trey/.codex/skills` (67 skills verified on 2026-02-24).
- In-repo skill snapshot is tracked in `.claude/skills-available.md`.
- Plugin/MCP availability and re-verification steps are tracked in `.claude/plugins.md`.
- Local execution allow-list settings live in `.claude/settings.local.json`.

## Key Commands

```bash
pnpm install             # Install all dependencies
pnpm dev                 # Dev mode for all (Turborepo)
pnpm dev:mobile          # Expo mobile only
pnpm dev:web             # Next.js web only
pnpm build               # Build all packages and apps
pnpm test                # Run all tests (Vitest)
pnpm typecheck           # Type check all
pnpm check:module-parity # Validate standalone↔hub module parity inventory
pnpm check:passthrough-parity # Validate all standalone apps + module passthrough matrix
pnpm check:workouts-parity # Strict MyWorkouts UI/data parity validation
pnpm check:parity        # Full parity gate (standalone integrity + module parity + workouts strict parity)
pnpm test:parity-matrix  # Run standalone↔MyLife parity matrix tests only
pnpm clean               # Clean build artifacts
```

## Architecture

```
MyLife/
├── apps/
│   ├── mobile/                    # Single Expo app (iOS + Android)
│   │   ├── app/
│   │   │   ├── _layout.tsx        # Root: DatabaseProvider → ModuleRegistryProvider → Stack
│   │   │   └── (hub)/             # Hub dashboard, discover, settings (3 tabs)
│   │   └── components/            # Hub-shell components (ModuleCard, BackToHubButton)
│   └── web/                       # Single Next.js 15 app
│       ├── app/
│       │   ├── layout.tsx         # Persistent sidebar with module icons
│       │   ├── page.tsx           # Hub dashboard
│       │   ├── discover/          # Module browser
│       │   └── settings/          # Account, subscription
│       └── components/            # Sidebar, ModuleCard, Providers
├── modules/                       # Per-module business logic (@mylife/<name>)
│   ├── books/                     # @mylife/books (MyBooks)
│   ├── budget/                    # @mylife/budget (MyBudget)
│   ├── fast/                      # @mylife/fast (MyFast)
│   ├── recipes/                   # @mylife/recipes (MyRecipes)
│   ├── surf/                      # @mylife/surf (MySurf — Supabase)
│   ├── workouts/                  # @mylife/workouts (MyWorkouts — Supabase)
│   ├── homes/                     # @mylife/homes (MyHomes — Drizzle + tRPC)
│   ├── car/                       # @mylife/car (MyCar — new)
│   ├── habits/                    # @mylife/habits (MyHabits — new)
│   ├── meds/                      # @mylife/meds (MyMeds — new)
│   └── subs/                      # @mylife/subs (MySubs — new)
├── packages/
│   ├── ui/                        # @mylife/ui — Unified dark theme + components
│   ├── db/                        # @mylife/db — SQLite adapter, hub schema, migration orchestrator
│   ├── module-registry/           # @mylife/module-registry — Module lifecycle, types, hooks
│   ├── auth/                      # @mylife/auth — Supabase Auth wrapper (Phase 3)
│   ├── subscription/              # @mylife/subscription — RevenueCat + Stripe (Phase 3)
│   ├── migration/                 # @mylife/migration — Standalone app data importers
│   ├── eslint-config/
│   └── typescript-config/
├── supabase/                      # Combined migrations for surf + workouts (Phase 4)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Key Patterns

- **Module system:** Every module exports a `ModuleDefinition` contract. The hub registers, enables/disables, and renders modules dynamically via `@mylife/module-registry`.
- **Single SQLite file:** All local modules share one `.sqlite` with table name prefixes (`bk_` for books, `bg_` for budget, etc.). Hub tables use `hub_` prefix.
- **Theme boundary:** Hub shell may use the MyLife dark theme, but module screens must match standalone module theming to preserve parity.
- **Privacy-first:** Zero analytics, zero telemetry, offline-first where possible.

### Module Table Prefixes

| Module | Prefix | Module | Prefix |
|--------|--------|--------|--------|
| Hub | `hub_` | Car | `cr_` |
| Books | `bk_` | Habits | `hb_` |
| Budget | `bg_` | Meds | `md_` |
| Fast | `ft_` | Subs | `sb_` |
| Recipes | `rc_` | | |

### Subscription Tiers

- **Free tier:** MyFast + MySubs (always unlocked)
- **MyLife Pro:** All 11 modules — $4.99/mo, $29.99/yr, $79.99 lifetime

## Module System

Each module implements `ModuleDefinition` from `@mylife/module-registry`:

```typescript
interface ModuleDefinition {
  id: ModuleId;              // 'books' | 'budget' | 'fast' | ...
  name: string;              // 'MyBooks'
  tagline: string;           // 'Track your reading life'
  icon: string;              // '📚'
  accentColor: string;       // '#C9894D'
  tier: 'free' | 'premium';
  storageType: 'sqlite' | 'supabase' | 'drizzle';
  migrations?: Migration[];
  tablePrefix?: string;      // 'bk_' for books
  navigation: { tabs: ModuleTab[]; screens: ModuleScreen[] };
  requiresAuth: boolean;
  requiresNetwork: boolean;
  version: string;
}
```

**Module lifecycle:** Enable → SQLite migrations run → nav routes activate → dashboard card appears. Disable → routes removed, card hidden, data preserved (NOT deleted).

## Phase Plan

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 0** | Hub Foundation — monorepo, module registry, db, ui, app shells | **Done** |
| **Phase 1** | First Module — MyBooks migration, table prefix, data importer | **Done** |
| **Phase 2** | Core Module Migration + Standalone Parity — MyBudget, MyFast, MyRecipes + new scaffolds | Pending |
| **Phase 3** | Auth + Subscription — Supabase Auth, RevenueCat, Stripe, paywall | Pending |
| **Phase 4** | Cloud Modules — MySurf, MyWorkouts, MyHomes migration | Pending |
| **Phase 5** | macOS App — SwiftUI, Zod→Swift codegen, GRDB SQLite | Pending |
| **Phase 6** | Polish + Launch — perf, App Store, TestFlight, Vercel | Pending |

## Git Workflow

- **Branch naming:** `feature/`, `fix/`, `refactor/`, `docs/`
- **Commit format:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- **Merge strategy:** Squash merge to `main`
- **Change tracking:** Update `timeline.md` after every development session

## File Ownership Zones (Parallel Agent Work)

| Zone | Owner | Files |
|------|-------|-------|
| Root configs | lead | `package.json`, `turbo.json`, `pnpm-workspace.yaml`, `tsconfig.base.json` |
| Module Registry | registry-dev | `packages/module-registry/` |
| Database | db-dev | `packages/db/` |
| UI Package | ui-dev | `packages/ui/` |
| Mobile App | mobile-dev | `apps/mobile/` |
| Web App | web-dev | `apps/web/` |
| Per-module logic | module-dev | `modules/<name>/` |
| Auth + Subscription | auth-dev | `packages/auth/`, `packages/subscription/` |
| Tests | tester | `**/__tests__/` |
| Docs | docs-dev | `CLAUDE.md`, `README.md`, `timeline.md` |

## Context7 Library IDs

Skip `resolve-library-id` and go directly to `query-docs` with these:

| Library | Context7 ID |
|---------|-------------|
| Expo | `/expo/expo` |
| Next.js 15 | `/vercel/next.js` |
| Zod | `/colinhacks/zod` |
| Supabase | `/supabase/supabase-js` |
| tRPC | `/trpc/trpc` |
| Drizzle ORM | `/drizzle-team/drizzle-orm` |
| Mapbox (RN) | `/rnmapbox/maps` |
| RevenueCat | `/revenuecat/purchases-js` |

## Legacy Submodules

Standalone submodule directories (`MyBooks/`, `MyBudget/`, etc.) remain the canonical sources for product parity. If a module exists in both standalone and MyLife hub form, update both sides in the same session and verify with `pnpm check:parity`.


## Writing Style
- Do not use em dashes in documents or writing.
