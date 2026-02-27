import type { DatabaseAdapter } from '@mylife/db';
import type {
  CompletedExercise,
  MuscleGroup,
  WorkoutAudioCue,
  WorkoutCategory,
  WorkoutCategoryCount,
  WorkoutDashboard,
  WorkoutDefinition,
  WorkoutDifficulty,
  WorkoutExerciseEntry,
  WorkoutExerciseFilters,
  WorkoutExerciseLibraryItem,
  WorkoutFocus,
  WorkoutFormRecording,
  WorkoutLog,
  WorkoutMetrics,
  WorkoutProgram,
  WorkoutSeedItem,
  WorkoutSession,
} from '../types';
import seedExercisesRaw from '../data/exercise-seed.json';

const seedExercises = seedExercisesRaw as WorkoutSeedItem[];

function nowIso(): string {
  return new Date().toISOString();
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToExercise(row: Record<string, unknown>): WorkoutExerciseLibraryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    category: row.category as WorkoutCategory,
    muscleGroups: parseJson<MuscleGroup[]>(row.muscle_groups_json, []),
    difficulty: row.difficulty as WorkoutDifficulty,
    defaultSets: row.default_sets as number,
    defaultReps: (row.default_reps as number | null) ?? null,
    defaultDuration: (row.default_duration as number | null) ?? null,
    videoUrl: (row.video_url as string | null) ?? null,
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    audioCues: parseJson<WorkoutAudioCue[]>(row.audio_cues_json, []),
    isPremium: !!(row.is_premium as number),
    createdAt: row.created_at as string,
  };
}

function rowToWorkout(row: Record<string, unknown>): WorkoutDefinition {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    difficulty: row.difficulty as WorkoutDifficulty,
    exercises: parseJson<WorkoutExerciseEntry[]>(row.exercises_json, []),
    estimatedDuration: row.estimated_duration as number,
    isPremium: !!(row.is_premium as number),
    createdAt: row.created_at as string,
  };
}

function rowToSession(row: Record<string, unknown>): WorkoutSession {
  return {
    id: row.id as string,
    workoutId: row.workout_id as string,
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
    exercisesCompleted: parseJson<CompletedExercise[]>(row.exercises_completed_json, []),
    voiceCommandsUsed: parseJson<WorkoutSession['voiceCommandsUsed']>(row.voice_commands_used_json, []),
    paceAdjustments: parseJson<WorkoutSession['paceAdjustments']>(row.pace_adjustments_json, []),
    createdAt: row.created_at as string,
  };
}

function rowToRecording(row: Record<string, unknown>): WorkoutFormRecording {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    exerciseId: row.exercise_id as string,
    videoUrl: row.video_url as string,
    timestampStart: row.timestamp_start as number,
    timestampEnd: row.timestamp_end as number,
    coachFeedback: parseJson<WorkoutFormRecording['coachFeedback']>(row.coach_feedback_json, []),
    createdAt: row.created_at as string,
  };
}

function estimateDurationSeconds(exercises: WorkoutExerciseEntry[]): number {
  let total = 0;
  for (const exercise of exercises) {
    const reps = exercise.reps ?? 10;
    const duration = exercise.duration ?? reps * 3;
    total += duration * exercise.sets;
    if (exercise.sets > 1) {
      total += exercise.restAfter * (exercise.sets - 1);
    }
  }
  return Math.max(0, Math.round(total));
}

export function seedWorkoutExerciseLibrary(db: DatabaseAdapter): number {
  const existing = db.query<{ c: number }>('SELECT COUNT(*) as c FROM wk_exercises')[0]?.c ?? 0;
  if (existing > 0) {
    return 0;
  }

  const createdAt = nowIso();
  db.transaction(() => {
    seedExercises.forEach((item, index) => {
      const id = `seed-${slugify(item.name)}-${index + 1}`;
      const audioCues: WorkoutAudioCue[] = [
        {
          timestamp: 0,
          text: item.audioCueText,
          type: 'instruction',
        },
      ];
      db.execute(
        `INSERT INTO wk_exercises (
          id, name, description, category, muscle_groups_json, difficulty,
          audio_cues_json, default_sets, default_reps, default_duration,
          is_premium, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.name,
          item.description,
          item.category,
          JSON.stringify(item.muscleGroups),
          item.difficulty,
          JSON.stringify(audioCues),
          item.defaultSets,
          item.defaultReps,
          item.defaultDuration ?? null,
          0,
          createdAt,
        ],
      );
    });
  });

  return seedExercises.length;
}

export function getWorkoutExercises(
  db: DatabaseAdapter,
  filters?: WorkoutExerciseFilters,
): WorkoutExerciseLibraryItem[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters?.search) {
    const token = `%${filters.search.toLowerCase()}%`;
    where.push('(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)');
    params.push(token, token);
  }

  if (filters?.category) {
    where.push('category = ?');
    params.push(filters.category);
  }

  if (filters?.difficulty) {
    where.push('difficulty = ?');
    params.push(filters.difficulty);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM wk_exercises ${whereClause} ORDER BY name ASC`,
    params,
  );

  const base = rows.map(rowToExercise);
  const filtered = filters?.muscleGroups?.length
    ? base.filter((exercise) =>
        exercise.muscleGroups.some((group) => filters.muscleGroups?.includes(group)),
      )
    : base;

  if (filters?.limit && filters.limit > 0) {
    return filtered.slice(0, filters.limit);
  }
  return filtered;
}

export function getWorkoutExerciseById(
  db: DatabaseAdapter,
  id: string,
): WorkoutExerciseLibraryItem | null {
  const row = db
    .query<Record<string, unknown>>('SELECT * FROM wk_exercises WHERE id = ? LIMIT 1', [id])[0];
  return row ? rowToExercise(row) : null;
}

export function getWorkoutExerciseCount(db: DatabaseAdapter): number {
  return db.query<{ c: number }>('SELECT COUNT(*) as c FROM wk_exercises')[0]?.c ?? 0;
}

export function getWorkoutCategoryCounts(db: DatabaseAdapter): WorkoutCategoryCount[] {
  const rows = db.query<{ category: WorkoutCategory; c: number }>(
    `SELECT category, COUNT(*) as c
     FROM wk_exercises
     GROUP BY category
     ORDER BY category ASC`,
  );
  return rows.map((row) => ({ category: row.category, count: row.c }));
}

export function createWorkout(
  db: DatabaseAdapter,
  id: string,
  input: {
    title: string;
    description?: string;
    difficulty: WorkoutDifficulty;
    exercises: WorkoutExerciseEntry[];
    estimatedDuration?: number;
    isPremium?: boolean;
  },
): void {
  const exercises = input.exercises
    .map((exercise, index) => ({ ...exercise, order: index }))
    .sort((a, b) => a.order - b.order);
  db.execute(
    `INSERT INTO wk_workouts (
      id, title, description, difficulty, exercises_json,
      estimated_duration, is_premium, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.description ?? '',
      input.difficulty,
      JSON.stringify(exercises),
      input.estimatedDuration ?? estimateDurationSeconds(exercises),
      input.isPremium ? 1 : 0,
      nowIso(),
    ],
  );
}

export function updateWorkout(
  db: DatabaseAdapter,
  id: string,
  input: {
    title: string;
    description?: string;
    difficulty: WorkoutDifficulty;
    exercises: WorkoutExerciseEntry[];
    estimatedDuration?: number;
    isPremium?: boolean;
  },
): void {
  const exercises = input.exercises
    .map((exercise, index) => ({ ...exercise, order: index }))
    .sort((a, b) => a.order - b.order);

  db.execute(
    `UPDATE wk_workouts
     SET title = ?, description = ?, difficulty = ?, exercises_json = ?,
         estimated_duration = ?, is_premium = ?
     WHERE id = ?`,
    [
      input.title,
      input.description ?? '',
      input.difficulty,
      JSON.stringify(exercises),
      input.estimatedDuration ?? estimateDurationSeconds(exercises),
      input.isPremium ? 1 : 0,
      id,
    ],
  );
}

export function deleteWorkout(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM wk_workouts WHERE id = ?', [id]);
}

export function getWorkouts(
  db: DatabaseAdapter,
  options?: {
    search?: string;
    difficulty?: WorkoutDifficulty | null;
    limit?: number;
  },
): WorkoutDefinition[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (options?.search) {
    const token = `%${options.search.toLowerCase()}%`;
    where.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)');
    params.push(token, token);
  }

  if (options?.difficulty) {
    where.push('difficulty = ?');
    params.push(options.difficulty);
  }

  let sql = `SELECT * FROM wk_workouts`;
  if (where.length > 0) {
    sql += ` WHERE ${where.join(' AND ')}`;
  }
  sql += ' ORDER BY created_at DESC';

  if (options?.limit && options.limit > 0) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  return db.query<Record<string, unknown>>(sql, params).map(rowToWorkout);
}

export function getWorkoutById(
  db: DatabaseAdapter,
  id: string,
): WorkoutDefinition | null {
  const row = db
    .query<Record<string, unknown>>('SELECT * FROM wk_workouts WHERE id = ? LIMIT 1', [id])[0];
  return row ? rowToWorkout(row) : null;
}

export function createWorkoutSession(
  db: DatabaseAdapter,
  id: string,
  input: {
    workoutId: string;
    startedAt?: string;
    completedAt?: string | null;
    exercisesCompleted?: CompletedExercise[];
    voiceCommandsUsed?: WorkoutSession['voiceCommandsUsed'];
    paceAdjustments?: WorkoutSession['paceAdjustments'];
  },
): void {
  db.execute(
    `INSERT INTO wk_workout_sessions (
      id, workout_id, started_at, completed_at,
      exercises_completed_json, voice_commands_used_json,
      pace_adjustments_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.workoutId,
      input.startedAt ?? nowIso(),
      input.completedAt ?? null,
      JSON.stringify(input.exercisesCompleted ?? []),
      JSON.stringify(input.voiceCommandsUsed ?? []),
      JSON.stringify(input.paceAdjustments ?? []),
      nowIso(),
    ],
  );
}

export function completeWorkoutSession(
  db: DatabaseAdapter,
  id: string,
  input: {
    completedAt?: string;
    exercisesCompleted: CompletedExercise[];
    voiceCommandsUsed?: WorkoutSession['voiceCommandsUsed'];
    paceAdjustments?: WorkoutSession['paceAdjustments'];
  },
): void {
  db.execute(
    `UPDATE wk_workout_sessions
     SET completed_at = ?, exercises_completed_json = ?,
         voice_commands_used_json = ?, pace_adjustments_json = ?
     WHERE id = ?`,
    [
      input.completedAt ?? nowIso(),
      JSON.stringify(input.exercisesCompleted),
      JSON.stringify(input.voiceCommandsUsed ?? []),
      JSON.stringify(input.paceAdjustments ?? []),
      id,
    ],
  );
}

export function getWorkoutSessions(
  db: DatabaseAdapter,
  options?: {
    workoutId?: string;
    onlyCompleted?: boolean;
    limit?: number;
  },
): WorkoutSession[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (options?.workoutId) {
    where.push('workout_id = ?');
    params.push(options.workoutId);
  }

  if (options?.onlyCompleted) {
    where.push('completed_at IS NOT NULL');
  }

  let sql = 'SELECT * FROM wk_workout_sessions';
  if (where.length > 0) {
    sql += ` WHERE ${where.join(' AND ')}`;
  }

  sql += ' ORDER BY COALESCE(completed_at, started_at) DESC';

  if (options?.limit && options.limit > 0) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  return db.query<Record<string, unknown>>(sql, params).map(rowToSession);
}

export function createWorkoutFormRecording(
  db: DatabaseAdapter,
  id: string,
  input: {
    sessionId: string;
    exerciseId: string;
    videoUrl: string;
    timestampStart: number;
    timestampEnd: number;
    coachFeedback?: WorkoutFormRecording['coachFeedback'];
  },
): void {
  db.execute(
    `INSERT INTO wk_form_recordings (
      id, session_id, exercise_id, video_url,
      timestamp_start, timestamp_end, coach_feedback_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.sessionId,
      input.exerciseId,
      input.videoUrl,
      input.timestampStart,
      input.timestampEnd,
      JSON.stringify(input.coachFeedback ?? []),
      nowIso(),
    ],
  );
}

export function getWorkoutFormRecordings(
  db: DatabaseAdapter,
  options?: {
    sessionId?: string;
    limit?: number;
  },
): WorkoutFormRecording[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (options?.sessionId) {
    where.push('session_id = ?');
    params.push(options.sessionId);
  }

  let sql = 'SELECT * FROM wk_form_recordings';
  if (where.length > 0) {
    sql += ` WHERE ${where.join(' AND ')}`;
  }
  sql += ' ORDER BY created_at DESC';

  if (options?.limit && options.limit > 0) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  return db.query<Record<string, unknown>>(sql, params).map(rowToRecording);
}

export function deleteWorkoutFormRecording(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM wk_form_recordings WHERE id = ?', [id]);
}

export function getWorkoutMetrics(
  db: DatabaseAdapter,
  days = 30,
): WorkoutMetrics {
  const sessionRow = db.query<{
    workouts: number;
    total_minutes: number | null;
  }>(
    `SELECT
      COUNT(*) as workouts,
      SUM((julianday(completed_at) - julianday(started_at)) * 24.0 * 60.0) as total_minutes
     FROM wk_workout_sessions
     WHERE completed_at IS NOT NULL
       AND completed_at >= datetime('now', ?)`,
    [`-${days} days`],
  )[0];

  const logRow = db.query<{
    total_calories: number | null;
    average_rpe: number | null;
  }>(
    `SELECT
      SUM(calories) as total_calories,
      AVG(rpe) as average_rpe
     FROM wk_workout_logs
     WHERE completed_at >= datetime('now', ?)`,
    [`-${days} days`],
  )[0];

  const totalMinutes = Math.max(0, Math.round(sessionRow?.total_minutes ?? 0));
  const estimatedCalories = Math.round(totalMinutes * 8.2);

  return {
    workouts: sessionRow?.workouts ?? 0,
    totalMinutes,
    totalCalories: (logRow?.total_calories ?? 0) || estimatedCalories,
    averageRpe: (logRow?.average_rpe ?? 0) || 7,
  };
}

function calculateCurrentStreak(sessions: WorkoutSession[]): number {
  const completedDates = Array.from(
    new Set(
      sessions
        .filter((session) => !!session.completedAt)
        .map((session) => (session.completedAt as string).slice(0, 10)),
    ),
  ).sort().reverse();

  if (completedDates.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (completedDates[0] !== today && completedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < completedDates.length; i += 1) {
    const prev = new Date(completedDates[i - 1]);
    const current = new Date(completedDates[i]);
    const diff = Math.round((prev.getTime() - current.getTime()) / 86400000);
    if (diff === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function getWorkoutDashboard(db: DatabaseAdapter): WorkoutDashboard {
  const exerciseCount = getWorkoutExerciseCount(db);
  const workouts = db.query<{ c: number }>('SELECT COUNT(*) as c FROM wk_workouts')[0]?.c ?? 0;
  const sessions = db.query<{ c: number }>('SELECT COUNT(*) as c FROM wk_workout_sessions')[0]?.c ?? 0;
  const sessions30d = getWorkoutMetrics(db, 30);
  const streakDays = calculateCurrentStreak(getWorkoutSessions(db, { onlyCompleted: true, limit: 365 }));

  return {
    workouts,
    exercises: exerciseCount,
    sessions,
    streakDays,
    totalMinutes30d: sessions30d.totalMinutes,
  };
}

// Legacy APIs retained below to avoid breaking existing callers while the
// upgraded MyWorkouts feature surface rolls out in the hub.

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
      nowIso(),
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
      nowIso(),
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
