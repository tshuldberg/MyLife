export { JOURNAL_MODULE } from './definition';

export type {
  JournalMood,
  JournalEntry,
  JournalTag,
  JournalSetting,
  JournalSearchResult,
  JournalDashboard,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  JournalEntryFilter,
} from './types';

export {
  JournalMoodSchema,
  JournalEntrySchema,
  JournalTagSchema,
  JournalSettingSchema,
  JournalSearchResultSchema,
  JournalDashboardSchema,
  CreateJournalEntryInputSchema,
  UpdateJournalEntryInputSchema,
  JournalEntryFilterSchema,
} from './types';

export {
  createJournalEntry,
  getJournalEntryById,
  listJournalEntries,
  searchJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
  getEntriesForDate,
  listJournalTags,
  getJournalSetting,
  setJournalSetting,
  getJournalDashboard,
} from './db';

export {
  calculateJournalStreak,
  countWords,
  estimateReadingTimeMinutes,
  summarizeMoodDistribution,
} from './engine/stats';
