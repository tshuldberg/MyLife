import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './db/schema';

const RSVP_MIGRATION_V1: Migration = {
  version: 1,
  description:
    'Initial RSVP schema - events, invites, RSVPs, polls, announcements, comments, album, links, settings',
  up: [...ALL_TABLES, ...CREATE_INDEXES, ...SEED_SETTINGS],
  down: [
    'DROP TABLE IF EXISTS rv_event_links',
    'DROP TABLE IF EXISTS rv_photos',
    'DROP TABLE IF EXISTS rv_comments',
    'DROP TABLE IF EXISTS rv_announcements',
    'DROP TABLE IF EXISTS rv_poll_votes',
    'DROP TABLE IF EXISTS rv_polls',
    'DROP TABLE IF EXISTS rv_question_responses',
    'DROP TABLE IF EXISTS rv_questions',
    'DROP TABLE IF EXISTS rv_rsvps',
    'DROP TABLE IF EXISTS rv_invites',
    'DROP TABLE IF EXISTS rv_event_cohosts',
    'DROP TABLE IF EXISTS rv_settings',
    'DROP TABLE IF EXISTS rv_events',
  ],
};

export const RSVP_MODULE: ModuleDefinition = {
  id: 'rsvp',
  name: 'MyRSVP',
  tagline: 'Events, invites, and RSVP tracking',
  icon: '\u{1F48C}',
  accentColor: '#FB7185',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [RSVP_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'rv_',
  navigation: {
    tabs: [
      { key: 'events', label: 'Events', icon: 'calendar' },
      { key: 'guests', label: 'Guests', icon: 'users' },
      { key: 'polls', label: 'Polls', icon: 'bar-chart' },
      { key: 'feed', label: 'Feed', icon: 'message-circle' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'event-detail', title: 'Event Details' },
      { name: 'invite-management', title: 'Invites' },
      { name: 'check-in', title: 'Check-in' },
      { name: 'photo-album', title: 'Photo Album' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
