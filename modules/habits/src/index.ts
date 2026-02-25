export { HABITS_MODULE } from './definition';
export type { Habit, Frequency, Completion, StreakInfo } from './types';
export { HabitSchema, FrequencySchema, CompletionSchema } from './types';
export {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  countHabits,
  recordCompletion,
  getCompletions,
  getCompletionsForDate,
  deleteCompletion,
  getStreaks,
  getSetting,
  setSetting,
} from './db';
