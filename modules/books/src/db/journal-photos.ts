/**
 * Journal photo CRUD operations (hub variant with bk_ prefix).
 */

import type { DatabaseAdapter } from '@mylife/db';
import type { JournalPhoto, JournalPhotoInsert } from '../models/schemas';

export function addJournalPhoto(
  db: DatabaseAdapter,
  id: string,
  input: JournalPhotoInsert,
): JournalPhoto {
  const now = new Date().toISOString();
  const photo: JournalPhoto = {
    id,
    entry_id: input.entry_id,
    file_path: input.file_path,
    file_name: input.file_name ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    sort_order: input.sort_order ?? 0,
    created_at: now,
  };

  db.execute(
    `INSERT INTO bk_journal_photos (id, entry_id, file_path, file_name,
      width, height, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      photo.id, photo.entry_id, photo.file_path, photo.file_name,
      photo.width, photo.height, photo.sort_order, photo.created_at,
    ],
  );

  return photo;
}

export function getPhotosForEntry(
  db: DatabaseAdapter,
  entryId: string,
): JournalPhoto[] {
  return db.query<JournalPhoto>(
    `SELECT * FROM bk_journal_photos WHERE entry_id = ? ORDER BY sort_order`,
    [entryId],
  );
}

export function removeJournalPhoto(
  db: DatabaseAdapter,
  id: string,
): void {
  db.execute(`DELETE FROM bk_journal_photos WHERE id = ?`, [id]);
}

export function reorderJournalPhotos(
  db: DatabaseAdapter,
  entryId: string,
  photoIds: string[],
): void {
  for (let i = 0; i < photoIds.length; i++) {
    db.execute(
      `UPDATE bk_journal_photos SET sort_order = ? WHERE id = ? AND entry_id = ?`,
      [i, photoIds[i], entryId],
    );
  }
}
