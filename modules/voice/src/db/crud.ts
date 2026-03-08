import type { DatabaseAdapter } from '@mylife/db';
import type { Transcription, VoiceNote, VoiceSetting, TranscriptionStats } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function rowToTranscription(row: Record<string, unknown>): Transcription {
  return {
    id: row.id as string,
    text: row.text as string,
    durationSeconds: row.duration_seconds as number,
    language: (row.language as string) ?? null,
    confidence: (row.confidence as number) ?? null,
    audioUri: (row.audio_uri as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToVoiceNote(row: Record<string, unknown>): VoiceNote {
  return {
    id: row.id as string,
    title: row.title as string,
    transcriptionId: (row.transcription_id as string) ?? null,
    tags: (row.tags as string) ?? null,
    isFavorite: (row.is_favorite as number) === 1,
    createdAt: row.created_at as string,
  };
}

// ── Transcriptions ────────────────────────────────────────────────────

export function createTranscription(
  db: DatabaseAdapter,
  id: string,
  input: {
    text: string;
    durationSeconds: number;
    language?: string | null;
    confidence?: number | null;
    audioUri?: string | null;
  },
): Transcription {
  const now = nowIso();
  db.execute(
    `INSERT INTO vc_transcriptions (id, text, duration_seconds, language, confidence, audio_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.text,
      input.durationSeconds,
      input.language ?? null,
      input.confidence ?? null,
      input.audioUri ?? null,
      now,
    ],
  );
  return {
    id,
    text: input.text,
    durationSeconds: input.durationSeconds,
    language: input.language ?? null,
    confidence: input.confidence ?? null,
    audioUri: input.audioUri ?? null,
    createdAt: now,
  };
}

export function getTranscription(db: DatabaseAdapter, id: string): Transcription | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM vc_transcriptions WHERE id = ?`,
    [id],
  );
  return rows.length > 0 ? rowToTranscription(rows[0]) : null;
}

export function getTranscriptions(
  db: DatabaseAdapter,
  options?: { limit?: number; offset?: number },
): Transcription[] {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM vc_transcriptions ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows.map(rowToTranscription);
}

export function deleteTranscription(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM vc_transcriptions WHERE id = ?`, [id]);
  return true;
}

// ── Voice Notes ───────────────────────────────────────────────────────

export function createVoiceNote(
  db: DatabaseAdapter,
  id: string,
  input: {
    title: string;
    transcriptionId?: string | null;
    tags?: string | null;
    isFavorite?: boolean;
  },
): VoiceNote {
  const now = nowIso();
  const isFavorite = input.isFavorite ? 1 : 0;
  db.execute(
    `INSERT INTO vc_voice_notes (id, title, transcription_id, tags, is_favorite, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.title, input.transcriptionId ?? null, input.tags ?? null, isFavorite, now],
  );
  return {
    id,
    title: input.title,
    transcriptionId: input.transcriptionId ?? null,
    tags: input.tags ?? null,
    isFavorite: !!input.isFavorite,
    createdAt: now,
  };
}

export function getVoiceNote(db: DatabaseAdapter, id: string): VoiceNote | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM vc_voice_notes WHERE id = ?`,
    [id],
  );
  return rows.length > 0 ? rowToVoiceNote(rows[0]) : null;
}

export function getVoiceNotes(
  db: DatabaseAdapter,
  options?: { limit?: number; offset?: number },
): VoiceNote[] {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM vc_voice_notes ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows.map(rowToVoiceNote);
}

export function updateVoiceNote(
  db: DatabaseAdapter,
  id: string,
  input: {
    title?: string;
    tags?: string | null;
    isFavorite?: boolean;
  },
): VoiceNote | null {
  const existing = getVoiceNote(db, id);
  if (!existing) return null;

  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) {
    updates.push('title = ?');
    params.push(input.title);
  }
  if (input.tags !== undefined) {
    updates.push('tags = ?');
    params.push(input.tags);
  }
  if (input.isFavorite !== undefined) {
    updates.push('is_favorite = ?');
    params.push(input.isFavorite ? 1 : 0);
  }

  if (updates.length === 0) return existing;

  params.push(id);
  db.execute(`UPDATE vc_voice_notes SET ${updates.join(', ')} WHERE id = ?`, params);
  return getVoiceNote(db, id);
}

export function deleteVoiceNote(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM vc_voice_notes WHERE id = ?`, [id]);
  return true;
}

export function toggleFavorite(db: DatabaseAdapter, id: string): VoiceNote | null {
  const existing = getVoiceNote(db, id);
  if (!existing) return null;

  const newValue = existing.isFavorite ? 0 : 1;
  db.execute(`UPDATE vc_voice_notes SET is_favorite = ? WHERE id = ?`, [newValue, id]);
  return getVoiceNote(db, id);
}

// ── Settings ──────────────────────────────────────────────────────────

export function setSetting(db: DatabaseAdapter, key: string, value: string): void {
  db.execute(
    `INSERT INTO vc_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export function getSetting(db: DatabaseAdapter, key: string): string | null {
  const rows = db.query<VoiceSetting>(
    `SELECT * FROM vc_settings WHERE key = ?`,
    [key],
  );
  return rows.length > 0 ? rows[0].value : null;
}

export function getSettings(db: DatabaseAdapter): VoiceSetting[] {
  return db.query<VoiceSetting>(`SELECT * FROM vc_settings ORDER BY key ASC`);
}

// ── Stats ─────────────────────────────────────────────────────────────

export function getTranscriptionStats(db: DatabaseAdapter): TranscriptionStats {
  const countRow = db.query<{ count: number; total_duration: number | null; avg_duration: number | null }>(
    `SELECT
       COUNT(*) as count,
       COALESCE(SUM(duration_seconds), 0) as total_duration,
       COALESCE(AVG(duration_seconds), 0) as avg_duration
     FROM vc_transcriptions`,
  );

  const byLanguage = db.query<{ language: string; count: number }>(
    `SELECT COALESCE(language, 'unknown') as language, COUNT(*) as count
     FROM vc_transcriptions
     GROUP BY language
     ORDER BY count DESC`,
  );

  return {
    totalCount: countRow[0].count,
    totalDurationSeconds: countRow[0].total_duration ?? 0,
    avgDurationSeconds: countRow[0].avg_duration ?? 0,
    byLanguage,
  };
}
