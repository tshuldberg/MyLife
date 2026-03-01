/**
 * Discovery engine -- combined multi-filter book discovery.
 */

import type { DatabaseAdapter } from '@mylife/db';
import type { Book, ContentWarning } from '../models/schemas';
import type { DiscoveryFilters, BookDiscoveryProfile } from './types';

/**
 * Discover books matching a combination of mood tags, pace, genre,
 * content warning exclusions, and user tags.
 */
export function discoverBooks(
  db: DatabaseAdapter,
  filters: DiscoveryFilters,
): Book[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  // Mood filter: books that have ANY of the specified mood values
  if (filters.moods && filters.moods.length > 0) {
    const placeholders = filters.moods.map(() => '?').join(', ');
    conditions.push(
      `b.id IN (SELECT book_id FROM bk_mood_tags WHERE tag_type = 'mood' AND value IN (${placeholders}))`,
    );
    params.push(...filters.moods);
  }

  // Pace filter
  if (filters.paces && filters.paces.length > 0) {
    const placeholders = filters.paces.map(() => '?').join(', ');
    conditions.push(
      `b.id IN (SELECT book_id FROM bk_mood_tags WHERE tag_type = 'pace' AND value IN (${placeholders}))`,
    );
    params.push(...filters.paces);
  }

  // Genre filter
  if (filters.genres && filters.genres.length > 0) {
    const placeholders = filters.genres.map(() => '?').join(', ');
    conditions.push(
      `b.id IN (SELECT book_id FROM bk_mood_tags WHERE tag_type = 'genre' AND value IN (${placeholders}))`,
    );
    params.push(...filters.genres);
  }

  // Exclude books with specific content warnings
  if (filters.excludeWarnings && filters.excludeWarnings.length > 0) {
    const placeholders = filters.excludeWarnings.map(() => '?').join(', ');
    conditions.push(
      `b.id NOT IN (SELECT book_id FROM bk_content_warnings WHERE warning IN (${placeholders}))`,
    );
    params.push(...filters.excludeWarnings);
  }

  // Tag filter (user-created tags via book_tags junction)
  if (filters.tags && filters.tags.length > 0) {
    const placeholders = filters.tags.map(() => '?').join(', ');
    conditions.push(
      `b.id IN (SELECT bt.book_id FROM bk_book_tags bt INNER JOIN bk_tags t ON bt.tag_id = t.id WHERE t.name IN (${placeholders}))`,
    );
    params.push(...filters.tags);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  params.push(limit, offset);

  return db.query<Book>(
    `SELECT b.* FROM bk_books b ${whereClause} ORDER BY b.title LIMIT ? OFFSET ?`,
    params,
  );
}

/**
 * Get the full discovery metadata profile for a single book.
 */
export function getBookDiscoveryProfile(
  db: DatabaseAdapter,
  bookId: string,
): BookDiscoveryProfile {
  const moodRows = db.query<{ value: string }>(
    `SELECT value FROM bk_mood_tags WHERE book_id = ? AND tag_type = 'mood' ORDER BY value`,
    [bookId],
  );
  const paceRows = db.query<{ value: string }>(
    `SELECT value FROM bk_mood_tags WHERE book_id = ? AND tag_type = 'pace' ORDER BY value`,
    [bookId],
  );
  const genreRows = db.query<{ value: string }>(
    `SELECT value FROM bk_mood_tags WHERE book_id = ? AND tag_type = 'genre' ORDER BY value`,
    [bookId],
  );
  const contentWarnings = db.query<ContentWarning>(
    `SELECT * FROM bk_content_warnings WHERE book_id = ? ORDER BY severity DESC, warning`,
    [bookId],
  );
  const tagRows = db.query<{ name: string }>(
    `SELECT t.name FROM bk_tags t
     INNER JOIN bk_book_tags bt ON t.id = bt.tag_id
     WHERE bt.book_id = ?
     ORDER BY t.name`,
    [bookId],
  );

  return {
    moods: moodRows.map((r) => r.value),
    paces: paceRows.map((r) => r.value),
    genres: genreRows.map((r) => r.value),
    contentWarnings,
    tags: tagRows.map((r) => r.name),
  };
}
