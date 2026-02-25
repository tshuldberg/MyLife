/**
 * Migration runner for the MyLife hub database.
 *
 * Tracks per-module schema versions in hub_schema_versions.
 * Only runs pending migrations for the specified module.
 * Each migration set is wrapped in a transaction.
 */

import type { DatabaseAdapter, Migration } from './adapter';
import { createHubTables } from './hub-schema';

/**
 * Get the current schema version for a module.
 * Returns 0 if no migrations have been applied yet.
 */
function getModuleVersion(db: DatabaseAdapter, moduleId: string): number {
  const rows = db.query<{ version: number }>(
    `SELECT MAX(version) as version FROM hub_schema_versions WHERE module_id = ?`,
    [moduleId],
  );
  return rows[0]?.version ?? 0;
}

/**
 * Record that a migration version was applied for a module.
 */
function recordVersion(
  db: DatabaseAdapter,
  moduleId: string,
  version: number,
): void {
  db.execute(
    `INSERT INTO hub_schema_versions (module_id, version) VALUES (?, ?)`,
    [moduleId, version],
  );
}

/**
 * Run all pending migrations for a specific module.
 *
 * Ensures hub tables exist first, then checks hub_schema_versions
 * to determine which migrations are pending. Each migration is
 * executed inside a transaction.
 *
 * @param db - Database adapter
 * @param moduleId - Module identifier (e.g. 'hub', 'mybooks', 'mybudget')
 * @param migrations - Ordered list of migrations for this module
 * @returns Number of migrations applied
 */
export function runModuleMigrations(
  db: DatabaseAdapter,
  moduleId: string,
  migrations: Migration[],
): number {
  // Ensure hub infrastructure tables exist
  createHubTables(db);

  // Enable foreign keys
  db.execute('PRAGMA foreign_keys = ON;');

  const currentVersion = getModuleVersion(db, moduleId);
  const pending = migrations.filter((m) => m.version > currentVersion);

  if (pending.length === 0) return 0;

  let applied = 0;
  for (const migration of pending) {
    db.transaction(() => {
      for (const sql of migration.up) {
        db.execute(sql);
      }
      recordVersion(db, moduleId, migration.version);
    });
    applied++;
  }

  return applied;
}

/**
 * Initialize the hub database with its own schema.
 * Hub tables use the module_id 'hub' for version tracking.
 *
 * @returns Object with the final version and number of migrations applied
 */
export function initializeHubDatabase(db: DatabaseAdapter): {
  version: number;
  migrationsApplied: number;
} {
  // Hub tables are created via createHubTables (IF NOT EXISTS),
  // so the "hub" module's migration is just ensuring they exist.
  const HUB_MIGRATION: Migration = {
    version: 1,
    description: 'Create hub infrastructure tables',
    up: [], // Tables created by createHubTables above
    down: [],
  };

  // Ensure hub tables exist first (idempotent)
  createHubTables(db);
  db.execute('PRAGMA foreign_keys = ON;');

  const currentVersion = getModuleVersion(db, 'hub');
  if (currentVersion >= 1) {
    return { version: currentVersion, migrationsApplied: 0 };
  }

  // Record hub v1 in schema_versions
  db.transaction(() => {
    recordVersion(db, 'hub', HUB_MIGRATION.version);
  });

  return { version: 1, migrationsApplied: 1 };
}
