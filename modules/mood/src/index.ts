// Definition
export { MOOD_MODULE } from './definition';

// Types and schemas
export type {
  MoodLevel,
  MoodEntry,
  MoodActivity,
  MoodEmotionTag,
  MoodEntryActivity,
  MoodStreak,
  BreathingPattern,
  BreathingSession,
  MoodSetting,
  CreateMoodEntryInput,
  CreateActivityInput,
  UpdateActivityInput,
  CreateBreathingSessionInput,
  MoodEntryFilter,
  DailyAverage,
  MoodDashboard,
  ActivityCorrelation,
  WeeklyReport,
  PlutchikEmotion,
} from './types';

export {
  MoodLevelSchema,
  MoodEntrySchema,
  MoodActivitySchema,
  MoodEmotionTagSchema,
  MoodEntryActivitySchema,
  MoodStreakSchema,
  BreathingPatternSchema,
  BreathingSessionSchema,
  MoodSettingSchema,
  CreateMoodEntryInputSchema,
  CreateActivityInputSchema,
  UpdateActivityInputSchema,
  CreateBreathingSessionInputSchema,
  MoodEntryFilterSchema,
  PlutchikEmotionSchema,
  MoodScoreDescriptors,
  BREATHING_PATTERNS,
  DEFAULT_ACTIVITIES,
} from './types';

// CRUD
export {
  createMoodEntry,
  getMoodEntryById,
  getMoodEntries,
  getMoodEntriesByDate,
  deleteMoodEntry,
  getMoodEntryCount,
  getEmotionTagsForEntry,
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivitiesForEntry,
  seedDefaultActivities,
  createBreathingSession,
  getBreathingSessions,
  getSetting,
  setSetting,
  getDailyAverages,
  getMoodDashboard,
  getActivityCorrelations,
  getTopEmotions,
} from './db/crud';

// Engines
export {
  calculateStreaks,
  scoreToPixelColor,
  pearsonCorrelation,
  isSignificantCorrelation,
} from './engine/streak';

export {
  getBreathingCycleSteps,
  getCycleDuration,
  getCyclesForDuration,
} from './engine/breathing';

export type { BreathingStep } from './engine/breathing';
