import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { NUTRITION_MODULE } from '../definition';

describe('nutrition schema', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('nutrition', NUTRITION_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
  });

  it('has correct module metadata', () => {
    expect(NUTRITION_MODULE.id).toBe('nutrition');
    expect(NUTRITION_MODULE.tier).toBe('premium');
    expect(NUTRITION_MODULE.storageType).toBe('sqlite');
    expect(NUTRITION_MODULE.tablePrefix).toBe('nu_');
    expect(NUTRITION_MODULE.accentColor).toBe('#F97316');
    expect(NUTRITION_MODULE.schemaVersion).toBe(3);
  });

  it('has 5 navigation tabs', () => {
    expect(NUTRITION_MODULE.navigation.tabs).toHaveLength(5);
    expect(NUTRITION_MODULE.navigation.tabs[0].key).toBe('diary');
  });

  it('has 5 screens', () => {
    expect(NUTRITION_MODULE.navigation.screens).toHaveLength(5);
  });

  it('creates all 9 tables', () => {
    const tables = adapter.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'nu_%' ORDER BY name",
    );
    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('nu_foods');
    expect(tableNames).toContain('nu_nutrients');
    expect(tableNames).toContain('nu_food_nutrients');
    expect(tableNames).toContain('nu_food_log');
    expect(tableNames).toContain('nu_food_log_items');
    expect(tableNames).toContain('nu_daily_goals');
    expect(tableNames).toContain('nu_settings');
    expect(tableNames).toContain('nu_barcode_cache');
    expect(tableNames).toContain('nu_photo_log');
  });

  it('creates FTS5 virtual table', () => {
    const tables = adapter.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = 'nu_foods_fts'",
    );
    expect(tables).toHaveLength(1);
  });

  it('creates indexes', () => {
    const indexes = adapter.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'nu_%'",
    );
    expect(indexes.length).toBeGreaterThanOrEqual(10);
  });

  it('seeds default settings', () => {
    const settings = adapter.query<{ key: string; value: string }>(
      'SELECT key, value FROM nu_settings',
    );
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    expect(map.defaultMealType).toBe('lunch');
    expect(map.calorieGoal).toBe('2000');
  });

  it('seeds USDA nutrient definitions', () => {
    const count = adapter.query<{ c: number }>(
      'SELECT COUNT(*) as c FROM nu_nutrients',
    )[0].c;
    expect(count).toBeGreaterThanOrEqual(70);
  });

  it('seeds USDA food data', () => {
    const count = adapter.query<{ c: number }>(
      "SELECT COUNT(*) as c FROM nu_foods WHERE source = 'usda'",
    )[0].c;
    expect(count).toBeGreaterThanOrEqual(80);
  });

  it('has FTS triggers', () => {
    const triggers = adapter.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'nu_foods_%'",
    );
    const names = triggers.map((t) => t.name);
    expect(names).toContain('nu_foods_ai');
    expect(names).toContain('nu_foods_ad');
    expect(names).toContain('nu_foods_au');
  });
});
