import { useCallback } from 'react';
import { useModuleRegistry, type ModuleId } from '@mylife/module-registry';
import { enableModule, disableModule, runModuleMigrations } from '@mylife/db';
import { BOOKS_MODULE } from '@mylife/books';
import { FAST_MODULE } from '@mylife/fast';
import { SUBS_MODULE } from '@mylife/subs';
import { BUDGET_MODULE } from '@mylife/budget';
import { SURF_MODULE } from '@mylife/surf';
import { RECIPES_MODULE } from '@mylife/recipes';
import { WORKOUTS_MODULE } from '@mylife/workouts';
import { HOMES_MODULE } from '@mylife/homes';
import { CAR_MODULE } from '@mylife/car';
import { HABITS_MODULE } from '@mylife/habits';
import { MEDS_MODULE } from '@mylife/meds';
import { useDatabase } from '../components/DatabaseProvider';

/**
 * Map of module IDs to their full definitions (with migrations).
 * Only modules with actual migrations need to be listed here.
 */
const MODULE_DEFINITIONS_WITH_MIGRATIONS: Partial<Record<ModuleId, { migrations?: { version: number; description: string; up: string[]; down: string[] }[] }>> = {
  books: BOOKS_MODULE,
  fast: FAST_MODULE,
  subs: SUBS_MODULE,
  budget: BUDGET_MODULE,
  surf: SURF_MODULE,
  recipes: RECIPES_MODULE,
  workouts: WORKOUTS_MODULE,
  homes: HOMES_MODULE,
  car: CAR_MODULE,
  habits: HABITS_MODULE,
  meds: MEDS_MODULE,
};

/**
 * Hook that toggles a module's enabled state in both the in-memory
 * registry and the SQLite hub_enabled_modules table. When enabling,
 * also runs the module's migrations if it has any.
 */
export function useModuleToggle() {
  const registry = useModuleRegistry();
  const db = useDatabase();

  const toggle = useCallback(
    (id: ModuleId) => {
      if (registry.isEnabled(id)) {
        // Disable: remove from SQLite, then update registry
        disableModule(db, id);
        registry.disable(id);
      } else {
        // Enable: persist to SQLite, run migrations, then update registry
        enableModule(db, id);

        const moduleDef = MODULE_DEFINITIONS_WITH_MIGRATIONS[id];
        if (moduleDef?.migrations) {
          runModuleMigrations(db, id, moduleDef.migrations);
        }

        registry.enable(id);
      }
    },
    [registry, db],
  );

  return toggle;
}
