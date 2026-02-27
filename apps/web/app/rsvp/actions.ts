'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  addEventCohost,
  addPhoto,
  approveInviteRequest,
  checkInRsvp,
  createAnnouncement,
  createComment,
  createEvent,
  createInvite,
  createPoll,
  createQuestion,
  exportAttendanceCsv,
  getAnnouncementsByEvent,
  getCommentsByEvent,
  getEventAnalytics,
  getEventCohosts,
  getEventLinksByEvent,
  getEvents,
  getInvitesByEvent,
  getPhotosByEvent,
  getPollVotes,
  getPollsByEvent,
  getQuestionsByEvent,
  getRsvpSummary,
  getRsvpsByEvent,
  moveInviteToWaitlist,
  recordRsvp,
  saveQuestionResponse,
  setEventLink,
  votePollOption,
  type LinkType,
  type PollOption,
  type RsvpResponse,
} from '@mylife/rsvp';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('rsvp');
  return adapter;
}

export async function fetchEvents() {
  return getEvents(db(), { includePast: true });
}

export async function doCreateEvent(
  id: string,
  input: {
    title: string;
    startAt: string;
    locationName?: string;
  },
) {
  createEvent(db(), id, {
    title: input.title,
    startAt: input.startAt,
    locationName: input.locationName,
    visibility: 'private',
    requiresApproval: true,
    waitlistEnabled: true,
    allowPlusOnes: true,
    allowPolls: true,
    allowPhotoAlbum: true,
    allowComments: true,
    allowChipIn: true,
    createdBy: 'Host',
  });
}

export async function fetchEventBundle(eventId: string) {
  const adapter = db();

  return {
    cohosts: getEventCohosts(adapter, eventId),
    invites: getInvitesByEvent(adapter, eventId),
    rsvps: getRsvpsByEvent(adapter, eventId),
    questions: getQuestionsByEvent(adapter, eventId),
    polls: getPollsByEvent(adapter, eventId),
    announcements: getAnnouncementsByEvent(adapter, eventId),
    comments: getCommentsByEvent(adapter, eventId),
    photos: getPhotosByEvent(adapter, eventId),
    links: getEventLinksByEvent(adapter, eventId),
    summary: getRsvpSummary(adapter, eventId),
    analytics: getEventAnalytics(adapter, eventId),
  };
}

export async function fetchPollVotes(pollId: string) {
  return getPollVotes(db(), pollId);
}

export async function doAddCohost(id: string, eventId: string, name: string) {
  addEventCohost(db(), id, eventId, { name, role: 'Cohost' });
}

export async function doAddInvite(
  id: string,
  eventId: string,
  input: {
    inviteeName: string;
    inviteeContact?: string;
    plusOneLimit?: number;
  },
) {
  createInvite(db(), id, eventId, {
    inviteeName: input.inviteeName,
    inviteeContact: input.inviteeContact,
    inviteeType: input.inviteeContact?.includes('@') ? 'email' : 'link',
    plusOneLimit: input.plusOneLimit ?? 0,
    status: 'requested',
  });
}

export async function doApproveInvite(inviteId: string) {
  approveInviteRequest(db(), inviteId);
}

export async function doWaitlistInvite(inviteId: string) {
  moveInviteToWaitlist(db(), inviteId);
}

export async function doRecordRsvp(
  id: string,
  eventId: string,
  input: {
    inviteId?: string;
    guestName: string;
    guestContact?: string;
    response: RsvpResponse;
    plusOnesCount?: number;
  },
) {
  recordRsvp(db(), id, eventId, {
    inviteId: input.inviteId,
    guestName: input.guestName,
    guestContact: input.guestContact,
    response: input.response,
    plusOnesCount: input.plusOnesCount,
    source: 'web',
  });
}

export async function doCheckInRsvp(rsvpId: string) {
  checkInRsvp(db(), rsvpId);
}

export async function doCreateQuestion(
  id: string,
  eventId: string,
  input: {
    label: string;
  },
) {
  createQuestion(db(), id, eventId, {
    label: input.label,
    type: 'text',
  });
}

export async function doSaveQuestionResponse(
  id: string,
  eventId: string,
  rsvpId: string,
  questionId: string,
  answer: string,
) {
  saveQuestionResponse(db(), id, eventId, rsvpId, questionId, answer);
}

export async function doCreatePoll(
  id: string,
  eventId: string,
  input: {
    question: string;
    options: PollOption[];
  },
) {
  createPoll(db(), id, eventId, {
    question: input.question,
    options: input.options,
    multipleChoice: false,
  });
}

export async function doVotePollOption(
  id: string,
  pollId: string,
  input: {
    optionId: string;
    rsvpId?: string;
    guestName?: string;
  },
) {
  votePollOption(db(), id, pollId, input);
}

export async function doCreateAnnouncement(
  id: string,
  eventId: string,
  message: string,
) {
  createAnnouncement(db(), id, eventId, {
    message,
    sendChannel: 'all',
  });
}

export async function doCreateComment(
  id: string,
  eventId: string,
  input: {
    guestName: string;
    message: string;
    rsvpId?: string;
  },
) {
  createComment(db(), id, eventId, input);
}

export async function doAddPhoto(
  id: string,
  eventId: string,
  input: {
    guestName: string;
    photoUrl: string;
    rsvpId?: string;
  },
) {
  addPhoto(db(), id, eventId, input);
}

export async function doAddLink(
  id: string,
  eventId: string,
  input: {
    type: LinkType;
    label: string;
    url: string;
  },
) {
  setEventLink(db(), id, eventId, input);
}

export async function exportAttendanceCsvAction(eventId: string) {
  return exportAttendanceCsv(db(), eventId);
}
