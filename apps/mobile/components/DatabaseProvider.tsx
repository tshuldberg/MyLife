import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  openDatabaseSync,
  type SQLiteDatabase,
  type SQLiteBindParams,
} from 'expo-sqlite';
import {
  type DatabaseAdapter,
  initializeHubDatabase,
  runModuleMigrations,
  getEnabledModules,
  getHubMode,
  setHubMode,
} from '@mylife/db';
import { BOOKS_MODULE } from '@mylife/books';
import { FAST_MODULE } from '@mylife/fast';
import { BUDGET_MODULE } from '@mylife/budget';
import { SURF_MODULE } from '@mylife/surf';
import { RECIPES_MODULE } from '@mylife/recipes';
import { WORKOUTS_MODULE } from '@mylife/workouts';
import { HOMES_MODULE } from '@mylife/homes';
import { CAR_MODULE } from '@mylife/car';
import { HABITS_MODULE } from '@mylife/habits';
import { MEDS_MODULE } from '@mylife/meds';
import { RSVP_MODULE } from '@mylife/rsvp';
import type { ModuleRegistry, ModuleId } from '@mylife/module-registry';
import { colors } from '@mylife/ui';

/** Wraps expo-sqlite to implement the DatabaseAdapter interface from @mylife/db. */
function createExpoAdapter(db: SQLiteDatabase): DatabaseAdapter {
  return {
    execute(sql: string, params?: unknown[]): void {
      db.runSync(sql, (params ?? []) as SQLiteBindParams);
    },
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
      return db.getAllSync(sql, (params ?? []) as SQLiteBindParams) as T[];
    },
    transaction(fn: () => void): void {
      db.withTransactionSync(fn);
    },
  };
}

/**
 * Map of module IDs to their full definitions (with migrations).
 * Only modules with actual migrations need to be listed here.
 */
const MODULE_DEFINITIONS_WITH_MIGRATIONS = {
  books: BOOKS_MODULE,
  fast: FAST_MODULE,
  budget: BUDGET_MODULE,
  surf: SURF_MODULE,
  recipes: RECIPES_MODULE,
  workouts: WORKOUTS_MODULE,
  homes: HOMES_MODULE,
  car: CAR_MODULE,
  habits: HABITS_MODULE,
  meds: MEDS_MODULE,
  rsvp: RSVP_MODULE,
} as const;

const DatabaseContext = createContext<DatabaseAdapter | null>(null);

/** Access the hub database adapter from any component in the tree. */
export function useDatabase(): DatabaseAdapter {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return db;
}

interface DatabaseProviderProps {
  children: React.ReactNode;
  registry: ModuleRegistry;
}

/**
 * Opens the hub SQLite database, syncs enabled module state from SQLite
 * into the ModuleRegistry, runs module migrations, and provides the
 * DatabaseAdapter to the component tree via context.
 */
export function DatabaseProvider({ children, registry }: DatabaseProviderProps) {
  const [adapter, setAdapter] = useState<DatabaseAdapter | null>(null);

  useEffect(() => {
    const db = openDatabaseSync('mylife-hub.db');
    const dbAdapter = createExpoAdapter(db);

    // 1. Initialize hub tables
    initializeHubDatabase(dbAdapter);

    // Ensure a default mode row exists for runtime mode selection.
    if (!getHubMode(dbAdapter)) {
      setHubMode(dbAdapter, 'local_only');
    }

    // 2. Sync enabled modules from SQLite into registry
    const enabledRows = getEnabledModules(dbAdapter);
    for (const row of enabledRows) {
      registry.enable(row.module_id as ModuleId);
    }

    // 3. Run migrations for enabled modules
    for (const row of enabledRows) {
      const moduleDef = MODULE_DEFINITIONS_WITH_MIGRATIONS[row.module_id as keyof typeof MODULE_DEFINITIONS_WITH_MIGRATIONS];
      if (moduleDef?.migrations) {
        runModuleMigrations(dbAdapter, row.module_id, moduleDef.migrations);
      }
    }

    setAdapter(dbAdapter);
  }, [registry]);

  if (!adapter) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={adapter}>
      {children}
    </DatabaseContext.Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
