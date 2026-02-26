// Database layer — SQLite schema, CRUD operations

// Schema SQL
export {
  CREATE_BOOKS,
  CREATE_SHELVES,
  CREATE_BOOK_SHELVES,
  CREATE_READING_SESSIONS,
  CREATE_REVIEWS,
  CREATE_SHARE_EVENTS,
  CREATE_READER_DOCUMENTS,
  CREATE_READER_NOTES,
  CREATE_READER_PREFERENCES,
  CREATE_TAGS,
  CREATE_BOOK_TAGS,
  CREATE_READING_GOALS,
  CREATE_OL_CACHE,
  CREATE_IMPORT_LOG,
  CREATE_SETTINGS,
  CREATE_BOOKS_FTS,
  CREATE_FTS_TRIGGERS,
  CREATE_INDEXES,
  CREATE_SHARE_INDEXES,
  CREATE_READER_INDEXES,
  SEED_SYSTEM_SHELVES,
  ALL_TABLES,
} from './schema';

// Book CRUD
export {
  createBook,
  getBook,
  getBooks,
  updateBook,
  deleteBook,
  searchBooksLocal,
  getBookByISBNLocal,
  getBookCount,
} from './books';
export type { BookFilters } from './books';

// Shelf CRUD
export {
  createShelf,
  getShelf,
  getShelves,
  getSystemShelves,
  updateShelf,
  deleteShelf,
  refreshShelfCount,
  slugify,
} from './shelves';

// Book-Shelf junction
export {
  addBookToShelf,
  removeBookFromShelf,
  getBooksOnShelf,
  getShelvesForBook,
  moveBookToShelf,
} from './book-shelves';

// Reading session CRUD
export {
  createSession,
  getSession,
  getSessions,
  getSessionsForBook,
  updateSession,
  startReading,
  finishReading,
  markDNF,
  getCurrentlyReading,
} from './reading-sessions';

// Review CRUD
export {
  createReview,
  getReview,
  getReviewForBook,
  getReviewsForBook,
  updateReview,
  deleteReview,
  getFavorites,
} from './reviews';

// Sharing primitives
export {
  createShareEvent,
  getShareEvent,
  getShareEventsForObject,
  listShareEventsVisibleToUser,
  updateShareEvent,
  updateShareEventVisibility,
  deleteShareEvent,
} from './sharing';
export type { ShareEventFilters } from './sharing';

// Reader documents and notes
export {
  createReaderDocument,
  getReaderDocument,
  getReaderDocuments,
  updateReaderDocument,
  updateReaderDocumentProgress,
  deleteReaderDocument,
} from './reader-documents';
export type { ReaderDocumentFilters } from './reader-documents';

export {
  createReaderNote,
  getReaderNote,
  getReaderNotes,
  updateReaderNote,
  deleteReaderNote,
} from './reader-notes';

export {
  getReaderPreferences,
  upsertReaderPreferences,
} from './reader-preferences';

// Tag CRUD
export {
  createTag,
  getTag,
  getTags,
  updateTag,
  deleteTag,
  addTagToBook,
  removeTagFromBook,
  getTagsForBook,
  getBooksWithTag,
} from './tags';

// Reading goal CRUD
export {
  createGoal,
  getGoal,
  getGoalForYear,
  updateGoal,
  getGoalProgress,
} from './reading-goals';
export type { GoalProgress } from './reading-goals';

// Open Library cache
export {
  cacheResponse,
  getCachedResponse,
  isCached,
  markCoverDownloaded,
  clearOldCache,
} from './ol-cache';

// Import log
export {
  logImport,
  getImportHistory,
} from './import-log';
