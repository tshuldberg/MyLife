# MyForums - Feature Gap Design Doc
**Source:** Social Module Design Sprint (2026-03-10)
**Status:** Spec Complete, Not Implemented

## Current State

MyForums is a newly specified module (not yet implemented). It adds privacy-first community discussion forums to the MyLife hub. The spec defines 30 features across 3 implementation phases, 16 Supabase tables with full RLS policies, and integration points with the existing `@mylife/social` package and 10 other MyLife modules.

No standalone app exists. MyForums is designed as a hub-native module from the start.

## Competitors Analyzed

| Competitor | Price | Category | Key Strength |
|-----------|-------|----------|-------------|
| Reddit | Free (ads) | General forums | Massive community, subreddit model, mature moderation |
| Discourse | Free (self-hosted) / $100+/mo (hosted) | Forum software | Trust levels, excellent moderation, long-form discussion |
| Lemmy | Free (open source) | Federated forums | Decentralized, no corporate control, ActivityPub |
| Hacker News | Free | Tech forums | Clean UI, quality discussion culture, karma system |
| Discord | Free / $10/mo | Chat + forums | Real-time, voice, screen sharing, community building |

## Feature Gaps vs Competitors

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|--------------------------|-------|
| Real-time chat within threads | P3 | Discord | High | Live chat alongside threaded discussion. Out of scope for MVP; would require WebSocket infrastructure beyond Supabase Realtime. |
| Wiki/knowledge base per community | P3 | Discourse, Reddit | Medium | Community-managed wiki pages for FAQs and reference. Could leverage MyNotes module engine. |
| Post scheduling | P3 | Reddit (mod tools) | Low | Schedule posts for future publication. Useful for community managers. |
| Custom community themes | P3 | Reddit, Discord | Medium | Per-community color schemes and banners. Low priority since Cool Obsidian provides a consistent hub experience. |
| Crossposting | P2 | Reddit | Low | Share a thread to multiple communities. Simple join table addition. |
| Award/badge system | P2 | Reddit (awards) | Medium | Community-specific or global badges for contributions. Could integrate with @mylife/social challenges. |
| Content filtering/AutoMod | P2 | Reddit, Discourse | High | Automated keyword/regex filtering for spam and rule violations. Discourse's trust levels are excellent but complex. |
| Sticky megathreads | P2 | Reddit | Low | Weekly/monthly auto-generated megathreads (e.g., "Weekly Recipe Exchange"). Timer-based sticky rotation. |
| Image galleries in posts | P2 | Reddit, Discord | Medium | Multi-image posts with lightbox. Requires Supabase Storage integration. |
| Voice/video discussion rooms | P3 | Discord | Very High | Live audio/video rooms. Far out of scope; would need WebRTC infrastructure. |
| RSS feed per community | P3 | Discourse | Low | Generate RSS/Atom feeds for communities. Useful for power users. |
| Email notifications | P2 | Discourse, Reddit | Medium | Email digests for thread replies and mentions. Requires email sending infrastructure. |
| Markdown preview (split pane) | P1 | Discourse | Low | Live preview while composing markdown posts. Pure client-side feature. |
| @mention autocomplete | P1 | Discord, Discourse | Low | Autocomplete usernames when typing @. Query social_profiles. |

## Recommended Features to Build (Post-MVP)

1. **@mention autocomplete** (P1, Low difficulty) - Pure client-side feature. Query `social_profiles` by handle prefix as the user types. Insert `@handle` into markdown body. Trigger a `mention` notification on post creation.

2. **Markdown preview (split pane)** (P1, Low difficulty) - Show a live-rendered preview alongside the editor when composing threads or replies. Uses the same markdown renderer as thread display. Mobile: toggle between edit/preview tabs. Web: side-by-side split pane.

3. **Crossposting** (P2, Low difficulty) - Add an `fr_crossposts` join table linking a thread to additional communities. Crossposted threads show a "crossposted from community-name" banner. Same thread ID, multiple community listings.

4. **Sticky megathreads** (P2, Low difficulty) - Allow moderators to create auto-recurring sticky threads (weekly, monthly). A Supabase scheduled function creates new megathreads and unpins expired ones. Useful for recurring community events like "Weekly Recipe Exchange" or "Monthly Reading Goals".

5. **Content filtering/AutoMod** (P2, High difficulty) - Configurable per-community keyword and regex filters. Posts matching filters are auto-flagged for mod review or auto-removed. Start with simple keyword matching before adding regex support. No ML-based content analysis (privacy-first principle).

6. **Award/badge system** (P2, Medium difficulty) - Global badges for forum milestones (100 karma, 50 threads, 500 replies). Community-specific flair awarded by moderators. Integrates with the `@mylife/social` challenges system for cross-module achievements.

7. **Image galleries** (P2, Medium difficulty) - Multi-image uploads in threads using Supabase Storage. Lightbox viewing on click. Image compression and thumbnail generation via Supabase Edge Function. Max 10 images per thread, 5MB per image.

## Privacy Competitive Advantage

Every major forum platform monetizes user data:
- **Reddit** serves targeted ads based on subreddit subscriptions and browsing patterns. User data was sold for AI training ($60M/year to Google).
- **Discord** collects message content, voice data, and behavioral patterns. Third-party data sharing for "service improvement".
- **Facebook Groups** feeds the Meta advertising ecosystem. Everything you post informs your ad profile.

MyForums keeps all discussion data in the user's Supabase instance with no data sharing, no ad targeting, and no AI training on user content. Moderation is transparent and community-driven, not algorithmic.

The value proposition: "Your discussions belong to your community, not to advertisers."

## Cross-Module Integration

| Module | Integration |
|--------|------------|
| **MyBooks** | Linked `book-club` community. Threads can reference specific books with inline preview cards. "Discuss this book" button on book detail screen. |
| **MyRecipes** | Linked `recipe-exchange` community. Threads reference specific recipes. "Share to community" action from recipe detail. |
| **MyWorkouts** | Linked `workout-advice` community. Threads reference workout plans or exercises. Progress photo sharing in threads. |
| **MySurf** | Linked `surf-report` community. Threads reference surf spots. Inline surf condition cards. |
| **MyBudget** | Linked `budget-tips` community. No entity linking (financial data is privacy-sensitive). General discussion only. |
| **MyNutrition** | Linked `nutrition-talk` community. Threads can reference food items or meal plans. |
| **MyFast** | Linked `fasting-community` community. Threads can reference fasting protocols. |
| **MyPets** | Linked `pet-owners` community. Threads can reference pet profiles. Photo sharing emphasis. |
| **MyGarden** | Linked `garden-talk` community. Threads reference plants. Seasonal discussion megathreads. |
| **@mylife/social** | Activity feed integration (thread_created, reply_posted, karma_milestone). Leaderboard scoring. Share cards for threads and reputation milestones. |

## Technical Debt / Risks

1. **ModuleId expansion** - Adding `'forums'` to the `ModuleId` union type requires updating `packages/module-registry/src/types.ts`. This is a registry-level change that all modules compile against.

2. **Karma recalculation** - The current trigger-based karma update recalculates from a UNION of all votes. At scale (100K+ votes per user), this becomes expensive. Consider switching to incremental karma updates (+1/-1) instead of full recalculation.

3. **Nested RLS queries** - Several RLS policies use nested subqueries (e.g., "get my profile ID, then check membership"). These should be tested under load to ensure acceptable query performance. Consider creating helper SQL functions for common patterns.

4. **Anonymous posting audit** - Anonymous posts store the real `author_id` for moderation. This creates a privacy tension: moderators can see who posted anonymously. Document this clearly in the community rules and consider a "trusted anonymous" mode where even mods cannot see the author (only system admins in abuse cases).

5. **Supabase Storage for media** - Image attachments require Supabase Storage configuration (buckets, size limits, CDN). This infrastructure is shared with MySurf (spot photos) and should be standardized across modules.
