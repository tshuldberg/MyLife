import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'path';
import type { DatabaseAdapter } from '@mylife/db';
import {
  initializeHubDatabase,
  runModuleMigrations,
  getHubMode,
  setHubMode,
} from '@mylife/db';
import { BOOKS_MODULE } from '@mylife/books';
import { FAST_MODULE } from '@mylife/fast';
import { SUBS_MODULE } from '@mylife/subs';
import { BUDGET_MODULE } from '@mylife/budget';
import { RECIPES_MODULE } from '@mylife/recipes';
import { CAR_MODULE } from '@mylife/car';
import { HABITS_MODULE } from '@mylife/habits';
import { MEDS_MODULE } from '@mylife/meds';
import { SURF_MODULE } from '@mylife/surf';
import { WORKOUTS_MODULE } from '@mylife/workouts';
import { HOMES_MODULE } from '@mylife/homes';

let adapter: DatabaseAdapter | null = null;

/**
 * Singleton better-sqlite3 adapter for the web app.
 * Stores the database file in the project root as mylife-hub.db.
 * Server-only — cannot be imported from client components.
 */
export function getAdapter(): DatabaseAdapter {
  if (adapter) return adapter;

  const configuredPath = process.env.MYLIFE_DB_PATH?.trim();
  const dbPath = configuredPath
    ? (path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath))
    : path.join(process.cwd(), 'mylife-hub.db');
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  adapter = {
    execute(sql: string, params?: unknown[]): void {
      db.prepare(sql).run(...(params ?? []));
    },
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
      return db.prepare(sql).all(...(params ?? [])) as T[];
    },
    transaction(fn: () => void): void {
      db.transaction(fn)();
    },
  };

  // Initialize hub tables on first connection
  initializeHubDatabase(adapter);
  if (!getHubMode(adapter)) {
    setHubMode(adapter, 'local_only');
  }

  return adapter;
}

/**
 * Map of module IDs to their full definitions (with migrations).
 */
const MODULE_DEFINITIONS_WITH_MIGRATIONS = {
  books: BOOKS_MODULE,
  fast: FAST_MODULE,
  subs: SUBS_MODULE,
  budget: BUDGET_MODULE,
  recipes: RECIPES_MODULE,
  car: CAR_MODULE,
  habits: HABITS_MODULE,
  meds: MEDS_MODULE,
  surf: SURF_MODULE,
  workouts: WORKOUTS_MODULE,
  homes: HOMES_MODULE,
} as const;

/**
 * Ensure a module's migrations have been run.
 * Called when enabling a module for the first time.
 */
export function ensureModuleMigrations(moduleId: string): void {
  const db = getAdapter();
  const moduleDef = MODULE_DEFINITIONS_WITH_MIGRATIONS[moduleId as keyof typeof MODULE_DEFINITIONS_WITH_MIGRATIONS];
  if (moduleDef?.migrations) {
    runModuleMigrations(db, moduleId, moduleDef.migrations);
  }
}
