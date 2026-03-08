export { ALL_TABLES, CREATE_INDEXES, SEED_SETTINGS, CREATE_FTS_TRIGGERS } from './schema';
export { NUTRITION_MIGRATION_V2, NUTRITION_MIGRATION_V3 } from './migrations';
export {
  createFood,
  getFoodById,
  getFoodByBarcode,
  searchFoodsFTS,
  searchFoods,
  updateFood,
  deleteFood,
  createFoodFromAIEstimate,
} from './foods';
export {
  createNutrient,
  getNutrients,
  getNutrientById,
  deleteNutrient,
  setFoodNutrient,
  getFoodNutrients,
  deleteFoodNutrient,
  deleteFoodNutrients,
} from './nutrients';
export {
  createFoodLogEntry,
  getFoodLogEntries,
  getFoodLogEntryById,
  updateFoodLogEntry,
  deleteFoodLogEntry,
  addFoodLogItem,
  getFoodLogItems,
  updateFoodLogItem,
  deleteFoodLogItem,
  getDailyTotals,
} from './food-log';
export type { DailyTotals } from './food-log';
export {
  createDailyGoals,
  getDailyGoals,
  getActiveGoals,
  updateDailyGoals,
  deleteDailyGoals,
} from './goals';
export {
  getSetting,
  setSetting,
  deleteSetting,
  getAllSettings,
} from './settings';
export {
  getCachedBarcode,
  setCachedBarcode,
  deleteCachedBarcode,
  purgeExpiredCache,
} from './barcode-cache';
