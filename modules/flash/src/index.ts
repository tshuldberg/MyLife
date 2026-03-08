export { FLASH_MODULE } from './definition';

export type {
  FlashCardType,
  CardQueue,
  CardRating,
  Deck,
  Flashcard,
  ReviewLog,
  FlashSetting,
  FlashDashboard,
  CreateDeckInput,
  UpdateDeckInput,
  CreateFlashcardInput,
} from './types';

export {
  FlashCardTypeSchema,
  CardQueueSchema,
  CardRatingSchema,
  DeckSchema,
  FlashcardSchema,
  ReviewLogSchema,
  FlashSettingSchema,
  FlashDashboardSchema,
  CreateDeckInputSchema,
  UpdateDeckInputSchema,
  CreateFlashcardInputSchema,
} from './types';

export {
  DEFAULT_FLASH_DECK_ID,
  listDecks,
  getDeckById,
  createDeck,
  updateDeck,
  createFlashcards,
  listCardsForDeck,
  listDueFlashcards,
  getFlashcardById,
  rateFlashcard,
  listReviewLogsForCard,
  getFlashSetting,
  setFlashSetting,
  getFlashDashboard,
} from './db';

export {
  calculateStudyStreak,
  scheduleFlashcard,
} from './engine/scheduler';
