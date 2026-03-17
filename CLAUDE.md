# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MyLife is a unified hub app consolidating privacy-first personal app modules into a single cross-platform application. The registry currently defines 27 module IDs, with 14 full modules wired on mobile and 12 wired on web. Users enable or disable modules from a hub dashboard, funded by a suite subscription.

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

- Any app added to `/Users/trey/Desktop/Apps` must be either:
  - a fully isolated standalone app directory (for example `MyWords/`), or
  - a MyLife hub module wired inside `modules/<name>/` and `apps/mobile` and/or `apps/web`.
- If an app exists in both forms, keep the standalone app fully isolated in its own directory and keep hub integration inside MyLife module and app boundaries.
- Do not scatter standalone app files directly in the MyLife root.
- Directories under `archive/` are historical placeholders, not active standalone edit targets.

## Standalone And Module Parity (Critical)

- Active standalone apps are canonical product sources until they are explicitly archived.
- If an active standalone app also has a hub module, keep product intent aligned across both surfaces: feature set, behavior, data model intent, and user-facing terminology.
- Do not describe a hub module as parity-complete if it is still a lightweight adapter or partial migration.
- When a parity-impacting rule changes, update both instruction pairs (`AGENTS.md` and `CLAUDE.md`) in the same session.
- Use `pnpm check:module-parity`, `pnpm check:passthrough-parity`, `pnpm check:workouts-parity`, and `pnpm check:parity` for parity-impacting work.

## Agent Instructions and Tooling

- Persistent agent instructions are stored in both `AGENTS.md` and `CLAUDE.md`. Keep them in sync when rules change.
- Global Codex skills are sourced from `/Users/trey/.codex/skills`.
- In-repo skill snapshot is tracked in `.claude/skills-available.md`.
- MyLife also includes repo-local skills under `.claude/skills/` for parity, migration, scaffolding, and gate workflows.
- Plugin/MCP availability and re-verification steps are tracked in `.claude/plugins.md`.
- Local execution allow-list settings live in `.claude/settings.local.json`.
- `.claude/settings.json` enables agent teams and runs `pnpm check:parity --quiet` on task completion.

## Gstack (Browser + Workflow Skills)

- For all web browsing, use the `/browse` skill from gstack. Never use `mcp__claude-in-chrome__*` tools.
- Available gstack skills:

| Skill | Purpose |
|-------|---------|
| `/plan-ceo-review` | CEO/founder-mode plan review |
| `/plan-eng-review` | Eng manager-mode plan review |
| `/review` | Pre-landing PR review |
| `/ship` | Ship workflow (merge, test, review, bump, PR) |
| `/browse` | Headless browser for QA and site testing |
| `/qa` | QA test a web app and fix bugs found |
| `/qa-only` | Report-only QA testing (no fixes) |
| `/setup-browser-cookies` | Import cookies from your real browser |
| `/retro` | Weekly engineering retrospective |
| `/document-release` | Post-ship documentation update |

## Automation Hooks

- `.claude/settings.json` is the source of truth for Claude Code hook enforcement in this repo.
- The current hook stack includes:
  - `PreToolUse` Bash policy validation
  - `PostToolUse` targeted TypeScript and debug-code checks after source edits
  - `PreCompact` context snapshot persistence
  - `Stop` response-end snapshot persistence
  - `TaskCompleted` parity enforcement
- Hook-generated runtime snapshots are written under `.claude/memory/runtime/` and are gitignored. Do not treat them as product docs.
- `.husky/pre-commit` runs `pnpm gate:function:changed --staged`. Keep staged source changes compatible with the function gate before committing.

## Key Commands

```bash
pnpm install             # Install all dependencies
pnpm dev                 # Dev mode for all (Turborepo)
pnpm dev:mobile          # Expo mobile only
pnpm dev:web             # Next.js web only
pnpm build               # Build all packages and apps
pnpm test                # Run all tests (Vitest)
pnpm typecheck           # Type check all
pnpm scaffold:function-test --file <path> --function <name> # Scaffold contract + fuzz + perf test template
pnpm gate:function --file <path> # Run lint + typecheck + tests for a changed function package
pnpm gate:function:changed # Run the function gate across all changed source files
pnpm gate:function --standalone <MyAppName> # Run same gate for a contained standalone app root
pnpm gate:function --all-standalone # Run same gate across all contained standalone app roots
pnpm check:module-parity # Verify standalone vs module parity for paired apps
pnpm check:passthrough-parity # Verify passthrough route and registry parity
pnpm check:workouts-parity # Verify workouts standalone vs hub parity
pnpm check:parity # Run the full parity suite used by the task-complete hook
pnpm check:generated-artifacts # Block large generated outputs in tracked docs paths
pnpm clean               # Clean build artifacts
```

## Function Quality Gate Requirement

- For any code change that modifies function logic, run `pnpm gate:function:changed` before finalizing.
- If no function logic changed, state that explicitly when skipping this gate.
- This requirement applies to both hub code and contained standalone apps.

## Performance Artifact Policy

- Large generated performance outputs must not be committed under `docs/performance/`.
- Generated outputs from `pnpm audit:functions` must be written to `artifacts/perf-audit/`.
- Keep `docs/performance/` focused on curated docs and small examples only.
- Before merge, run `pnpm check:generated-artifacts` to block forbidden generated files and oversized tracked files.

## Parity Verification

- `.claude/settings.json` runs `pnpm check:parity --quiet` before a task can be marked complete.
- When parity-sensitive facts change, update docs and verification scripts in the same session.

## Architecture

```
MyLife/
├── apps/
│   ├── mobile/                    # Single Expo app (iOS + Android)
│   │   ├── app/
│   │   │   ├── _layout.tsx        # Root: DatabaseProvider -> ModuleRegistryProvider -> Stack
│   │   │   └── (hub)/             # Hub dashboard, discover, settings
│   │   └── components/            # Hub shell components
│   └── web/                       # Single Next.js 15 app
│       ├── app/
│       │   ├── layout.tsx         # Persistent sidebar with module icons
│       │   ├── page.tsx           # Hub dashboard
│       │   ├── discover/          # Module browser
│       │   └── settings/          # Account, subscription
│       └── components/            # Sidebar, ModuleCard, Providers
├── modules/                       # Per-module business logic (@mylife/<name>)
│   ├── books budget car fast habits health homes meds nutrition/
│   ├── recipes rsvp surf words workouts/    # currently wired in at least one host app
│   └── closet cycle flash garden journal mail mood notes pets stars subs trails voice/
│                                         # scaffolded or partially wired modules
├── packages/
│   ├── ui/                        # @mylife/ui, Cool Obsidian tokens + shared components
│   ├── db/                        # @mylife/db, SQLite adapter, hub schema, migration orchestration
│   ├── module-registry/           # @mylife/module-registry, module metadata + lifecycle
│   ├── auth/                      # @mylife/auth, auth wrapper
│   ├── subscription/              # @mylife/subscription, billing + entitlements
│   ├── migration/                 # @mylife/migration, standalone importers
│   ├── eslint-config/
│   └── typescript-config/
├── supabase/                      # Shared cloud migrations for surf/workouts
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Key Patterns

- **Module system:** Every module exports a `ModuleDefinition` contract. The hub registers, enables/disables, and renders modules dynamically via `@mylife/module-registry`.
- **Single SQLite file:** All local modules share one `.sqlite` with table name prefixes (`bk_` for books, `bg_` for budget, etc.). Hub tables use `hub_` prefix.
- **Theme:** All modules use the Cool Obsidian design system (see Design System section below).
- **Privacy-first:** Zero analytics, zero telemetry, offline-first where possible.

### Registry vs Host App Wiring

- `packages/module-registry/src/types.ts` defines 27 known `ModuleId` values.
- Mobile currently registers full module definitions for `books`, `budget`, `car`, `fast`, `habits`, `health`, `homes`, `meds`, `nutrition`, `recipes`, `rsvp`, `surf`, `words`, and `workouts`.
- Web currently registers full module definitions for `books`, `budget`, `car`, `fast`, `habits`, `homes`, `meds`, `recipes`, `rsvp`, `surf`, `words`, and `workouts`.
- Registry metadata also exists for scaffolded or partially wired modules such as `closet`, `cycle`, `flash`, `garden`, `journal`, `mail`, `mood`, `notes`, `pets`, `stars`, `subs`, `trails`, and `voice`.
- Treat `packages/module-registry/src/constants.ts` and each `modules/*/src/definition.ts` file as the source of truth for live IDs, tiers, and prefixes.

### Module Table Prefixes

| Module | Prefix | Module | Prefix |
|--------|--------|--------|--------|
| Hub | `hub_` | Homes | `hm_` |
| Books | `bk_` | Meds | `md_` |
| Budget | `bg_` | Nutrition | `nu_` |
| Car | `cr_` | Recipes | `rc_` |
| Fast | `ft_` | RSVP | `rv_` |
| Habits | `hb_` | Surf | `sf_` |
| Health | `hl_` | Words | `wd_` |
| Workouts | `wk_` | Source of truth | `modules/*/src/definition.ts` |

### Subscription Tiers

- **Registry free modules:** `fast`, `journal`, `mood`, `notes`, `voice`
- **Current live free surface:** `fast` is wired in both host apps today; the other free IDs remain scaffolded or partially wired.
- **MyLife Pro:** Required for premium modules once they are wired into the hub. Verify current packaging and pricing against billing config before publishing product copy.

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

## Archive Strategy

Standalone app repositories are being consolidated into MyLife hub modules. After features merge into a hub module, the standalone repo moves to `archive/<name>/`.

| Standalone | Hub Module | Status |
|-----------|------------|--------|
| MyBooks/ | modules/books/ | Archived (2026-03-08) |
| MyBudget/ | modules/budget/ | Archived (2026-03-07) |
| MyCar/ | modules/car/ | Active -- consolidation pending |
| MyRecipes/ | modules/recipes/ | Archived (2026-03-08) |
| MySurf/ | modules/surf/ | Consolidated -- archival pending |
| MyWorkouts/ | modules/workouts/ | Archived (2026-03-08) |

This table covers the primary standalone consolidation track. The full module inventory also includes scaffolded and partially wired modules tracked in `packages/module-registry/`.

### Consolidation Workflow
1. Review spec for full feature set
2. Gap analysis: map standalone files to hub counterparts
3. Schema migration: add new migration versions for missing tables
4. Business logic migration: copy engines/services into modules/<name>/src/
5. Route wiring: create screens in apps/mobile/ and apps/web/
6. Test migration: port tests, verify with pnpm test
7. Archive: move standalone to archive/<name>/, remove submodule, update docs

## Design System (Cool Obsidian)

The hub uses a cool-toned dark theme inspired by iOS glass morphism.

| Token | Value | Usage |
|-------|-------|-------|
| background | #0A0A0F | App background |
| surface | #12121A | Card/panel fill |
| surfaceElevated | #1A1A24 | Elevated surfaces |
| text | #F0F0F5 | Primary text |
| textSecondary | rgba(240,240,245,0.65) | Secondary text |
| border | rgba(255,255,255,0.06) | Subtle borders |
| glass | rgba(255,255,255,0.04) | Glass card fill |
| glassStrong | rgba(255,255,255,0.08) | Strong glass fill |
| glassBorder | rgba(255,255,255,0.10) | Glass card border |
| danger | #FF453A | iOS system red |
| success | #30D158 | iOS system green |

Glass morphism: use expo-blur BlurView on mobile, backdrop-filter on web.
Token source of truth: packages/ui/src/tokens/

## Phase Plan

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Hub Foundation + Cool Obsidian redesign | Done |
| Phase 1 | MyBudget consolidation | Done |
| Phase 2 | MyRecipes consolidation | Done |
| Phase 3 | MyBooks consolidation | Done |
| Phase 4 | MyWorkouts consolidation | Done |
| Phase 5 | MySurf consolidation | Done |
| Phase 6 | MyCar consolidation | Pending |

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

## Agent Teams Strategy

Agent team support is enabled via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `.claude/settings.json`. When 2+ tasks target MyLife with overlapping scope, create an Agent Team instead of parallel subagents.

### Available Agent Definitions

**MyLife-specific agents** (`.claude/agents/`):

| Agent | Role | Edits Code? |
|-------|------|-------------|
| `module-dev` | Migrate standalone apps into hub modules, edit module code | Yes |
| `hub-shell-dev` | Edit hub shell (apps/, packages/), dashboard, sidebar, registry | Yes |
| `parity-checker` | Read-only parity validation across standalone apps, modules, and docs | No |

**Workspace-level agents** (inherited from `/Users/trey/Desktop/Apps/.claude/agents/`):

| Agent | Role | Edits Code? |
|-------|------|-------------|
| `plan-executor` | Execute plan phases with testing and verification | Yes |
| `test-writer` | Write tests without modifying source code | Tests only |
| `docs-agent` | Update CLAUDE.md, timeline, README | Docs only |
| `reviewer` | Code review, quality gates (Sonnet) | No |

### Typical Team Compositions

**Module consolidation sprint:**
- Lead: coordinator, task creation
- 2-3x `module-dev`: each owns a different module (e.g., budget, recipes, books)
- 1x `test-writer`: adds test coverage in parallel

**Hub shell feature work:**
- Lead: coordinator
- 1x `hub-shell-dev` (mobile): Expo app changes
- 1x `hub-shell-dev` (web): Next.js app changes
- 1x `module-dev`: module-registry changes if needed

**Cross-module documentation update:**
- Lead: coordinator
- 1x `module-dev` per affected module
- 1x `docs-agent`: updates CLAUDE.md/AGENTS.md pairs
- 1x `parity-checker`: validates parity and sync-sensitive changes before completion

### Team Guidance

- Prefer small teams with clear file ownership.
- Assign file ownership zones from the table above to prevent edit conflicts.
- All teammates automatically load this CLAUDE.md, so critical rules here are enforced team-wide.
- Use `--teammate-mode in-process` for single-terminal sessions or `--teammate-mode tmux` for split panes.

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

## Standalone Submodules (Parity Workflow)

- Edit active standalone submodule directories directly when they remain canonical.
- Do not create copies, staging directories, or parallel directory trees for standalone apps.
- After changing an active standalone app with a paired hub module, apply the corresponding hub-side change in the same session.
- Archived standalone placeholders under `archive/` no longer serve as canonical sources. The hub module becomes the maintained implementation.

## Writing Style
- Do not use em dashes in documents or writing.


### Code Intelligence

Prefer LSP over Grep/Read for code navigation - it's faster, precise, and avoids reading entire files:
- `workspaceSymbol` to find where something is defined
- `findReferences` to see all usages across the codebase
- `goToDefinition` / `goToImplementation` to jump to source
- `hover` for type info without reading the file

Use Grep only when LSP isn't available or for text/pattern searches (comments, strings, config).

After writing or editing code, check LSP diagnostics and fix errors before proceeding.
