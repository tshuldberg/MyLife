import type { ModuleDefinition, Migration } from '@mylife/module-registry';
import {
  BASE_INDEXES,
  BASE_SETTINGS,
  BASE_TABLES,
  EXPANDED_INDEXES,
  EXPANDED_SETTINGS,
  EXPANDED_TABLES,
} from './db/schema';

const CLOSET_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Create closet items, outfits, wear logs, tags, and settings',
  up: [...BASE_TABLES, ...BASE_INDEXES, ...BASE_SETTINGS],
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

const CLOSET_MIGRATION_V2: Migration = {
  version: 2,
  description: 'Add laundry tracking, packing lists, and expanded closet settings',
  up: [...EXPANDED_TABLES, ...EXPANDED_INDEXES, ...EXPANDED_SETTINGS],
  down: [
    'DROP TABLE IF EXISTS cl_packing_list_items',
    'DROP TABLE IF EXISTS cl_packing_lists',
    'DROP TABLE IF EXISTS cl_laundry_events',
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
  migrations: [CLOSET_MIGRATION_V1, CLOSET_MIGRATION_V2],
  schemaVersion: 2,
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
      { name: 'packing-list', title: 'Packing List' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
