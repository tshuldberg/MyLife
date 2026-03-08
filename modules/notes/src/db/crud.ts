import type { DatabaseAdapter } from '@mylife/db';
import type {
  Note,
  NoteFolder,
  NoteTag,
  NoteLink,
  NoteTemplate,
  NoteSetting,
  CreateNoteInput,
  UpdateNoteInput,
  CreateFolderInput,
  UpdateFolderInput,
  CreateTagInput,
  CreateTemplateInput,
  NoteFilter,
  NoteSearchResult,
  NoteGraph,
  NotesStats,
} from '../types';
import { CreateNoteInputSchema, NoteFilterSchema } from '../types';
import { countWords, extractBacklinks } from '../engine/markdown';

// ── Helpers ────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    folderId: (row.folder_id as string) ?? null,
    isPinned: (row.is_pinned as number) === 1,
    isFavorite: (row.is_favorite as number) === 1,
    wordCount: row.word_count as number,
    charCount: row.char_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToFolder(row: Record<string, unknown>): NoteFolder {
  return {
    id: row.id as string,
    name: row.name as string,
    parentId: (row.parent_id as string) ?? null,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToTag(row: Record<string, unknown>): NoteTag {
  return {
    id: row.id as string,
    name: row.name as string,
    color: (row.color as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToLink(row: Record<string, unknown>): NoteLink {
  return {
    id: row.id as string,
    sourceNoteId: row.source_note_id as string,
    targetNoteId: row.target_note_id as string,
    createdAt: row.created_at as string,
  };
}

function rowToTemplate(row: Record<string, unknown>): NoteTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    body: row.body as string,
    createdAt: row.created_at as string,
  };
}

// ── Notes CRUD ─────────────────────────────────────────────────────────

export function createNote(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateNoteInput,
): Note {
  const input = CreateNoteInputSchema.parse(rawInput);
  const now = nowIso();
  const wc = countWords(input.body ?? '');
  const cc = (input.body ?? '').length;

  db.transaction(() => {
    db.execute(
      `INSERT INTO nt_notes (id, title, body, folder_id, is_pinned, is_favorite, word_count, char_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.title, input.body, input.folderId, input.isPinned ? 1 : 0, input.isFavorite ? 1 : 0, wc, cc, now, now],
    );

    for (const tagId of input.tagIds ?? []) {
      db.execute(
        `INSERT OR IGNORE INTO nt_note_tags (note_id, tag_id) VALUES (?, ?)`,
        [id, tagId],
      );
    }

    // Parse backlinks and create link records
    const backlinks = extractBacklinks(input.body ?? '');
    for (const targetTitle of backlinks) {
      const targets = db.query<{ id: string }>(
        `SELECT id FROM nt_notes WHERE title = ?`,
        [targetTitle],
      );
      if (targets.length > 0) {
        db.execute(
          `INSERT INTO nt_note_links (id, source_note_id, target_note_id, created_at)
           VALUES (?, ?, ?, ?)`,
          [crypto.randomUUID(), id, targets[0].id, now],
        );
      }
    }
  });

  return {
    id,
    title: input.title ?? '',
    body: input.body ?? '',
    folderId: input.folderId ?? null,
    isPinned: input.isPinned ?? false,
    isFavorite: input.isFavorite ?? false,
    wordCount: wc,
    charCount: cc,
    createdAt: now,
    updatedAt: now,
  };
}

export function getNoteById(db: DatabaseAdapter, id: string): Note | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM nt_notes WHERE id = ?`,
    [id],
  );
  return rows.length > 0 ? rowToNote(rows[0]) : null;
}

export function getNotes(db: DatabaseAdapter, rawFilter?: NoteFilter): Note[] {
  const filter = NoteFilterSchema.parse(rawFilter ?? {});
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.folderId !== undefined) {
    if (filter.folderId === null) {
      conditions.push('folder_id IS NULL');
    } else {
      conditions.push('folder_id = ?');
      params.push(filter.folderId);
    }
  }
  if (filter.isPinned !== undefined) {
    conditions.push('is_pinned = ?');
    params.push(filter.isPinned ? 1 : 0);
  }
  if (filter.isFavorite !== undefined) {
    conditions.push('is_favorite = ?');
    params.push(filter.isFavorite ? 1 : 0);
  }
  if (filter.tagId) {
    conditions.push('id IN (SELECT note_id FROM nt_note_tags WHERE tag_id = ?)');
    params.push(filter.tagId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = filter.sortBy === 'title' ? 'title' : filter.sortBy === 'created' ? 'created_at' : 'updated_at';
  const sortDir = filter.sortDir === 'asc' ? 'ASC' : 'DESC';

  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM nt_notes ${where} ORDER BY is_pinned DESC, ${sortCol} ${sortDir} LIMIT ? OFFSET ?`,
    [...params, filter.limit, filter.offset],
  );
  return rows.map(rowToNote);
}

export function updateNote(
  db: DatabaseAdapter,
  id: string,
  input: UpdateNoteInput,
): Note | null {
  const existing = getNoteById(db, id);
  if (!existing) return null;

  const now = nowIso();
  const updates: string[] = ['updated_at = ?'];
  const params: unknown[] = [now];

  if (input.title !== undefined) { updates.push('title = ?'); params.push(input.title); }
  if (input.body !== undefined) {
    const wc = countWords(input.body);
    updates.push('body = ?', 'word_count = ?', 'char_count = ?');
    params.push(input.body, wc, input.body.length);
  }
  if (input.folderId !== undefined) { updates.push('folder_id = ?'); params.push(input.folderId); }
  if (input.isPinned !== undefined) { updates.push('is_pinned = ?'); params.push(input.isPinned ? 1 : 0); }
  if (input.isFavorite !== undefined) { updates.push('is_favorite = ?'); params.push(input.isFavorite ? 1 : 0); }

  params.push(id);
  db.execute(`UPDATE nt_notes SET ${updates.join(', ')} WHERE id = ?`, params);

  // Update tags if provided
  if (input.tagIds !== undefined) {
    db.execute(`DELETE FROM nt_note_tags WHERE note_id = ?`, [id]);
    for (const tagId of input.tagIds) {
      db.execute(
        `INSERT OR IGNORE INTO nt_note_tags (note_id, tag_id) VALUES (?, ?)`,
        [id, tagId],
      );
    }
  }

  return getNoteById(db, id);
}

export function deleteNote(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM nt_notes WHERE id = ?`, [id]);
  return true;
}

export function getNoteCount(db: DatabaseAdapter): number {
  const rows = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM nt_notes`);
  return rows[0].count;
}

// ── Search ─────────────────────────────────────────────────────────────

export function searchNotes(
  db: DatabaseAdapter,
  query: string,
  limit = 20,
): NoteSearchResult[] {
  if (!query.trim()) return [];
  const rows = db.query<{ id: string; title: string; snippet: string; rank: number }>(
    `SELECT n.id, n.title, snippet(nt_notes_fts, 1, '<b>', '</b>', '...', 32) as snippet, rank
     FROM nt_notes_fts fts
     JOIN nt_notes n ON n.rowid = fts.rowid
     WHERE nt_notes_fts MATCH ?
     ORDER BY rank
     LIMIT ?`,
    [query, limit],
  );
  return rows;
}

// ── Folders CRUD ───────────────────────────────────────────────────────

export function createFolder(
  db: DatabaseAdapter,
  id: string,
  input: CreateFolderInput,
): NoteFolder {
  const now = nowIso();
  db.execute(
    `INSERT INTO nt_folders (id, name, parent_id, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.name, input.parentId ?? null, input.sortOrder ?? 0, now, now],
  );
  return {
    id,
    name: input.name,
    parentId: input.parentId ?? null,
    sortOrder: input.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function getFolders(db: DatabaseAdapter, parentId?: string | null): NoteFolder[] {
  if (parentId === undefined) {
    return db.query<Record<string, unknown>>(
      `SELECT * FROM nt_folders ORDER BY sort_order ASC, name ASC`,
    ).map(rowToFolder);
  }
  if (parentId === null) {
    return db.query<Record<string, unknown>>(
      `SELECT * FROM nt_folders WHERE parent_id IS NULL ORDER BY sort_order ASC, name ASC`,
    ).map(rowToFolder);
  }
  return db.query<Record<string, unknown>>(
    `SELECT * FROM nt_folders WHERE parent_id = ? ORDER BY sort_order ASC, name ASC`,
    [parentId],
  ).map(rowToFolder);
}

export function getFolderById(db: DatabaseAdapter, id: string): NoteFolder | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM nt_folders WHERE id = ?`,
    [id],
  );
  return rows.length > 0 ? rowToFolder(rows[0]) : null;
}

export function updateFolder(
  db: DatabaseAdapter,
  id: string,
  input: UpdateFolderInput,
): NoteFolder | null {
  const existing = getFolderById(db, id);
  if (!existing) return null;

  const now = nowIso();
  const updates: string[] = ['updated_at = ?'];
  const params: unknown[] = [now];

  if (input.name !== undefined) { updates.push('name = ?'); params.push(input.name); }
  if (input.parentId !== undefined) { updates.push('parent_id = ?'); params.push(input.parentId); }
  if (input.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(input.sortOrder); }

  params.push(id);
  db.execute(`UPDATE nt_folders SET ${updates.join(', ')} WHERE id = ?`, params);
  return getFolderById(db, id);
}

export function deleteFolder(db: DatabaseAdapter, id: string): boolean {
  // Notes in this folder get their folder_id set to NULL via ON DELETE SET NULL
  db.execute(`DELETE FROM nt_folders WHERE id = ?`, [id]);
  return true;
}

// ── Tags CRUD ──────────────────────────────────────────────────────────

export function createTag(
  db: DatabaseAdapter,
  id: string,
  input: CreateTagInput,
): NoteTag {
  const now = nowIso();
  db.execute(
    `INSERT INTO nt_tags (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
    [id, input.name, input.color ?? null, now],
  );
  return { id, name: input.name, color: input.color ?? null, createdAt: now };
}

export function getTags(db: DatabaseAdapter): NoteTag[] {
  return db.query<Record<string, unknown>>(
    `SELECT * FROM nt_tags ORDER BY name ASC`,
  ).map(rowToTag);
}

export function getTagById(db: DatabaseAdapter, id: string): NoteTag | null {
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM nt_tags WHERE id = ?`,
    [id],
  );
  return rows.length > 0 ? rowToTag(rows[0]) : null;
}

export function deleteTag(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM nt_tags WHERE id = ?`, [id]);
  return true;
}

export function getTagsForNote(db: DatabaseAdapter, noteId: string): NoteTag[] {
  return db.query<Record<string, unknown>>(
    `SELECT t.* FROM nt_tags t JOIN nt_note_tags nt ON nt.tag_id = t.id WHERE nt.note_id = ?`,
    [noteId],
  ).map(rowToTag);
}

// ── Links ──────────────────────────────────────────────────────────────

export function getBacklinksForNote(db: DatabaseAdapter, noteId: string): NoteLink[] {
  return db.query<Record<string, unknown>>(
    `SELECT * FROM nt_note_links WHERE target_note_id = ?`,
    [noteId],
  ).map(rowToLink);
}

export function getOutgoingLinksForNote(db: DatabaseAdapter, noteId: string): NoteLink[] {
  return db.query<Record<string, unknown>>(
    `SELECT * FROM nt_note_links WHERE source_note_id = ?`,
    [noteId],
  ).map(rowToLink);
}

export function getNoteGraph(db: DatabaseAdapter): NoteGraph {
  const nodes = db.query<{ id: string; title: string; link_count: number }>(
    `SELECT n.id, n.title,
       (SELECT COUNT(*) FROM nt_note_links WHERE source_note_id = n.id OR target_note_id = n.id) as link_count
     FROM nt_notes n
     ORDER BY link_count DESC`,
  ).map((r) => ({ id: r.id, title: r.title, linkCount: r.link_count }));

  const edges = db.query<{ source: string; target: string }>(
    `SELECT source_note_id as source, target_note_id as target FROM nt_note_links`,
  );

  return { nodes, edges };
}

// ── Templates CRUD ─────────────────────────────────────────────────────

export function createTemplate(
  db: DatabaseAdapter,
  id: string,
  input: CreateTemplateInput,
): NoteTemplate {
  const now = nowIso();
  db.execute(
    `INSERT INTO nt_templates (id, name, body, created_at) VALUES (?, ?, ?, ?)`,
    [id, input.name, input.body ?? '', now],
  );
  return { id, name: input.name, body: input.body ?? '', createdAt: now };
}

export function getTemplates(db: DatabaseAdapter): NoteTemplate[] {
  return db.query<Record<string, unknown>>(
    `SELECT * FROM nt_templates ORDER BY name ASC`,
  ).map(rowToTemplate);
}

export function deleteTemplate(db: DatabaseAdapter, id: string): boolean {
  db.execute(`DELETE FROM nt_templates WHERE id = ?`, [id]);
  return true;
}

// ── Settings ───────────────────────────────────────────────────────────

export function getSetting(db: DatabaseAdapter, key: string): string | null {
  const rows = db.query<NoteSetting>(
    `SELECT * FROM nt_settings WHERE key = ?`,
    [key],
  );
  return rows.length > 0 ? rows[0].value : null;
}

export function setSetting(db: DatabaseAdapter, key: string, value: string): void {
  db.execute(
    `INSERT INTO nt_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

// ── Stats ──────────────────────────────────────────────────────────────

export function getNotesStats(db: DatabaseAdapter): NotesStats {
  const notes = db.query<{ count: number; total_words: number; pinned: number; fav: number }>(
    `SELECT COUNT(*) as count,
       COALESCE(SUM(word_count), 0) as total_words,
       SUM(CASE WHEN is_pinned = 1 THEN 1 ELSE 0 END) as pinned,
       SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as fav
     FROM nt_notes`,
  );
  const folders = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM nt_folders`);
  const tags = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM nt_tags`);

  return {
    totalNotes: notes[0].count,
    totalFolders: folders[0].count,
    totalTags: tags[0].count,
    totalWords: notes[0].total_words,
    pinnedCount: notes[0].pinned,
    favoriteCount: notes[0].fav,
  };
}
