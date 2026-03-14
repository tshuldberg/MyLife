import type { ModuleDefinition } from '@mylife/module-registry';
import { CACHE_TABLES, CACHE_INDEXES } from './db/schema';

export const FORUMS_MODULE: ModuleDefinition = {
  id: 'forums',
  name: 'MyForums',
  tagline: 'Community discussions, your way',
  icon: '\u{1F4AC}',
  accentColor: '#F43F5E',
  tier: 'free',
  storageType: 'supabase',
  schemaVersion: 1,
  tablePrefix: 'fr_',
  migrations: [
    {
      version: 1,
      description: 'Create local cache tables for offline browsing of communities, threads, and replies',
      up: [...CACHE_TABLES, ...CACHE_INDEXES],
      down: [
        'DROP TABLE IF EXISTS fr_tags_cache',
        'DROP TABLE IF EXISTS fr_bookmarks_cache',
        'DROP TABLE IF EXISTS fr_replies_cache',
        'DROP TABLE IF EXISTS fr_threads_cache',
        'DROP TABLE IF EXISTS fr_community_members_cache',
        'DROP TABLE IF EXISTS fr_communities_cache',
      ],
    },
  ],
  navigation: {
    tabs: [
      { key: 'feed', label: 'Feed', icon: 'newspaper' },
      { key: 'communities', label: 'Communities', icon: 'users' },
      { key: 'search', label: 'Search', icon: 'search' },
      { key: 'saved', label: 'Saved', icon: 'bookmark' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'community-detail', title: 'Community' },
      { name: 'thread-detail', title: 'Thread' },
      { name: 'create-thread', title: 'New Thread' },
      { name: 'create-community', title: 'New Community' },
      { name: 'community-settings', title: 'Settings' },
      { name: 'mod-log', title: 'Mod Log' },
      { name: 'user-profile', title: 'Profile' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: true,
  version: '0.1.0',
};
