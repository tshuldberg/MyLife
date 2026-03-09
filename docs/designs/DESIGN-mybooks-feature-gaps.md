# MyBooks - Feature Gap Design Doc
**Source:** Competitive Feature Analysis (2026-03-05)
**Status:** Implemented (28 tables)

## Current State

MyBooks is a fully implemented privacy-first book tracking module with a rich feature set: library management, FTS5 full-text search, half-star ratings, reading session tracking, annual reading goals, year-in-review stats, a built-in e-reader (ePub/PDF), reading challenges, an encrypted reading journal, Goodreads/StoryGraph CSV import, and barcode scanning for quick book lookup. All data is stored locally in SQLite with the `bk_` table prefix.

## Competitors Analyzed

| Competitor | Price | Category | Key Strength |
|-----------|-------|----------|-------------|
| Goodreads | Free | Book tracking | Massive community, Amazon integration |
| Letterboxd | $19-49/yr | Film tracking (pattern) | Beautiful stats, social sharing culture |
| Untappd | $55/yr | Beer tracking (pattern) | Badge/gamification system, check-in model |
| Vivino | $5/mo | Wine tracking (pattern) | Label scanning, community ratings |

## Feature Gaps

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|--------------------------|-------|
| Book recommendations engine | P1 | Goodreads, Letterboxd | Medium | "If you liked X" based on local ratings data, genre preferences, and reading history. Can use on-device heuristics without cloud ML. |
| Social feed | P1 | Goodreads, Letterboxd | Medium | Activity feed showing friends' reads, ratings, and reviews. Requires opt-in social layer. |
| Reading stats sharing | P2 | Letterboxd | Low | Export year-in-review or stats as shareable image cards (generate locally, share via system share sheet). |
| Badge/achievement system | P2 | Untappd | Medium | Gamification for reading milestones: genres explored, pages read, streaks, challenge completions. |
| Book clubs | P2 | Goodreads | Medium | Group reading with discussion threads. Could be local-first with optional sync. |
| Annual reading challenge (community) | P2 | Goodreads | Low | Public challenge participation with opt-in leaderboards. |
| Author following | P3 | Goodreads | Medium | Follow favorite authors for new release notifications via Open Library API polling. |

## Recommended Features to Build

1. **Book recommendations engine** - Build an on-device recommendation system using the user's local ratings, genre preferences, and reading patterns. No cloud ML needed; collaborative filtering can run against the local SQLite database by matching genre/author/tag affinity scores. Start with "More by authors you love" and "Popular in genres you read" before adding similarity-based recommendations.

2. **Reading stats sharing** - Generate visually appealing stats cards (year-in-review, monthly reading, genre breakdown) as images that can be shared via the system share sheet. Low effort since the stats engine already exists; this just adds a rendering and export layer.

3. **Social feed (opt-in)** - An activity feed showing friends' recent reads, ratings, and reviews. This should be entirely opt-in with granular privacy controls (share ratings only, share reviews, share reading activity). Could leverage the `@mylife/social` package if built.

4. **Badge/achievement system** - Reading milestones (50 books, 10,000 pages), genre explorer badges (read from 10+ genres), streak badges (7-day, 30-day, 365-day reading streaks), and challenge completion badges. All computed locally from existing reading session data.

5. **Book clubs** - Group reading with discussion threads, shared reading pace tracking, and group ratings. Can start as a local feature (personal book club notes) and add sync later.

6. **Annual reading challenge (community)** - Extend the existing reading goals feature with optional community participation and anonymized leaderboards.

7. **Author following** - Follow favorite authors and get notified of new releases. Periodic polling of Open Library API for new works by followed author OLIDs.

## Privacy Competitive Advantage

Goodreads is owned by Amazon. Every book you mark as "want to read" feeds Amazon's product recommendation engine and advertising pipeline. Your reading habits are a deeply personal signal that reveals interests, beliefs, political leanings, and intellectual curiosities. Goodreads shares this data across Amazon's ecosystem.

Letterboxd (film) and Untappd (beer) both require cloud accounts and store all activity server-side.

MyBooks keeps all reading data in local SQLite. No advertiser knows what you read. No corporation builds a profile of your intellectual interests. The recommendation engine runs entirely on-device. Social features are opt-in with granular sharing controls, not opt-out with buried privacy settings.

This is a powerful marketing message: "Your reading list is nobody's business but yours."

## Cross-Module Integration

| Module | Integration |
|--------|------------|
| **MyJournal** | Reading reflections linked to specific books or reading sessions. Journal entries tagged with book context. |
| **MyHabits** | Reading streak as a trackable habit. Daily reading goal synced from MyBooks reading sessions. |
| **MyMood** | Correlate reading activity with mood entries. "You tend to read more when feeling calm." |
| **MyNutrition** | No direct integration. |
| **MyWorkouts** | No direct integration. |
