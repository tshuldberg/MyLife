import type { ModuleDefinition } from '@mylife/module-registry';
import { CACHE_TABLES, CACHE_INDEXES } from './db/schema';

export const MARKET_MODULE: ModuleDefinition = {
  id: 'market',
  name: 'MyMarket',
  tagline: 'Buy, sell, and trade with your community',
  icon: '\u{1F3EA}',
  accentColor: '#E11D48',
  tier: 'free',
  storageType: 'supabase',
  schemaVersion: 2,
  tablePrefix: 'mk_',
  migrations: [
    {
      version: 1,
      description: 'Create local cache tables for offline browsing of listings, categories, and conversations',
      up: [...CACHE_TABLES, ...CACHE_INDEXES],
      down: [
        'DROP TABLE IF EXISTS mk_messages_cache',
        'DROP TABLE IF EXISTS mk_conversations_cache',
        'DROP TABLE IF EXISTS mk_watchlist_cache',
        'DROP TABLE IF EXISTS mk_listing_photos_cache',
        'DROP TABLE IF EXISTS mk_listings_cache',
        'DROP TABLE IF EXISTS mk_categories_cache',
      ],
    },
    {
      version: 2,
      description: 'Upgrade Market cache for service listings and encrypted message envelopes',
      up: [
        'ALTER TABLE mk_listings_cache ADD COLUMN IF NOT EXISTS fulfillment_type TEXT',
        'ALTER TABLE mk_listings_cache ADD COLUMN IF NOT EXISTS service_radius_miles INTEGER',
        'ALTER TABLE mk_listings_cache ADD COLUMN IF NOT EXISTS availability_notes TEXT',
        'ALTER TABLE mk_messages_cache ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT \'text/plain\'',
        'ALTER TABLE mk_messages_cache ADD COLUMN IF NOT EXISTS ciphertext TEXT',
        'ALTER TABLE mk_messages_cache ADD COLUMN IF NOT EXISTS encryption_algorithm TEXT',
        'ALTER TABLE mk_messages_cache ADD COLUMN IF NOT EXISTS encryption_salt TEXT',
        'ALTER TABLE mk_messages_cache ADD COLUMN IF NOT EXISTS encryption_iv TEXT',
      ],
      down: [],
    },
  ],
  navigation: {
    tabs: [
      { key: 'browse', label: 'Browse', icon: 'search' },
      { key: 'sell', label: 'Sell', icon: 'plus-circle' },
      { key: 'messages', label: 'Messages', icon: 'message-circle' },
      { key: 'saved', label: 'Saved', icon: 'heart' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'listing-detail', title: 'Listing' },
      { name: 'create-listing', title: 'New Listing' },
      { name: 'edit-listing', title: 'Edit Listing' },
      { name: 'chat-thread', title: 'Chat' },
      { name: 'category-browser', title: 'Categories' },
      { name: 'search-results', title: 'Search' },
      { name: 'seller-profile', title: 'Seller' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: true,
  version: '0.1.0',
};
