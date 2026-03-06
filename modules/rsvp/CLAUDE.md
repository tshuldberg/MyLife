# @mylife/rsvp

## Overview

Event planning and RSVP tracking module. Create events with invites, RSVPs, custom questions, polls, announcements, comments, photo albums, co-host management, waitlists, check-in, and analytics. Full event lifecycle from creation through post-event photo sharing. All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `RSVP_MODULE` | ModuleDefinition | Module registration contract (id: `rsvp`, prefix: `rv_`, tier: premium) |
| `EventSchema` / `Event` | Zod schema + type | Event record (title, datetime, location, visibility, capacity, feature toggles) |
| `InviteSchema` / `Invite` | Zod schema + type | Invite with status tracking |
| `RsvpSchema` / `Rsvp` | Zod schema + type | RSVP response with plus-ones and check-in |
| `PollSchema` / `Poll` | Zod schema + type | Event polls with voting |
| `AnnouncementSchema` / `Announcement` | Zod schema + type | Event announcements with send tracking |
| `EventCommentSchema` / `EventComment` | Zod schema + type | Event feed comments |
| `EventPhotoSchema` / `EventPhoto` | Zod schema + type | Photo album entries |
| `EventLinkSchema` / `EventLink` | Zod schema + type | External links (registry, venue, etc.) |
| `RsvpSummary`, `EventAnalytics` | Types | Summary and analytics aggregations |
| CRUD functions | Functions | Full CRUD for events, co-hosts, invites, RSVPs, questions, polls, announcements, comments, photos, links |
| Analytics | Functions | `getRsvpSummary`, `getEventAnalytics`, `exportAttendanceCsv` |

## Storage

- **Type:** sqlite
- **Table prefix:** `rv_`
- **Schema version:** 1
- **Key tables:** `rv_events`, `rv_event_cohosts`, `rv_settings`, `rv_invites`, `rv_rsvps`, `rv_questions`, `rv_question_responses`, `rv_polls`, `rv_poll_votes`, `rv_announcements`, `rv_comments`, `rv_photos`, `rv_event_links`

## Engines

- **db/crud.ts** -- RSVP summary aggregation, event analytics, attendance CSV export, invite approval/waitlist management, poll closing, check-in tracking

## Schemas

- `EventVisibilitySchema`, `InviteStatusSchema`, `RsvpResponseSchema`, `QuestionTypeSchema`, `AnnouncementChannelSchema`, `LinkTypeSchema`, `PollOptionSchema`
- `EventSchema`, `EventCohostSchema`, `InviteSchema`, `RsvpSchema`
- `EventQuestionSchema`, `QuestionResponseSchema`
- `PollSchema`, `PollVoteSchema`
- `AnnouncementSchema`, `EventCommentSchema`, `EventPhotoSchema`, `EventLinkSchema`

## Test Coverage

- **Test files:** 1
- **Covered:** Core CRUD for events, invites, RSVPs, questions, polls, announcements, comments, photos, links, co-hosts, analytics (`__tests__/rsvp.test.ts`)
- **Gaps:** Waitlist edge cases, capacity enforcement, check-in flow

## Parity Status

- **Standalone repo:** MyRSVP (exists in MyLife submodule directory)
- **Hub integration:** wired

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 13 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All Zod schemas and TypeScript types
- `src/db/crud.ts` -- All CRUD operations, analytics, CSV export
- `src/db/schema.ts` -- CREATE TABLE statements
