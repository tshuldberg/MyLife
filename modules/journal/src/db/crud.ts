import type { DatabaseAdapter } from '@mylife/db';
import {
  CreateJournalEntryInputSchema,
  JournalEntryFilterSchema,
  UpdateJournalEntryInputSchema,
  type CreateJournalEntryInput,
  type JournalDashboard,
  type JournalEntry,
  type JournalEntryFilter,
  type JournalSearchResult,
  type JournalSetting,
  type JournalTag,
  type UpdateJournalEntryInput,
} from '../types';
import { calculateJournalStreak, countWords } from '../engine/stats';

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (typeof c?.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTagName(value: string): string {
  return value.trim().toLowerCase();
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function parseImageUris(raw: unknown): string[] {
  if (typeof raw !== 'string') {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function rowToEntry(row: Record<string, unknown>, tags: string[] = []): JournalEntry {
  return {
    id: row.id as string,
    entryDate: row.entry_date as string,
    title: (row.title as string) ?? null,
    body: row.body as string,
    tags,
    mood: (row.mood as JournalEntry['mood']) ?? null,
    imageUris: parseImageUris(row.image_uris_json),
    wordCount: row.word_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToTag(row: Record<string, unknown>): JournalTag {
  return {
    id: row.id as string,
    name: row.name as string,
    color: (row.color as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function getTagsForEntry(db: DatabaseAdapter, entryId: string): string[] {
  return db.query<{ name: string }>(
    `SELECT t.name
     FROM jn_tags t
     INNER JOIN jn_entry_tags et ON et.tag_id = t.id
     WHERE et.entry_id = ?
     ORDER BY t.name ASC`,
    [entryId],
  ).map((row) => row.name);
}

function syncEntryTags(db: DatabaseAdapter, entryId: string, tags: string[], createdAt: string): void {
  db.execute(`DELETE FROM jn_entry_tags WHERE entry_id = ?`, [entryId]);

  for (const tagName of [...new Set(tags.map(normalizeTagName).filter(Boolean))]) {
    const existing = db.query<{ id: string }>(`SELECT id FROM jn_tags WHERE name = ?`, [tagName])[0];
    const tagId = existing?.id ?? createId('jn_tag');

    if (!existing) {
      db.execute(
        `INSERT INTO jn_tags (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
        [tagId, tagName, null, createdAt],
      );
    }

    db.execute(
      `INSERT OR IGNORE INTO jn_entry_tags (id, entry_id, tag_id, created_at) VALUES (?, ?, ?, ?)`,
      [createId('jn_entry_tag'), entryId, tagId, createdAt],
    );
  }
}

export function createJournalEntry(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateJournalEntryInput,
): JournalEntry {
  const input = CreateJournalEntryInputSchema.parse(rawInput);
  const now = nowIso();
  const entryDate = input.entryDate ?? dateOnly(now);
  const wordCount = countWords(input.body);

  db.transaction(() => {
    db.execute(
      `INSERT INTO jn_entries (
        id, entry_date, title, body, mood, image_uris_json, word_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entryDate,
        input.title,
        input.body,
        input.mood,
        JSON.stringify(input.imageUris),
        wordCount,
        now,
        now,
      ],
    );

    syncEntryTags(db, id, input.tags, now);
  });

  return getJournalEntryById(db, id)!;
}

export function getJournalEntryById(db: DatabaseAdapter, id: string): JournalEntry | null {
  const rows = db.query<Record<string, unknown>>(`SELECT * FROM jn_entries WHERE id = ?`, [id]);
  if (!rows[0]) {
    return null;
  }
  return rowToEntry(rows[0], getTagsForEntry(db, id));
}

export function listJournalEntries(db: DatabaseAdapter, rawFilter?: JournalEntryFilter): JournalEntry[] {
  const filter = JournalEntryFilterSchema.parse(rawFilter ?? {});
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.startDate) {
    conditions.push('e.entry_date >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    conditions.push('e.entry_date <= ?');
    params.push(filter.endDate);
  }
  if (filter.mood) {
    conditions.push('e.mood = ?');
    params.push(filter.mood);
  }
  if (filter.tag) {
    conditions.push(
      `e.id IN (
        SELECT et.entry_id
        FROM jn_entry_tags et
        INNER JOIN jn_tags t ON t.id = et.tag_id
        WHERE t.name = ?
      )`,
    );
    params.push(normalizeTagName(filter.tag));
  }
  if (filter.search) {
    conditions.push(`(LOWER(COALESCE(e.title, '')) LIKE ? OR LOWER(e.body) LIKE ?)`);
    const like = `%${filter.search.toLowerCase()}%`;
    params.push(like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.query<Record<string, unknown>>(
    `SELECT e.* FROM jn_entries e ${where}
     ORDER BY e.entry_date DESC, e.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, filter.limit, filter.offset],
  );

  return rows.map((row) => rowToEntry(row, getTagsForEntry(db, row.id as string)));
}

export function searchJournalEntries(
  db: DatabaseAdapter,
  query: string,
  limit = 20,
): JournalSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return listJournalEntries(db, { search: normalized, limit }).map((entry) => ({
    ...entry,
    matchedTagNames: entry.tags.filter((tag) => tag.includes(normalized)),
  }));
}

export function updateJournalEntry(
  db: DatabaseAdapter,
  id: string,
  rawInput: UpdateJournalEntryInput,
): JournalEntry | null {
  const existing = getJournalEntryById(db, id);
  if (!existing) {
    return null;
  }

  const updates = UpdateJournalEntryInputSchema.parse(rawInput);
  const nextEntry = {
    entryDate: updates.entryDate ?? existing.entryDate,
    title: updates.title === undefined ? existing.title : updates.title,
    body: updates.body ?? existing.body,
    mood: updates.mood === undefined ? existing.mood : updates.mood,
    imageUris: updates.imageUris ?? existing.imageUris,
    tags: updates.tags ?? existing.tags,
  };
  const nextWordCount = countWords(nextEntry.body);
  const now = nowIso();

  db.transaction(() => {
    db.execute(
      `UPDATE jn_entries
       SET entry_date = ?, title = ?, body = ?, mood = ?, image_uris_json = ?, word_count = ?, updated_at = ?
       WHERE id = ?`,
      [
        nextEntry.entryDate,
        nextEntry.title,
        nextEntry.body,
        nextEntry.mood,
        JSON.stringify(nextEntry.imageUris),
        nextWordCount,
        now,
        id,
      ],
    );
    syncEntryTags(db, id, nextEntry.tags, now);
  });

  return getJournalEntryById(db, id);
}

export function deleteJournalEntry(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM jn_entries WHERE id = ?`, [id]);
}

export function getEntriesForDate(db: DatabaseAdapter, entryDate: string): JournalEntry[] {
  return listJournalEntries(db, { startDate: entryDate, endDate: entryDate, limit: 50 });
}

export function listJournalTags(db: DatabaseAdapter): JournalTag[] {
  return db
    .query<Record<string, unknown>>(`SELECT * FROM jn_tags ORDER BY name ASC`)
    .map(rowToTag);
}

export function getJournalSetting(db: DatabaseAdapter, key: string): string | null {
  const row = db.query<{ value: string }>(`SELECT value FROM jn_settings WHERE key = ?`, [key])[0];
  return row?.value ?? null;
}

export function setJournalSetting(db: DatabaseAdapter, key: string, value: string): JournalSetting {
  db.execute(
    `INSERT INTO jn_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );

  return { key, value };
}

export function getJournalDashboard(
  db: DatabaseAdapter,
  referenceDate = new Date().toISOString().slice(0, 10),
): JournalDashboard {
  const entryCount = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM jn_entries`)[0]?.count ?? 0;
  const totalWords = db.query<{ total: number | null }>(`SELECT SUM(word_count) as total FROM jn_entries`)[0]?.total ?? 0;
  const monthlyWords = db.query<{ total: number | null }>(
    `SELECT SUM(word_count) as total
     FROM jn_entries
     WHERE substr(entry_date, 1, 7) = substr(?, 1, 7)`,
    [referenceDate],
  )[0]?.total ?? 0;
  const latestMood = db.query<{ mood: JournalDashboard['latestMood'] }>(
    `SELECT mood FROM jn_entries WHERE mood IS NOT NULL ORDER BY entry_date DESC, updated_at DESC LIMIT 1`,
  )[0]?.mood ?? null;
  const distinctDates = db.query<{ entry_date: string }>(
    `SELECT DISTINCT entry_date FROM jn_entries ORDER BY entry_date DESC`,
  ).map((row) => row.entry_date);
  const streak = calculateJournalStreak(distinctDates, referenceDate);

  return {
    entryCount,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    totalWords,
    monthlyWords,
    latestMood,
  };
}
