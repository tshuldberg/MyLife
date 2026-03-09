import type { ModuleDefinition } from '@mylife/module-registry';
import type { Migration } from '@mylife/module-registry';
import {
  ALL_TABLES,
  CREATE_INDEXES,
  ALTER_SPOTS_V2,
  V2_TABLES,
  V2_INDEXES,
  V3_TABLES,
  V3_INDEXES,
} from './db/schema';

const SURF_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial surf schema -- spots and sessions',
  up: [...ALL_TABLES, ...CREATE_INDEXES],
  down: [
    'DROP TABLE IF EXISTS sf_sessions',
    'DROP TABLE IF EXISTS sf_spots',
  ],
};

const SURF_MIGRATION_V2: Migration = {
  version: 2,
  description: 'Enrich spots + add forecast/buoy/tide/narrative cache tables',
  up: [...ALTER_SPOTS_V2, ...V2_TABLES, ...V2_INDEXES],
  down: [
    'DROP TABLE IF EXISTS sf_narratives',
    'DROP TABLE IF EXISTS sf_buoy_readings',
    'DROP TABLE IF EXISTS sf_tides',
    'DROP TABLE IF EXISTS sf_swell_components',
    'DROP TABLE IF EXISTS sf_forecasts',
  ],
};

const SURF_MIGRATION_V3: Migration = {
  version: 3,
  description: 'User pins, alerts, community, session waves, trail hikes',
  up: [...V3_TABLES, ...V3_INDEXES],
  down: [
    'DROP TABLE IF EXISTS sf_trail_hike_summaries',
    'DROP TABLE IF EXISTS sf_session_waves',
    'DROP TABLE IF EXISTS sf_spot_guides',
    'DROP TABLE IF EXISTS sf_spot_photos',
    'DROP TABLE IF EXISTS sf_spot_reviews',
    'DROP TABLE IF EXISTS sf_alert_notifications',
    'DROP TABLE IF EXISTS sf_alert_rules',
    'DROP TABLE IF EXISTS sf_spot_alerts',
    'DROP TABLE IF EXISTS sf_user_pins',
  ],
};

export const SURF_MODULE: ModuleDefinition = {
  id: 'surf',
  name: 'MySurf',
  tagline: 'Surf forecasts and spot intel',
  icon: '\u{1F3C4}',
  accentColor: '#3B82F6',
  tier: 'premium',
  storageType: 'supabase',
  migrations: [SURF_MIGRATION_V1, SURF_MIGRATION_V2, SURF_MIGRATION_V3],
  schemaVersion: 3,
  tablePrefix: 'sf_',
  navigation: {
    tabs: [
      { key: 'forecast', label: 'Forecast', icon: 'cloud' },
      { key: 'map', label: 'Map', icon: 'map' },
      { key: 'spots', label: 'Spots', icon: 'map-pin' },
      { key: 'alerts', label: 'Alerts', icon: 'bell' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'spot-detail', title: 'Spot Details' },
      { name: 'buoy-detail', title: 'Buoy Data' },
      { name: 'session-log', title: 'Session Log' },
    ],
  },
  requiresAuth: true,
  requiresNetwork: false,
  version: '0.3.0',
};
