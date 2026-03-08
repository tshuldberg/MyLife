import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './db/schema';

const CLOSET_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Create closet items, outfits, wear logs, tags, and settings',
  up: [...ALL_TABLES, ...CREATE_INDEXES, ...SEED_SETTINGS],
  down: [
    'DROP TABLE IF EXISTS cl_settings',
    'DROP TABLE IF EXISTS cl_item_tags',
    'DROP TABLE IF EXISTS cl_tags',
    'DROP TABLE IF EXISTS cl_wear_log_items',
    'DROP TABLE IF EXISTS cl_wear_logs',
    'DROP TABLE IF EXISTS cl_outfit_items',
    'DROP TABLE IF EXISTS cl_outfits',
    'DROP TABLE IF EXISTS cl_items',
  ],
};

export const CLOSET_MODULE: ModuleDefinition = {
  id: 'closet',
  name: 'MyCloset',
  tagline: 'Your wardrobe, fully private',
  icon: '👗',
  accentColor: '#E879A8',
  tier: 'premium',
  storageType: 'sqlite',
  migrations: [CLOSET_MIGRATION_V1],
  schemaVersion: 1,
  tablePrefix: 'cl_',
  navigation: {
    tabs: [
      { key: 'wardrobe', label: 'Wardrobe', icon: 'shirt' },
      { key: 'outfits', label: 'Outfits', icon: 'layers' },
      { key: 'calendar', label: 'Calendar', icon: 'calendar' },
      { key: 'stats', label: 'Stats', icon: 'bar-chart-2' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'item-detail', title: 'Item' },
      { name: 'outfit-detail', title: 'Outfit' },
      { name: 'add-item', title: 'Add Item' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
