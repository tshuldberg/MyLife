import type { DatabaseAdapter } from '@mylife/db';
import type {
  WorkoutFocus,
  WorkoutLog,
  WorkoutMetrics,
  WorkoutProgram,
} from '../types';

function rowToWorkoutLog(row: Record<string, unknown>): WorkoutLog {
  return {
    id: row.id as string,
    name: row.name as string,
    focus: row.focus as WorkoutFocus,
    durationMin: row.duration_min as number,
    calories: row.calories as number,
    rpe: row.rpe as number,
    completedAt: row.completed_at as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToWorkoutProgram(row: Record<string, unknown>): WorkoutProgram {
  return {
    id: row.id as string,
    name: row.name as string,
    goal: row.goal as string,
    weeks: row.weeks as number,
    sessionsPerWeek: row.sessions_per_week as number,
    isActive: !!(row.is_active as number),
    createdAt: row.created_at as string,
  };
}

export function createWorkoutLog(
  db: DatabaseAdapter,
  id: string,
  input: {
    name: string;
    focus: WorkoutFocus;
    durationMin: number;
    calories?: number;
    rpe?: number;
    completedAt: string;
    notes?: string;
  },
): void {
  db.execute(
    `INSERT INTO wk_workout_logs (
      id, name, focus, duration_min, calories, rpe, completed_at, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.focus,
      input.durationMin,
      input.calories ?? 0,
      input.rpe ?? 7,
      input.completedAt,
      input.notes ?? null,
      new Date().toISOString(),
    ],
  );
}

export function getWorkoutLogs(
  db: DatabaseAdapter,
  options?: {
    focus?: WorkoutFocus;
    limit?: number;
  },
): WorkoutLog[] {
  const params: unknown[] = [];
  let sql = 'SELECT * FROM wk_workout_logs';

  if (options?.focus) {
    sql += ' WHERE focus = ?';
    params.push(options.focus);
  }

  sql += ' ORDER BY completed_at DESC';

  if (options?.limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  return db.query<Record<string, unknown>>(sql, params).map(rowToWorkoutLog);
}

export function deleteWorkoutLog(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM wk_workout_logs WHERE id = ?', [id]);
}

export function createWorkoutProgram(
  db: DatabaseAdapter,
  id: string,
  input: {
    name: string;
    goal: string;
    weeks: number;
    sessionsPerWeek: number;
    isActive?: boolean;
  },
): void {
  if (input.isActive) {
    db.execute('UPDATE wk_programs SET is_active = 0');
  }
  db.execute(
    `INSERT INTO wk_programs (
      id, name, goal, weeks, sessions_per_week, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.goal,
      input.weeks,
      input.sessionsPerWeek,
      input.isActive ? 1 : 0,
      new Date().toISOString(),
    ],
  );
}

export function getWorkoutPrograms(db: DatabaseAdapter): WorkoutProgram[] {
  return db
    .query<Record<string, unknown>>(
      'SELECT * FROM wk_programs ORDER BY is_active DESC, created_at DESC',
    )
    .map(rowToWorkoutProgram);
}

export function setActiveWorkoutProgram(
  db: DatabaseAdapter,
  id: string | null,
): void {
  db.transaction(() => {
    db.execute('UPDATE wk_programs SET is_active = 0');
    if (id) {
      db.execute('UPDATE wk_programs SET is_active = 1 WHERE id = ?', [id]);
    }
  });
}

export function deleteWorkoutProgram(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM wk_programs WHERE id = ?', [id]);
}

export function getWorkoutMetrics(
  db: DatabaseAdapter,
  days = 30,
): WorkoutMetrics {
  const rows = db.query<{
    workouts: number;
    total_minutes: number | null;
    total_calories: number | null;
    average_rpe: number | null;
  }>(
    `SELECT
       COUNT(*) as workouts,
       SUM(duration_min) as total_minutes,
       SUM(calories) as total_calories,
       AVG(rpe) as average_rpe
     FROM wk_workout_logs
     WHERE completed_at >= datetime('now', ?)` ,
    [`-${days} days`],
  );

  const row = rows[0];
  return {
    workouts: row?.workouts ?? 0,
    totalMinutes: row?.total_minutes ?? 0,
    totalCalories: row?.total_calories ?? 0,
    averageRpe: row?.average_rpe ?? 0,
  };
}
