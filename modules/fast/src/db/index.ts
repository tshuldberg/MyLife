export {
  ALL_TABLES,
  CREATE_INDEXES,
  SEED_PROTOCOLS,
  SEED_SETTINGS,
  SEED_NOTIFICATIONS_CONFIG,
} from './schema';
export {
  startFast,
  endFast,
  getActiveFast,
  getFast,
  listFasts,
  countFasts,
  deleteFast,
  getProtocol,
  getProtocols,
  getSetting,
  setSetting,
} from './fasts';
export type { ListFastsOptions } from './fasts';
export {
  getWaterIntake,
  incrementWaterIntake,
  setWaterTarget,
  setWaterIntakeCount,
  resetWaterIntake,
} from './water';
export {
  getNotificationPreferences,
  setNotificationPreference,
} from './notifications';
export {
  createGoal,
  listGoals,
  getGoal,
  archiveGoal,
  deleteGoal,
  upsertGoal,
  getGoalProgress,
  refreshGoalProgress,
  listGoalProgress,
} from './goals';
