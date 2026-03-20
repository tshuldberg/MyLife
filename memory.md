# MyLife Memory

Persistent memory for Claude Code sessions. Updated after each task with what was done and why. Each entry links to a full session log under `docs/sessions/`.

## Project State

- **29 module IDs** registered, **28 on mobile**, **19 on web**
- **Phase 6** (MyCar consolidation) is next
- **Pre-existing issues:** habits migration (period_id), garden migration (status)

## Known Tech Debt

- habits module: V2 migration references `period_id` column that doesn't exist
- garden module: migration references `status` column that doesn't exist
- @types/react version mismatch (19.2.14 installed, ~18.3.12 expected by Expo)
- 3 pre-existing web test failures (car/fast submodule resolution, billing config)
- 2 pre-existing mobile test failures (Expo JSX parsing)
- Budget web module has P2/P3 cosmetic issues (see 2026-03-20 session)

## Key Patterns Learned

- **Archived standalone re-exports crash the hub.** After archiving a standalone app, its web route re-exports (`export { default } from '@myapp-web/...'`) cause "not a React Component" 500 errors. Fix: delete specific routes so the `[...slug]` catch-all with `ModuleWebFallback` handles them.
- **Next.js route priority:** Specific routes always win over `[...slug]` catch-alls. Broken specific routes block fallbacks from firing.
- **ModuleWebFallback must use Cool Obsidian.** The fallback component was created with light theme colors. Always use CSS variables from `globals.css`.
- **Cloud modules use Supabase + SQLite cache hybrid.** Forums, market, surf, workouts all follow this pattern.
- **`safeRegister()` wraps module registration** with try/catch in `_layout.tsx`.
- **React Native compat:** Use `"react-native"` field in package.json for platform-specific entry points.

## Sessions

| Date | Summary | Log |
|------|---------|-----|
| 2026-03-20 | Budget QA: delete 19 broken re-exports, responsive sidebar, fallback theme fix, recipes naming | [session log](docs/sessions/2026-03-20-budget-qa-fixes.md) |
