import { z } from 'zod';

export const FlashCardTypeSchema = z.enum(['basic', 'reversed']);
export type FlashCardType = z.infer<typeof FlashCardTypeSchema>;

export const CardQueueSchema = z.enum(['new', 'learning', 'review', 'suspended', 'buried']);
export type CardQueue = z.infer<typeof CardQueueSchema>;

export const CardRatingSchema = z.enum(['again', 'hard', 'good', 'easy']);
export type CardRating = z.infer<typeof CardRatingSchema>;

export const DeckSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
  isDefault: z.boolean(),
  cardCount: z.number().int(),
  newCount: z.number().int(),
  dueCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Deck = z.infer<typeof DeckSchema>;

export const FlashcardSchema = z.object({
  id: z.string(),
  noteId: z.string(),
  deckId: z.string(),
  cardType: FlashCardTypeSchema,
  templateOrdinal: z.number().int(),
  front: z.string(),
  back: z.string(),
  tags: z.array(z.string()),
  queue: CardQueueSchema,
  intervalDays: z.number(),
  ease: z.number(),
  dueAt: z.string().nullable(),
  lastReviewAt: z.string().nullable(),
  reviewCount: z.number().int(),
  lapseCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const ReviewLogSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  rating: CardRatingSchema,
  scheduledBeforeAt: z.string().nullable(),
  scheduledAfterAt: z.string().nullable(),
  reviewedAt: z.string(),
});
export type ReviewLog = z.infer<typeof ReviewLogSchema>;

export const FlashSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type FlashSetting = z.infer<typeof FlashSettingSchema>;

export const FlashDashboardSchema = z.object({
  deckCount: z.number().int(),
  cardCount: z.number().int(),
  newCount: z.number().int(),
  dueCount: z.number().int(),
  reviewedToday: z.number().int(),
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
});
export type FlashDashboard = z.infer<typeof FlashDashboardSchema>;

export const CreateDeckInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().default(null),
  parentId: z.string().nullable().default(null),
});
export type CreateDeckInput = z.input<typeof CreateDeckInputSchema>;

export const UpdateDeckInputSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});
export type UpdateDeckInput = z.input<typeof UpdateDeckInputSchema>;

export const CreateFlashcardInputSchema = z.object({
  deckId: z.string(),
  front: z.string().min(1),
  back: z.string().default(''),
  cardType: FlashCardTypeSchema.default('basic'),
  tags: z.array(z.string()).default([]),
});
export type CreateFlashcardInput = z.input<typeof CreateFlashcardInputSchema>;
