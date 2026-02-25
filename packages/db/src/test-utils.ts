import Database from 'better-sqlite3';
import type { Database as RawSqliteDatabase } from 'better-sqlite3';
import type { DatabaseAdapter, Migration } from './adapter';
import { createHubTables } from './hub-schema';
import { initializeHubDatabase, runModuleMigrations } from './migration-runner';

export interface InMemoryTestDatabase {
  adapter: DatabaseAdapter;
  raw: RawSqliteDatabase;
  close: () => void;
}

function createAdapter(raw: RawSqliteDatabase): DatabaseAdapter {
  return {
    execute(sql: string, params?: unknown[]): void {
      raw.prepare(sql).run(...(params ?? []));
    },
    query<T>(sql: string, params?: unknown[]): T[] {
      return raw.prepare(sql).all(...(params ?? [])) as T[];
    },
    transaction(fn: () => void): void {
      raw.transaction(fn)();
    },
  };
}

/**
 * Build a brand new in-memory SQLite database adapter for test usage.
 */
export function createInMemoryTestDatabase(): InMemoryTestDatabase {
  const raw = new Database(':memory:');
  raw.pragma('journal_mode = WAL');
  raw.pragma('foreign_keys = ON');

  return {
    adapter: createAdapter(raw),
    raw,
    close: () => raw.close(),
  };
}

/**
 * Build a fresh hub-only schema for tests that validate hub primitives directly.
 */
export function createHubTestDatabase(): InMemoryTestDatabase {
  const db = createInMemoryTestDatabase();
  createHubTables(db.adapter);
  return db;
}

/**
 * Build a fresh module-ready schema (hub initialized + module migrations applied).
 */
export function createModuleTestDatabase(
  moduleId: string,
  migrations: Migration[],
): InMemoryTestDatabase {
  const db = createInMemoryTestDatabase();
  initializeHubDatabase(db.adapter);
  runModuleMigrations(db.adapter, moduleId, migrations);
  return db;
}
