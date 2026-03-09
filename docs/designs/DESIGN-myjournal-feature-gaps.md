# MyJournal - Feature Gap Design Doc
**Source:** Competitive Feature Analysis (2026-03-05)
**Status:** Stub (navigation only)

## Current State
Stub module with navigation scaffolding only. No business logic, no database tables, no screens implemented.

## Competitors Analyzed

| Competitor | Pricing | Focus |
|-----------|---------|-------|
| Day One | $35-50/yr | Premium journaling with multimedia, location, cloud sync |
| Reflectly | $20-60/yr | AI-guided journaling with mood tracking |
| Grid Diary | $23/yr | Structured grid/mandala journaling prompts |
| Gratitude | $23/yr | Gratitude journaling, affirmations, vision boards |
| Stoic | $40/yr | Stoicism-based mental wellness journaling with CBT tools |

## Feature Gaps (Full Build Required)

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|--------------------------|-------|
| Rich text entries with photos | P0 | Day One, Gratitude, Stoic | Medium | Markdown editor with image embedding. Use expo-image-picker for camera/gallery |
| Multiple journals/notebooks | P0 | Day One | Low | Separate journals for different areas of life (work, personal, travel) |
| Tag-based organization | P0 | Day One | Low | Flexible tagging with autocomplete and multi-tag filtering |
| Streak tracking | P0 | Reflectly, Gratitude | Low | Consecutive days journaled. Calendar heatmap view |
| Search across entries | P0 | Day One | Medium | FTS5 full-text search on entry body, tags, and metadata |
| E2E encryption (on-device) | P0 | Day One (paid) | Medium | All entries encrypted at rest. Day One charges extra for this. MyJournal includes it free |
| PDF export | P0 | Grid Diary, Gratitude | Medium | Export single entries or date ranges as formatted PDF |
| On This Day (nostalgia) | P1 | Day One | Low | Show entries from the same date in previous years. Powerful retention feature |
| Voice-to-text entries | P1 | Day One, Gratitude, Stoic | Medium | Record audio, transcribe to text entry. Keep audio as attachment option |
| Automatic metadata (location, weather, music) | P1 | Day One | Medium | Capture context automatically when creating an entry. Weather via free API |
| AI-guided prompts (daily questions) | P1 | Reflectly, Stoic | Low | Rotating daily prompts to reduce blank-page anxiety. Can be on-device |
| Mood tracking per entry | P1 | Reflectly, Stoic | Low | Emoji or scale-based mood tagging on each entry |
| Gratitude prompts | P1 | Gratitude | Low | Dedicated gratitude mode with structured "3 things" template |
| Mood + entry correlation | P1 | Reflectly, Stoic | Medium | Analytics showing mood trends over time and correlation with journal topics |
| Grid/mandala layout option | P2 | Grid Diary | Medium | Alternative entry format with structured grid cells |
| Vision board | P2 | Gratitude | Medium | Image collage for goals and aspirations |
| Affirmations tracker | P2 | Gratitude, Stoic | Low | Daily affirmation display and tracking |
| Philosophy/stoic prompts | P2 | Stoic | Low | Daily Stoic quotes and reflection prompts |
| CBT thought records | P2 | Stoic | Medium | Cognitive Behavioral Therapy structured thought recording |
| Therapy prep templates | P2 | Stoic | Low | Pre-built templates for therapy session preparation |
| Printed books from entries | P2 | Day One | High | Generate physical book from journal entries via print partner |

## Recommended MVP Features

Minimal feature set to ship v1 of MyJournal:

1. **Rich text editor** - Markdown-based with photo embedding
2. **Multiple journals** - Create and switch between notebooks
3. **Tag system** - Apply multiple tags per entry with autocomplete
4. **Streak tracking** - Calendar heatmap showing journaling consistency
5. **Full-text search** - FTS5 search across all entries and tags
6. **On-device encryption** - All entries encrypted at rest in SQLite
7. **PDF export** - Export entries as formatted PDF documents

This MVP directly competes with Day One's core feature set while being completely free and private.

## Full Feature Roadmap

1. **v1.0 (MVP)** - Rich text entries, multiple journals, tags, streaks, search, encryption, PDF export
2. **v1.1** - On This Day nostalgia feature, mood tracking per entry, gratitude prompts
3. **v1.2** - Voice-to-text entries, automatic metadata capture (location, weather)
4. **v1.3** - AI-guided prompts (on-device), mood + entry correlation analytics
5. **v2.0** - Grid layout mode, vision board, affirmations tracker
6. **v2.1** - Stoic/philosophy prompts, CBT thought records, therapy prep templates
7. **v3.0** - Printed books from entries (partner integration)

## Privacy Competitive Advantage

Journaling is THE most privacy-sensitive app category. Users write their innermost thoughts, fears, dreams, and secrets. The competitive landscape has significant privacy concerns:

- **Day One** was acquired by Automattic (WordPress parent company). User journal data now sits in a corporate cloud infrastructure. E2E encryption is a paid upsell, meaning free users' most private thoughts are readable by the company.
- **Reflectly** and **Gratitude** store data in cloud services with standard (not E2E) encryption.
- **Stoic** collects mood and mental health data that could be sensitive if exposed.

MyJournal's positioning: **Your thoughts never leave your device.** Zero cloud, zero accounts, zero telemetry. E2E encryption included for free (not a paid feature). This is a genuine competitive moat in a category where privacy directly maps to user trust.

## Cross-Module Integration

| Module | Integration Point |
|--------|------------------|
| MyMood | Mood data recorded in journal entries feeds MyMood analytics. Bidirectional - MyMood trends can surface in journal insights |
| MyHealth | Health journaling for symptom tracking, wellness reflections. Health metrics can auto-populate as entry metadata |
| MyMeds | Medication side effect journaling. Link entries to medication logs for correlation |
| MyHabits | Daily journaling tracked as a habit. Streak data shared between modules |
| MyBooks | Reading reflections and book notes can be journal entries. Link entries to specific books |
