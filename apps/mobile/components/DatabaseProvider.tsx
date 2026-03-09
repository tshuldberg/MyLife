import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, type AppStateStatus, View, ActivityIndicator, Text, Pressable, StyleSheet } from 'react-native';
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
import { FLASH_MODULE } from '@mylife/flash';
import { GARDEN_MODULE } from '@mylife/garden';
import { BUDGET_MODULE } from '@mylife/budget';
import { SURF_MODULE } from '@mylife/surf';
import { RECIPES_MODULE } from '@mylife/recipes';
import { WORKOUTS_MODULE } from '@mylife/workouts';
import { HOMES_MODULE } from '@mylife/homes';
import { CAR_MODULE } from '@mylife/car';
import { CLOSET_MODULE } from '@mylife/closet';
import { CYCLE_MODULE } from '@mylife/cycle';
import { HABITS_MODULE } from '@mylife/habits';
import { MEDS_MODULE } from '@mylife/meds';
import { MOOD_MODULE } from '@mylife/mood';
import { NOTES_MODULE } from '@mylife/notes';
import { HEALTH_MODULE } from '@mylife/health';
import { NUTRITION_MODULE } from '@mylife/nutrition';
import { JOURNAL_MODULE } from '@mylife/journal';
import { PETS_MODULE } from '@mylife/pets';
import { RSVP_MODULE } from '@mylife/rsvp';
import { STARS_MODULE } from '@mylife/stars';
import { TRAILS_MODULE } from '@mylife/trails';
import { VOICE_MODULE } from '@mylife/voice';
import { MAIL_MODULE } from '@mylife/mail';
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
  flash: FLASH_MODULE,
  budget: BUDGET_MODULE,
  surf: SURF_MODULE,
  recipes: RECIPES_MODULE,
  workouts: WORKOUTS_MODULE,
  homes: HOMES_MODULE,
  car: CAR_MODULE,
  closet: CLOSET_MODULE,
  cycle: CYCLE_MODULE,
  habits: HABITS_MODULE,
  meds: MEDS_MODULE,
  mood: MOOD_MODULE,
  notes: NOTES_MODULE,
  garden: GARDEN_MODULE,
  health: HEALTH_MODULE,
  nutrition: NUTRITION_MODULE,
  journal: JOURNAL_MODULE,
  pets: PETS_MODULE,
  rsvp: RSVP_MODULE,
  stars: STARS_MODULE,
  trails: TRAILS_MODULE,
  voice: VOICE_MODULE,
  mail: MAIL_MODULE,
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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    try {
      const db = openDatabaseSync('mylife-hub.db');
      const dbAdapter = createExpoAdapter(db);

      // Enable WAL mode for better concurrent read/write performance
      db.runSync('PRAGMA journal_mode=WAL;');

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

      // 3. Run migrations for all known module schemas.
      // This prevents missing-table crashes when a module route loads before enable-state sync.
      // Each module is wrapped individually so one failure doesn't block others.
      // If a migration fails, the module is disabled in the registry to prevent routing
      // to screens that depend on missing tables.
      const moduleEntries = Object.entries(MODULE_DEFINITIONS_WITH_MIGRATIONS) as Array<[
        string,
        { migrations?: { version: number; description: string; up: string[]; down: string[] }[] }
      ]>;
      const migrationErrors: string[] = [];
      for (const [moduleId, moduleDef] of moduleEntries) {
        if (moduleDef.migrations) {
          try {
            runModuleMigrations(dbAdapter, moduleId, moduleDef.migrations);
          } catch (migErr) {
            const msg = migErr instanceof Error ? migErr.message : String(migErr);
            migrationErrors.push(`${moduleId}: ${msg}`);
            console.error(`[MyLife] Migration failed for module "${moduleId}":`, migErr);
            // Disable the module so users can't navigate to broken screens
            registry.disable(moduleId as ModuleId);
          }
        }
      }

      // 4. Run a quick integrity check to detect database corruption early
      try {
        const integrityResult = dbAdapter.query<{ integrity_check: string }>(
          'PRAGMA integrity_check(1)',
        );
        const result = integrityResult[0]?.integrity_check;
        if (result && result !== 'ok') {
          console.error('[MyLife] Database integrity check failed:', result);
        }
      } catch (integrityErr) {
        console.error('[MyLife] Could not run integrity check:', integrityErr);
      }

      if (migrationErrors.length > 0) {
        console.warn(
          `[MyLife] ${migrationErrors.length} module migration(s) failed. Affected modules have been disabled.`,
        );
      }

      setError(null);
      setAdapter(dbAdapter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MyLife] Database initialization failed:', err);
      setError(msg);
    }
  }, [registry, retryCount]);

  // Test DB connection on foreground resume to detect stale connections
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && adapter) {
        try {
          adapter.query('SELECT 1');
        } catch (err) {
          console.error('[MyLife] DB connection stale after resume:', err);
          setRetryCount((c) => c + 1);
        }
      }
    });
    return () => subscription.remove();
  }, [adapter]);

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          MyLife couldn't open its database. This can happen if your device is low on storage.
        </Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => setRetryCount((c) => c + 1)}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

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
    padding: 32,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  errorDetail: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Courier',
    opacity: 0.7,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
