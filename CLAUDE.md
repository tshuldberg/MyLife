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
- **Dark theme only:** Background `#0E0C09`, per-module accent colors via `ModuleThemeProvider`.
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
| **Phase 2** | Local-Only Modules — MyBudget, MyFast, MyRecipes + new scaffolds | Pending |
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

The old submodule directories (`MyBooks/`, `MyBudget/`, etc.) still exist alongside the new monorepo structure. Module code is being migrated from these standalone repos into `modules/` during Phases 1-4. Do not modify the submodule copies — work in the new `modules/` and `apps/` directories instead.
