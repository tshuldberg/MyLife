export { JOURNAL_MODULE } from './definition';

export type {
  JournalMood,
  JournalPromptCategory,
  JournalNotebook,
  JournalEntry,
  JournalTag,
  JournalSetting,
  JournalPrompt,
  JournalSearchResult,
  JournalOnThisDayItem,
  JournalDashboard,
  CreateJournalNotebookInput,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  JournalEntryFilter,
  JournalExportBundle,
} from './types';

export {
  JournalMoodSchema,
  JournalPromptCategorySchema,
  JournalNotebookSchema,
  JournalEntrySchema,
  JournalTagSchema,
  JournalSettingSchema,
  JournalPromptSchema,
  JournalSearchResultSchema,
  JournalOnThisDayItemSchema,
  JournalDashboardSchema,
  CreateJournalNotebookInputSchema,
  CreateJournalEntryInputSchema,
  UpdateJournalEntryInputSchema,
  JournalEntryFilterSchema,
} from './types';

export {
  createJournalNotebook,
  getJournalNotebookById,
  listJournalNotebooks,
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
  listOnThisDayEntries,
  exportJournalData,
} from './db';

export {
  calculateJournalStreak,
  countWords,
  estimateReadingTimeMinutes,
  summarizeMoodDistribution,
} from './engine/stats';
export { getDailyJournalPrompt, listJournalPromptCategories } from './engine/prompts';
export { serializeJournalExport } from './engine/export';
