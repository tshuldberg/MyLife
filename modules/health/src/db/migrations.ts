import type { Migration } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS } from './schema';

/**
 * MyHealth migration v1 -- additive only.
 *
 * Creates 8 new hl_-prefixed tables + indexes + default settings.
 * Does NOT touch existing md_*, ft_*, or cy_* tables from absorbed modules.
 * Those tables are read/written directly by MyHealth business logic.
 */
export const HEALTH_MIGRATION_V1: Migration = {
  version: 1,
  description: 'Initial health schema -- documents, vitals, sleep, sync log, goals, emergency info, settings',
  up: [
    ...ALL_TABLES,
    ...CREATE_INDEXES,
    ...SEED_SETTINGS,
  ],
  down: [
    'DROP TABLE IF EXISTS hl_goal_progress',
    'DROP TABLE IF EXISTS hl_goals',
    'DROP TABLE IF EXISTS hl_sleep_sessions',
    'DROP TABLE IF EXISTS hl_sync_log',
    'DROP TABLE IF EXISTS hl_vitals',
    'DROP TABLE IF EXISTS hl_documents',
    'DROP TABLE IF EXISTS hl_emergency_info',
    'DROP TABLE IF EXISTS hl_settings',
  ],
};
