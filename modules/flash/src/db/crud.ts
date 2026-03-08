import type { DatabaseAdapter } from '@mylife/db';
import {
  CardRatingSchema,
  CreateDeckInputSchema,
  CreateFlashcardInputSchema,
  FlashDashboardSchema,
  FlashSettingSchema,
  FlashcardSchema,
  type CardRating,
  type CreateDeckInput,
  type CreateFlashcardInput,
  type Deck,
  type FlashDashboard,
  type FlashSetting,
  type Flashcard,
  type ReviewLog,
  type UpdateDeckInput,
  UpdateDeckInputSchema,
} from '../types';
import { DEFAULT_FLASH_DECK_ID } from './schema';
import { calculateStudyStreak, scheduleFlashcard } from '../engine/scheduler';

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

function normalizeTag(value: string): string {
  return value.trim().toLowerCase();
}

function parseTags(raw: unknown): string[] {
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

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function rowToDeck(row: Record<string, unknown>): Deck {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    parentId: (row.parent_id as string) ?? null,
    isDefault: Boolean(row.is_default),
    cardCount: Number(row.card_count ?? 0),
    newCount: Number(row.new_count ?? 0),
    dueCount: Number(row.due_count ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToFlashcard(row: Record<string, unknown>): Flashcard {
  return FlashcardSchema.parse({
    id: row.id,
    noteId: row.note_id,
    deckId: row.deck_id,
    cardType: row.card_type,
    templateOrdinal: row.template_ordinal,
    front: row.front,
    back: row.back,
    tags: parseTags(row.tags_json),
    queue: row.queue,
    intervalDays: Number(row.interval_days ?? 0),
    ease: Number(row.ease ?? 2.5),
    dueAt: (row.due_at as string) ?? null,
    lastReviewAt: (row.last_review_at as string) ?? null,
    reviewCount: Number(row.review_count ?? 0),
    lapseCount: Number(row.lapse_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function rowToReviewLog(row: Record<string, unknown>): ReviewLog {
  return {
    id: row.id as string,
    cardId: row.card_id as string,
    rating: CardRatingSchema.parse(row.rating),
    scheduledBeforeAt: (row.scheduled_before_at as string) ?? null,
    scheduledAfterAt: (row.scheduled_after_at as string) ?? null,
    reviewedAt: row.reviewed_at as string,
  };
}

export function listDecks(db: DatabaseAdapter, referenceAt = nowIso()): Deck[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT
         d.*,
         COUNT(c.id) AS card_count,
         SUM(CASE WHEN c.queue = 'new' THEN 1 ELSE 0 END) AS new_count,
         SUM(
           CASE
             WHEN c.queue NOT IN ('new', 'suspended', 'buried')
               AND c.due_at IS NOT NULL
               AND c.due_at <= ?
             THEN 1
             ELSE 0
           END
         ) AS due_count
       FROM fl_decks d
       LEFT JOIN fl_cards c ON c.deck_id = d.id
       GROUP BY d.id
       ORDER BY d.is_default DESC, d.name ASC`,
      [referenceAt],
    )
    .map(rowToDeck);
}

export function getDeckById(db: DatabaseAdapter, deckId: string, referenceAt = nowIso()): Deck | null {
  return (
    db
      .query<Record<string, unknown>>(
        `SELECT
           d.*,
           COUNT(c.id) AS card_count,
           SUM(CASE WHEN c.queue = 'new' THEN 1 ELSE 0 END) AS new_count,
           SUM(
             CASE
               WHEN c.queue NOT IN ('new', 'suspended', 'buried')
                 AND c.due_at IS NOT NULL
                 AND c.due_at <= ?
               THEN 1
               ELSE 0
             END
           ) AS due_count
         FROM fl_decks d
         LEFT JOIN fl_cards c ON c.deck_id = d.id
         WHERE d.id = ?
         GROUP BY d.id`,
        [referenceAt, deckId],
      )
      .map(rowToDeck)[0] ?? null
  );
}

export function createDeck(db: DatabaseAdapter, id: string, rawInput: CreateDeckInput): Deck {
  const input = CreateDeckInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO fl_decks (id, name, description, parent_id, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
    [id, input.name.trim(), input.description, input.parentId, now, now],
  );

  return getDeckById(db, id)!;
}

export function updateDeck(db: DatabaseAdapter, deckId: string, rawInput: UpdateDeckInput): Deck | null {
  const existing = getDeckById(db, deckId);
  if (!existing) {
    return null;
  }
  const input = UpdateDeckInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `UPDATE fl_decks
     SET name = ?, description = ?, parent_id = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.name?.trim() ?? existing.name,
      input.description === undefined ? existing.description : input.description,
      input.parentId === undefined ? existing.parentId : input.parentId,
      now,
      deckId,
    ],
  );

  return getDeckById(db, deckId);
}

export function createFlashcards(
  db: DatabaseAdapter,
  rawInput: CreateFlashcardInput,
): Flashcard[] {
  const input = CreateFlashcardInputSchema.parse(rawInput);
  const now = nowIso();
  const noteId = createId('fl_note');
  const normalizedTags = [...new Set(input.tags.map(normalizeTag).filter(Boolean))];
  const deckId = input.deckId || DEFAULT_FLASH_DECK_ID;
  const cards: Array<{
    id: string;
    front: string;
    back: string;
    templateOrdinal: number;
  }> = [
    {
      id: createId('fl_card'),
      front: input.front.trim(),
      back: input.back.trim(),
      templateOrdinal: 0,
    },
  ];

  if (input.cardType === 'reversed' && input.back.trim()) {
    cards.push({
      id: createId('fl_card'),
      front: input.back.trim(),
      back: input.front.trim(),
      templateOrdinal: 1,
    });
  }

  db.transaction(() => {
    for (const card of cards) {
      db.execute(
        `INSERT INTO fl_cards (
          id, note_id, deck_id, card_type, template_ordinal, front, back, tags_json, queue,
          interval_days, ease, due_at, last_review_at, review_count, lapse_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', 0, 2.5, NULL, NULL, 0, 0, ?, ?)`,
        [
          card.id,
          noteId,
          deckId,
          input.cardType,
          card.templateOrdinal,
          card.front,
          card.back,
          JSON.stringify(normalizedTags),
          now,
          now,
        ],
      );
    }
  });

  return listCardsForDeck(db, deckId).filter((card) => card.noteId === noteId);
}

export function listCardsForDeck(db: DatabaseAdapter, deckId: string): Flashcard[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM fl_cards
       WHERE deck_id = ?
       ORDER BY updated_at DESC, created_at DESC`,
      [deckId],
    )
    .map(rowToFlashcard);
}

export function listDueFlashcards(
  db: DatabaseAdapter,
  deckId?: string,
  referenceAt = nowIso(),
  limit = 25,
): Flashcard[] {
  const conditions = [
    `(queue = 'new' OR (queue NOT IN ('suspended', 'buried') AND due_at IS NOT NULL AND due_at <= ?))`,
  ];
  const params: unknown[] = [referenceAt];

  if (deckId) {
    conditions.push(`deck_id = ?`);
    params.push(deckId);
  }

  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM fl_cards
       WHERE ${conditions.join(' AND ')}
       ORDER BY CASE WHEN queue = 'new' THEN 1 ELSE 0 END ASC, COALESCE(due_at, created_at) ASC
       LIMIT ?`,
      [...params, limit],
    )
    .map(rowToFlashcard);
}

export function getFlashcardById(db: DatabaseAdapter, cardId: string): Flashcard | null {
  const row = db.query<Record<string, unknown>>(`SELECT * FROM fl_cards WHERE id = ?`, [cardId])[0];
  return row ? rowToFlashcard(row) : null;
}

export function rateFlashcard(
  db: DatabaseAdapter,
  cardId: string,
  rawRating: CardRating,
  reviewedAt = nowIso(),
): Flashcard | null {
  const card = getFlashcardById(db, cardId);
  if (!card) {
    return null;
  }
  const rating = CardRatingSchema.parse(rawRating);
  const next = scheduleFlashcard(card, rating, reviewedAt);
  const reviewLogId = createId('fl_review_log');

  db.transaction(() => {
    db.execute(
      `UPDATE fl_cards
       SET queue = ?, interval_days = ?, ease = ?, due_at = ?, last_review_at = ?,
           review_count = ?, lapse_count = ?, updated_at = ?
       WHERE id = ?`,
      [
        next.queue,
        next.intervalDays,
        next.ease,
        next.dueAt,
        next.lastReviewAt,
        next.reviewCount,
        next.lapseCount,
        reviewedAt,
        cardId,
      ],
    );

    db.execute(
      `INSERT INTO fl_review_logs (
        id, card_id, rating, scheduled_before_at, scheduled_after_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [reviewLogId, cardId, rating, card.dueAt, next.dueAt, reviewedAt],
    );
  });

  return getFlashcardById(db, cardId);
}

export function listReviewLogsForCard(db: DatabaseAdapter, cardId: string): ReviewLog[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM fl_review_logs WHERE card_id = ? ORDER BY reviewed_at DESC`,
      [cardId],
    )
    .map(rowToReviewLog);
}

export function getFlashSetting(db: DatabaseAdapter, key: string): string | null {
  const row = db.query<{ value: string }>(`SELECT value FROM fl_settings WHERE key = ?`, [key])[0];
  return row?.value ?? null;
}

export function setFlashSetting(db: DatabaseAdapter, key: string, value: string): FlashSetting {
  db.execute(
    `INSERT INTO fl_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );

  return FlashSettingSchema.parse({ key, value });
}

export function getFlashDashboard(
  db: DatabaseAdapter,
  referenceDate = dateOnly(nowIso()),
): FlashDashboard {
  const referenceAt = `${referenceDate}T23:59:59.999Z`;
  const deckCount = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM fl_decks`)[0]?.count ?? 0;
  const cardCount = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM fl_cards`)[0]?.count ?? 0;
  const newCount = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM fl_cards WHERE queue = 'new'`)[0]?.count ?? 0;
  const dueCount =
    db.query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM fl_cards
       WHERE queue NOT IN ('new', 'suspended', 'buried')
         AND due_at IS NOT NULL
         AND due_at <= ?`,
      [referenceAt],
    )[0]?.count ?? 0;
  const reviewedToday =
    db.query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM fl_review_logs
       WHERE substr(reviewed_at, 1, 10) = ?`,
      [referenceDate],
    )[0]?.count ?? 0;
  const dailyTarget = Number(getFlashSetting(db, 'dailyStudyTarget') ?? '1');
  const studyDates = db
    .query<{ review_date: string }>(
      `SELECT substr(reviewed_at, 1, 10) as review_date
       FROM fl_review_logs
       GROUP BY substr(reviewed_at, 1, 10)
       HAVING COUNT(*) >= ?
       ORDER BY review_date DESC`,
      [dailyTarget],
    )
    .map((row) => row.review_date);
  const streak = calculateStudyStreak(studyDates, referenceDate);

  return FlashDashboardSchema.parse({
    deckCount,
    cardCount,
    newCount,
    dueCount,
    reviewedToday,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
  });
}
