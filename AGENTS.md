# AGENTS.md

Project-specific agent instructions for `/Users/trey/Desktop/Apps/MyLife`.

## Instruction Pair (Critical)

- Keep this file and `CLAUDE.md` synchronized for persistent project rules.
- When a long-lived workflow or constraint changes, update both files in the same session.

## Startup Checklist

- Read `AGENTS.md` and `CLAUDE.md` before making substantial edits.
- Review `.claude/settings.local.json` for local execution constraints.
- Review `.claude/skills-available.md` for the current in-repo skill snapshot.
- Review `.claude/plugins.md` for currently verified MCP/plugin availability.

## TypeScript Requirement (Critical)

- Default to TypeScript for application and shared package code whenever feasible.
- For new product/runtime code, prefer .ts/.tsx over .js/.jsx.
- Use JavaScript only when a toolchain file requires it (for example Babel or Metro config).

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

## Standalone Submodules (Parity Workflow)

- Edit active standalone submodule directories directly when they remain canonical.
- Do not create copies, staging directories, or parallel directory trees for standalone apps.
- After changing an active standalone app with a paired hub module, apply the corresponding hub-side change in the same session.
- Archived standalone placeholders under `archive/` no longer serve as canonical sources. The hub module becomes the maintained implementation.

## Agent Teams

- Agent team support is enabled via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `.claude/settings.json`.
- MyLife-specific agent definitions live in `.claude/agents/` (module-dev, hub-shell-dev, parity-checker).
- Workspace-level agent definitions (plan-executor, test-writer, docs-agent, reviewer) are also available from `/Users/trey/Desktop/Apps/.claude/agents/`.
- When spawning teams, assign file ownership zones from CLAUDE.md to prevent edit conflicts.
- All teammates automatically load CLAUDE.md and AGENTS.md, so critical rules here are enforced team-wide.
- Prefer small teams with clear file ownership.
- See CLAUDE.md for typical team compositions and full agent table.

## Skills Availability

- Skills are sourced from the global Codex skills directory: `/Users/trey/.codex/skills`.
- MyLife also has repo-local skills under `.claude/skills/` for parity, migration, scaffolding, and gate workflows.
- Check `.claude/skills-available.md` or inspect the skills directories directly if availability needs re-verification.

## Plugins / MCP Availability

- See `.claude/plugins.md` for the current verified inventory and re-verification steps.
- `.claude/settings.json` enables agent teams and runs `pnpm check:parity --quiet` on task completion.


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

## Writing Style
- Do not use em dashes in documents or writing.

## Function Quality Gate

- For new or changed functions, scaffold and run the function quality gate before finalizing work:
  - `pnpm scaffold:function-test --file <path> --function <name>`
  - `pnpm gate:function --file <path>`
- Agent enforcement requirement:
  - If a change includes function logic in source files, run `pnpm gate:function:changed` before completion.
  - If no function logic changed, state that explicitly when skipping the gate.
- The same gate must be applicable to contained standalone apps:
  - `pnpm gate:function --standalone <MyAppName>`
  - `pnpm gate:function --all-standalone`

## Performance Artifact Policy

- Large generated performance outputs must not be committed under `docs/performance/`.
- Generated outputs from `pnpm audit:functions` must be written to `artifacts/perf-audit/`.
- Keep `docs/performance/` focused on curated docs and small examples only.
- Before merge, run `pnpm check:generated-artifacts` to block forbidden generated files and oversized tracked files.

## Parity Verification

- `.claude/settings.json` runs `pnpm check:parity --quiet` before a task can be marked complete.
- When parity-sensitive facts change, update docs and verification scripts in the same session.

### Code Intelligence

Prefer LSP over Grep/Read for code navigation - it's faster, precise, and avoids reading entire files:
- `workspaceSymbol` to find where something is defined
- `findReferences` to see all usages across the codebase
- `goToDefinition` / `goToImplementation` to jump to source
- `hover` for type info without reading the file

Use Grep only when LSP isn't available or for text/pattern searches (comments, strings, config).

After writing or editing code, check LSP diagnostics and fix errors before proceeding.
