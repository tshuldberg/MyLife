import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { RSVP_MODULE } from '../definition';
import {
  addEventCohost,
  approveInviteRequest,
  createAnnouncement,
  createComment,
  createEvent,
  createInvite,
  createPoll,
  createQuestion,
  exportAttendanceCsv,
  getEventAnalytics,
  getEventById,
  getEventCohosts,
  getInvitesByEvent,
  getPollVotes,
  getQuestionsByEvent,
  getRsvpSummary,
  getRsvpsByEvent,
  recordRsvp,
  saveQuestionResponse,
  votePollOption,
} from '../db/crud';

describe('@mylife/rsvp', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('rsvp', RSVP_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
  });

  it('defines module metadata', () => {
    expect(RSVP_MODULE.id).toBe('rsvp');
    expect(RSVP_MODULE.tablePrefix).toBe('rv_');
    expect(RSVP_MODULE.navigation.tabs).toHaveLength(5);
  });

  it('creates event, invites, responses, and derives analytics', () => {
    createEvent(adapter, 'event-1', {
      title: 'Summer Rooftop Party',
      startAt: '2026-07-10T22:00:00.000Z',
      locationName: 'Skyline Roof',
      visibility: 'private',
      requiresApproval: true,
      waitlistEnabled: true,
    });

    const event = getEventById(adapter, 'event-1');
    expect(event).not.toBeNull();
    expect(event?.title).toBe('Summer Rooftop Party');

    addEventCohost(adapter, 'cohost-1', 'event-1', {
      name: 'Alex',
      role: 'Door + check-in',
    });
    expect(getEventCohosts(adapter, 'event-1')).toHaveLength(1);

    createInvite(adapter, 'invite-1', 'event-1', {
      inviteeName: 'Trey',
      inviteeContact: 'trey@example.com',
      inviteeType: 'email',
      plusOneLimit: 1,
      status: 'requested',
    });
    approveInviteRequest(adapter, 'invite-1');

    createInvite(adapter, 'invite-2', 'event-1', {
      inviteeName: 'Jordan',
      inviteeType: 'sms',
      status: 'invited',
    });

    const invites = getInvitesByEvent(adapter, 'event-1');
    expect(invites).toHaveLength(2);
    expect(invites.find((invite) => invite.id === 'invite-1')?.status).toBe('approved');

    recordRsvp(adapter, 'rsvp-1', 'event-1', {
      inviteId: 'invite-1',
      guestName: 'Trey',
      guestContact: 'trey@example.com',
      response: 'going',
      plusOnesCount: 1,
      source: 'link',
    });

    recordRsvp(adapter, 'rsvp-2', 'event-1', {
      inviteId: 'invite-2',
      guestName: 'Jordan',
      response: 'maybe',
      source: 'app',
    });

    const responses = getRsvpsByEvent(adapter, 'event-1');
    expect(responses).toHaveLength(2);

    const summary = getRsvpSummary(adapter, 'event-1');
    expect(summary.approved).toBe(1);
    expect(summary.invited).toBe(1);
    expect(summary.going).toBe(1);
    expect(summary.maybe).toBe(1);
    expect(summary.plusOnes).toBe(1);

    createQuestion(adapter, 'question-1', 'event-1', {
      label: 'Dietary restrictions?',
      type: 'dietary',
      required: true,
    });
    expect(getQuestionsByEvent(adapter, 'event-1')).toHaveLength(1);

    saveQuestionResponse(adapter, 'answer-1', 'event-1', 'rsvp-1', 'question-1', 'Vegetarian');

    createPoll(adapter, 'poll-1', 'event-1', {
      question: 'Best arrival window?',
      options: [
        { id: 'opt-1', label: '7:00 PM' },
        { id: 'opt-2', label: '8:00 PM' },
      ],
      multipleChoice: false,
    });

    votePollOption(adapter, 'vote-1', 'poll-1', {
      rsvpId: 'rsvp-1',
      optionId: 'opt-1',
    });
    votePollOption(adapter, 'vote-2', 'poll-1', {
      rsvpId: 'rsvp-1',
      optionId: 'opt-2',
    });

    // Single-choice poll keeps one latest vote per voter.
    const votes = getPollVotes(adapter, 'poll-1');
    expect(votes).toHaveLength(1);
    expect(votes[0]?.optionId).toBe('opt-2');

    createAnnouncement(adapter, 'announce-1', 'event-1', {
      message: 'Reminder: dress code is rooftop casual.',
      sendChannel: 'all',
    });

    createComment(adapter, 'comment-1', 'event-1', {
      guestName: 'Trey',
      message: 'Can I bring sparkling water?',
      rsvpId: 'rsvp-1',
    });

    const analytics = getEventAnalytics(adapter, 'event-1');
    expect(analytics.responses).toBe(2);
    expect(analytics.announcements).toBe(1);
    expect(analytics.comments).toBe(1);

    const csv = exportAttendanceCsv(adapter, 'event-1');
    expect(csv).toContain('Guest Name');
    expect(csv).toContain('Trey');
    expect(csv).toContain('Jordan');
  });
});
