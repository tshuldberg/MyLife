# MyMood - Feature Gap Design Doc
**Source:** Competitive Feature Analysis (2026-03-05)
**Status:** Stub (navigation only)

## Current State
Stub module with navigation scaffolding only. No business logic, no database tables, no screens implemented.

Note: MyMeds already has mood journaling and symptom logging. MyMood should be the standalone mood tracking module that feeds data into the cross-module correlation engine.

## Competitors Analyzed

| App | Pricing | Focus |
|-----|---------|-------|
| Daylio | $36/yr | Mood journaling with activity tracking |
| Finch | $15-70/yr | Gamified self-care with virtual pet |
| Bearable | $35/yr | Symptom and mood correlation tracker |
| Calm | $80/yr | Meditation and relaxation |
| Headspace | $70/yr | Guided meditation and mindfulness |

## Feature Gaps (Full Build Required)

### P0 - MVP Features

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|---------------------------|-------|
| Quick mood logging (emoji/scale) | P0 | Daylio, Finch, Bearable | Low | One-tap mood entry with 5-point scale and emoji |
| Activity tagging | P0 | Daylio | Low | Log what you were doing when you logged mood (exercise, work, social, etc.) |
| Daily mood timeline | P0 | Daylio | Medium | See mood changes throughout the day |
| Mood trends/charts | P0 | Daylio, Bearable | Medium | Weekly/monthly mood trends with averages |
| Notes with mood entries | P0 | Daylio | Low | Add text context to mood logs |
| Streak tracking | P0 | Daylio | Low | Track consecutive days of mood logging |

### P1 Features

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|---------------------------|-------|
| Mood-activity correlation | P1 | Daylio, Bearable | High | Which activities improve/worsen mood |
| Year in Pixels | P1 | Daylio | Medium | Calendar grid where each day is colored by mood |
| Custom activities/factors | P1 | Bearable | Medium | Track custom factors (caffeine, social time, screen time, etc.) |
| Custom experiments | P1 | Bearable | High | A/B test lifestyle changes ("Does meditation improve my mood?") |
| Photo/voice attachments | P1 | Daylio | Medium | Attach photos or voice memos to mood entries |
| Guided breathing exercises | P1 | Calm, Headspace, Finch | Medium | Box breathing, 4-7-8, coherent breathing |
| PIN/biometric lock | P1 | Daylio | Low | Extra security for sensitive mood data |

### P2 Features

| Feature | Priority | Competitors That Have It | Implementation Difficulty | Notes |
|---------|----------|--------------------------|---------------------------|-------|
| Virtual pet gamification | P2 | Finch | High | Virtual pet that grows healthier with consistent mood logging and self-care |
| Self-care task suggestions | P2 | Finch | Medium | Daily self-care activities based on mood |
| Guided meditation sessions | P2 | Calm, Headspace | High | Audio-guided mindfulness (could share with MyHealth) |
| Focus music/ambient sounds | P2 | Calm, Headspace | High | Brown noise, rain, nature sounds for focus/relaxation |
| SOS/panic button | P2 | Headspace | Medium | Quick calming exercise for anxiety moments |
| Daily mood insights (AI) | P2 | Reflectly | High | AI-generated insights about mood patterns |
| Weekly/monthly reports | P2 | Bearable | Medium | Shareable mood reports (for therapist or personal use) |

## Recommended MVP Features

Minimal feature set to ship v1:
1. Quick mood logging with 5-point emoji scale (one-tap entry)
2. Activity tagging with preset categories (exercise, work, social, sleep, etc.)
3. Free-text notes attached to mood entries
4. Daily mood timeline view showing entries throughout the day
5. Weekly and monthly mood trend charts with rolling averages
6. Streak tracking for consecutive logging days
7. SQLite storage with `mm_` table prefix

## Full Feature Roadmap

1. **v1.0 - Core Mood Tracking** (P0): Quick logging, activity tags, notes, daily timeline, trend charts, streaks
2. **v1.1 - Correlation Engine** (P1): Mood-activity correlation analysis, custom activities/factors, Year in Pixels calendar view
3. **v1.2 - Experiments and Privacy** (P1): Custom experiments (A/B lifestyle testing), photo/voice attachments, PIN/biometric lock
4. **v1.3 - Wellness Tools** (P1): Guided breathing exercises (box breathing, 4-7-8, coherent breathing)
5. **v2.0 - Gamification and AI** (P2): Virtual pet gamification, self-care task suggestions, AI-generated daily mood insights
6. **v2.1 - Meditation and Focus** (P2): Guided meditation sessions, focus music/ambient sounds, SOS/panic button
7. **v2.2 - Reports** (P2): Weekly/monthly shareable reports, therapist export format

## Privacy Competitive Advantage

Bearable has been criticized for clinical data access. Calm and Headspace collect behavioral data including session timing, usage patterns, and engagement metrics. Daylio is one of the better options for privacy (local-first with PIN lock), but still offers optional cloud sync.

MyMood matches Daylio's privacy stance with richer correlation capabilities through the MyLife hub. Mood data is deeply personal and often clinically sensitive. Keeping mood logs, activity correlations, and mental health patterns fully on-device is a meaningful differentiator. No cloud account required, no behavioral analytics, no data monetization.

The cross-module correlation engine lets users discover mood patterns (mood + exercise, mood + sleep, mood + medication) without any of that data leaving their device.

## Cross-Module Integration

| Module | Integration |
|--------|-------------|
| **MyMeds** | Mood-medication correlation already exists in MyMeds engine. MyMood provides the mood data source. |
| **MyHealth** | Mood as a health metric. Share mood data for holistic health dashboard. |
| **MyHabits** | Mood-habit correlation. Show how habit streaks affect mood over time. |
| **MyJournal** | Mood-based prompts for journaling. "You logged a low mood today. Would you like to write about it?" |
| **MyWorkouts** | Exercise-mood correlation. Track how different workout types affect mood. |
| **MyFast** | Fasting-mood correlation. Track mood during and after fasting windows. |
| **MyBooks** | Reading-mood correlation. Track how reading sessions affect mood. |
