export { NUTRITION_MODULE } from './definition';

// Re-export all models
export * from './models';

// Re-export CRUD operations
export {
  createFood,
  getFoodById,
  getFoodByBarcode,
  searchFoodsFTS,
  searchFoods,
  updateFood,
  deleteFood,
  createFoodFromAIEstimate,
  createNutrient,
  getNutrients,
  getNutrientById,
  deleteNutrient,
  setFoodNutrient,
  getFoodNutrients,
  deleteFoodNutrient,
  deleteFoodNutrients,
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
  createDailyGoals,
  getDailyGoals,
  getActiveGoals,
  updateDailyGoals,
  deleteDailyGoals,
  getSetting,
  setSetting,
  deleteSetting,
  getAllSettings,
  getCachedBarcode,
  setCachedBarcode,
  deleteCachedBarcode,
  purgeExpiredCache,
} from './db';
export type { DailyTotals } from './db';

// Re-export migration for external use
export { NUTRITION_MIGRATION_V2, NUTRITION_MIGRATION_V3 } from './db/migrations';

// Re-export search
export { searchLocalFoods } from './search';
export type { FoodSearchOptions } from './search';

// Re-export seed data helpers
export { ALL_NUTRIENT_DEFS, getNutrientInserts, getUSDAFoodInserts, getUSDAFTSInserts } from './data';

// Re-export API clients and unified search
export { searchFoodUnified, lookupBarcode, searchOFF, lookupBarcodeOFF, searchFatSecret, lookupFatSecretFood, createRateLimiter, RateLimiter } from './api';
export type { FoodSearchResult, APIFoodSearchOptions, BarcodeResult, RateLimitConfig } from './api';

// Re-export barcode scanner
export { handleBarcodeScan } from './barcode';
export type { BarcodeScanResult } from './barcode';

// Re-export AI photo logging
export { analyzePhotoForFoods, isPhotoAnalysisError, FOOD_IDENTIFICATION_SYSTEM_PROMPT, buildUserPrompt } from './ai';
export type { AIFoodEstimate, PhotoAnalysisResult, PhotoAnalysisError } from './ai';

// Re-export stats and analytics
export {
  getDailySummary,
  getDailyGoalProgress,
  getMealBreakdown,
  getWeeklyTrends,
  getMonthlyTrends,
  getCalorieHistory,
  getMacroRatios,
  getMicronutrientSummary,
  getMicronutrientDeficiencies,
  getTopNutrientSources,
} from './stats';
export type { DailySummary, GoalProgress, MealBreakdown, DayTotal, MacroRatios, NutrientStatus, NutrientSummaryItem, NutrientDeficiency, TopNutrientSource } from './stats';

// Re-export MyFast integration
export { getEatingWindow, isInEatingWindow } from './integration';
export type { EatingWindow } from './integration';

// Re-export CSV export
export { exportFoodLogCSV, exportNutritionSummaryCSV } from './export';
