import type { DatabaseAdapter } from '@mylife/db';
import type { Habit, Completion, StreakInfo } from '../types';

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    icon: (row.icon as string) ?? null,
    color: (row.color as string) ?? null,
    frequency: row.frequency as Habit['frequency'],
    targetCount: row.target_count as number,
    unit: (row.unit as string) ?? null,
    isArchived: !!(row.is_archived as number),
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToCompletion(row: Record<string, unknown>): Completion {
  return {
    id: row.id as string,
    habitId: row.habit_id as string,
    completedAt: row.completed_at as string,
    value: (row.value as number) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export function createHabit(
  db: DatabaseAdapter,
  id: string,
  input: { name: string; frequency?: string; targetCount?: number; icon?: string; color?: string },
): void {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO hb_habits (id, name, frequency, target_count, icon, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.name, input.frequency ?? 'daily', input.targetCount ?? 1, input.icon ?? null, input.color ?? null, now, now],
  );
}

export function getHabits(db: DatabaseAdapter, opts?: { isArchived?: boolean }): Habit[] {
  if (opts?.isArchived !== undefined) {
    return db.query<Record<string, unknown>>(
      'SELECT * FROM hb_habits WHERE is_archived = ? ORDER BY sort_order ASC, name ASC',
      [opts.isArchived ? 1 : 0],
    ).map(rowToHabit);
  }
  return db.query<Record<string, unknown>>('SELECT * FROM hb_habits ORDER BY sort_order ASC, name ASC').map(rowToHabit);
}

export function getHabitById(db: DatabaseAdapter, id: string): Habit | null {
  const rows = db.query<Record<string, unknown>>('SELECT * FROM hb_habits WHERE id = ?', [id]);
  return rows.length > 0 ? rowToHabit(rows[0]) : null;
}

export function updateHabit(db: DatabaseAdapter, id: string, updates: Partial<{ name: string; frequency: string; targetCount: number; icon: string; color: string; isArchived: boolean; sortOrder: number }>): void {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (updates.name !== undefined) { sets.push('name = ?'); params.push(updates.name); }
  if (updates.frequency !== undefined) { sets.push('frequency = ?'); params.push(updates.frequency); }
  if (updates.targetCount !== undefined) { sets.push('target_count = ?'); params.push(updates.targetCount); }
  if (updates.icon !== undefined) { sets.push('icon = ?'); params.push(updates.icon); }
  if (updates.color !== undefined) { sets.push('color = ?'); params.push(updates.color); }
  if (updates.isArchived !== undefined) { sets.push('is_archived = ?'); params.push(updates.isArchived ? 1 : 0); }
  if (updates.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(updates.sortOrder); }
  if (sets.length === 0) return;
  sets.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);
  db.execute(`UPDATE hb_habits SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function deleteHabit(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM hb_habits WHERE id = ?', [id]);
}

export function countHabits(db: DatabaseAdapter): number {
  return (db.query<{ c: number }>('SELECT COUNT(*) as c FROM hb_habits')[0]).c;
}

// ---------------------------------------------------------------------------
// Completions
// ---------------------------------------------------------------------------

export function recordCompletion(
  db: DatabaseAdapter,
  id: string,
  habitId: string,
  completedAt: string,
  value?: number,
): void {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO hb_completions (id, habit_id, completed_at, value, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, habitId, completedAt, value ?? null, now],
  );
}

export function getCompletions(db: DatabaseAdapter, habitId: string, opts?: { from?: string; to?: string }): Completion[] {
  let sql = 'SELECT * FROM hb_completions WHERE habit_id = ?';
  const params: unknown[] = [habitId];
  if (opts?.from) { sql += ' AND completed_at >= ?'; params.push(opts.from); }
  if (opts?.to) { sql += ' AND completed_at <= ?'; params.push(opts.to); }
  sql += ' ORDER BY completed_at DESC';
  return db.query<Record<string, unknown>>(sql, params).map(rowToCompletion);
}

export function getCompletionsForDate(db: DatabaseAdapter, date: string): Completion[] {
  return db.query<Record<string, unknown>>(
    `SELECT * FROM hb_completions WHERE completed_at LIKE ? ORDER BY completed_at ASC`,
    [`${date}%`],
  ).map(rowToCompletion);
}

export function deleteCompletion(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM hb_completions WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export function getStreaks(db: DatabaseAdapter, habitId: string): StreakInfo {
  const rows = db.query<{ d: string }>(
    `SELECT DISTINCT DATE(completed_at) as d FROM hb_completions WHERE habit_id = ? ORDER BY d DESC`,
    [habitId],
  );
  if (rows.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dates = rows.map((r) => r.d);
  let currentStreak = 1;
  let longestStreak = 1;
  let streak = 1;

  const today = new Date().toISOString().slice(0, 10);
  const isCurrentDay = dates[0] === today;
  if (!isCurrentDay) currentStreak = 0;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
      if (i < dates.length && (isCurrentDay || i > 0)) {
        if (isCurrentDay && i <= streak) currentStreak = streak;
      }
    } else {
      streak = 1;
    }
    if (streak > longestStreak) longestStreak = streak;
  }
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  return { currentStreak, longestStreak };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSetting(db: DatabaseAdapter, key: string): string | undefined {
  const rows = db.query<{ value: string }>('SELECT value FROM hb_settings WHERE key = ?', [key]);
  return rows.length > 0 ? rows[0].value : undefined;
}

export function setSetting(db: DatabaseAdapter, key: string, value: string): void {
  db.execute(
    `INSERT INTO hb_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value],
  );
}
