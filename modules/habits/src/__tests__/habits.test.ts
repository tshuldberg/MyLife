import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { HABITS_MODULE } from '../definition';
import {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  countHabits,
  recordCompletion,
  getCompletions,
  getCompletionsForDate,
  deleteCompletion,
  getStreaks,
  getSetting,
  setSetting,
} from '../db/crud';

describe('@mylife/habits', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('habits', HABITS_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
  });

  describe('HABITS_MODULE definition', () => {
    it('has correct metadata', () => {
      expect(HABITS_MODULE.id).toBe('habits');
      expect(HABITS_MODULE.tier).toBe('premium');
      expect(HABITS_MODULE.storageType).toBe('sqlite');
      expect(HABITS_MODULE.tablePrefix).toBe('hb_');
    });

    it('has 4 navigation tabs', () => {
      expect(HABITS_MODULE.navigation.tabs).toHaveLength(4);
    });
  });

  describe('seeded data', () => {
    it('has default settings', () => {
      expect(getSetting(adapter, 'weekStartsOn')).toBe('monday');
    });
  });

  describe('habits CRUD', () => {
    it('starts empty', () => {
      expect(countHabits(adapter)).toBe(0);
    });

    it('creates and retrieves a habit', () => {
      createHabit(adapter, 'h1', { name: 'Meditate' });
      expect(countHabits(adapter)).toBe(1);
      const h = getHabitById(adapter, 'h1');
      expect(h).not.toBeNull();
      expect(h!.name).toBe('Meditate');
      expect(h!.frequency).toBe('daily');
      expect(h!.targetCount).toBe(1);
    });

    it('lists habits filtering by archived', () => {
      createHabit(adapter, 'h1', { name: 'Active' });
      createHabit(adapter, 'h2', { name: 'Archived' });
      updateHabit(adapter, 'h2', { isArchived: true });
      expect(getHabits(adapter, { isArchived: false })).toHaveLength(1);
      expect(getHabits(adapter, { isArchived: true })).toHaveLength(1);
      expect(getHabits(adapter)).toHaveLength(2);
    });

    it('updates a habit', () => {
      createHabit(adapter, 'h1', { name: 'Old' });
      updateHabit(adapter, 'h1', { name: 'New', targetCount: 3 });
      const h = getHabitById(adapter, 'h1');
      expect(h!.name).toBe('New');
      expect(h!.targetCount).toBe(3);
    });

    it('deletes a habit', () => {
      createHabit(adapter, 'h1', { name: 'Test' });
      deleteHabit(adapter, 'h1');
      expect(countHabits(adapter)).toBe(0);
    });
  });

  describe('completions', () => {
    it('records and retrieves completions', () => {
      createHabit(adapter, 'h1', { name: 'Exercise' });
      recordCompletion(adapter, 'c1', 'h1', '2026-01-15T08:00:00Z');
      recordCompletion(adapter, 'c2', 'h1', '2026-01-16T08:00:00Z');
      const completions = getCompletions(adapter, 'h1');
      expect(completions).toHaveLength(2);
    });

    it('filters completions by date range', () => {
      createHabit(adapter, 'h1', { name: 'Read' });
      recordCompletion(adapter, 'c1', 'h1', '2026-01-10T08:00:00Z');
      recordCompletion(adapter, 'c2', 'h1', '2026-01-20T08:00:00Z');
      const results = getCompletions(adapter, 'h1', { from: '2026-01-15' });
      expect(results).toHaveLength(1);
    });

    it('gets completions for a specific date', () => {
      createHabit(adapter, 'h1', { name: 'Run' });
      recordCompletion(adapter, 'c1', 'h1', '2026-01-15T08:00:00Z');
      recordCompletion(adapter, 'c2', 'h1', '2026-01-16T08:00:00Z');
      const results = getCompletionsForDate(adapter, '2026-01-15');
      expect(results).toHaveLength(1);
    });

    it('deletes a completion', () => {
      createHabit(adapter, 'h1', { name: 'Test' });
      recordCompletion(adapter, 'c1', 'h1', '2026-01-15T08:00:00Z');
      deleteCompletion(adapter, 'c1');
      expect(getCompletions(adapter, 'h1')).toHaveLength(0);
    });
  });

  describe('streaks', () => {
    it('returns zero for no completions', () => {
      createHabit(adapter, 'h1', { name: 'Test' });
      const streaks = getStreaks(adapter, 'h1');
      expect(streaks.currentStreak).toBe(0);
      expect(streaks.longestStreak).toBe(0);
    });
  });

  describe('settings', () => {
    it('updates a setting', () => {
      setSetting(adapter, 'weekStartsOn', 'sunday');
      expect(getSetting(adapter, 'weekStartsOn')).toBe('sunday');
    });
  });
});
