'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  // Foods CRUD
  createFood,
  getFoodById,
  getFoodByBarcode,
  searchFoods,
  searchFoodsFTS,
  updateFood,
  deleteFood,
  createFoodFromAIEstimate,
  // Food log
  createFoodLogEntry,
  getFoodLogEntries,
  updateFoodLogEntry,
  deleteFoodLogEntry,
  addFoodLogItem,
  getFoodLogItems,
  updateFoodLogItem,
  deleteFoodLogItem,
  getDailyTotals,
  // Goals
  createDailyGoals,
  getActiveGoals,
  getDailyGoals,
  updateDailyGoals,
  deleteDailyGoals,
  // Settings
  getSetting,
  setSetting,
  deleteSetting,
  getAllSettings,
  // Nutrients
  getNutrients,
  getFoodNutrients,
  // Stats
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
  // Integration
  getEatingWindow,
  isInEatingWindow,
  // Export
  exportFoodLogCSV,
  exportNutritionSummaryCSV,
  // API search
  searchFoodUnified,
} from '@mylife/nutrition';

function db() {
  ensureModuleMigrations('nutrition');
  return getAdapter();
}

// --- Diary ---

export async function fetchDailySummary(date: string) {
  return getDailySummary(db(), date);
}

export async function fetchGoalProgress(date: string) {
  try { return getDailyGoalProgress(db(), date); } catch { return null; }
}

export async function fetchMealBreakdown(date: string) {
  return getMealBreakdown(db(), date);
}

export async function fetchDailyTotals(date: string) {
  return getDailyTotals(db(), date);
}

export async function fetchFoodLogEntries(date: string) {
  return getFoodLogEntries(db(), date);
}

export async function fetchFoodLogItems(logId: string) {
  return getFoodLogItems(db(), logId);
}

export async function fetchEatingWindow() {
  try { return getEatingWindow(db()); } catch { return null; }
}

export async function fetchIsInEatingWindow() {
  try { return isInEatingWindow(db()); } catch { return null; }
}

// --- Food Log Mutations ---

export async function doCreateFoodLogEntry(id: string, input: { date: string; mealType: string; notes?: string }) {
  createFoodLogEntry(db(), id, input);
}

export async function doUpdateFoodLogEntry(id: string, updates: Partial<{ mealType: string; notes: string }>) {
  updateFoodLogEntry(db(), id, updates);
}

export async function doDeleteFoodLogEntry(id: string) {
  deleteFoodLogEntry(db(), id);
}

export async function doAddFoodLogItem(
  id: string,
  input: { logId: string; foodId: string; servingCount?: number; calories: number; proteinG: number; carbsG: number; fatG: number },
) {
  addFoodLogItem(db(), id, input);
}

export async function doUpdateFoodLogItem(
  id: string,
  updates: Partial<{ servingCount: number; calories: number; proteinG: number; carbsG: number; fatG: number }>,
) {
  updateFoodLogItem(db(), id, updates);
}

export async function doDeleteFoodLogItem(id: string) {
  deleteFoodLogItem(db(), id);
}

// --- Foods ---

export async function fetchFoodById(id: string) {
  return getFoodById(db(), id);
}

export async function fetchFoodByBarcode(barcode: string) {
  return getFoodByBarcode(db(), barcode);
}

export async function doSearchFoods(query: string, limit = 50) {
  const d = db();
  try {
    const results = searchFoodsFTS(d, query, limit);
    if (results.length > 0) return results;
  } catch { /* FTS may not be available */ }
  return searchFoods(d, query, limit);
}

export async function doSearchFoodUnified(query: string, source?: string, limit?: number) {
  try {
    return await searchFoodUnified(db(), { query, source: (source as 'all') ?? 'all', limit: limit ?? 50 });
  } catch {
    return [];
  }
}

export async function doCreateFood(
  id: string,
  input: {
    name: string;
    brand?: string;
    servingSize: number;
    servingUnit: string;
    calories: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fiberG?: number;
    sugarG?: number;
    sodiumMg?: number;
    source?: string;
    barcode?: string;
  },
) {
  createFood(db(), id, input);
}

export async function doUpdateFood(
  id: string,
  updates: Partial<{
    name: string;
    brand: string;
    servingSize: number;
    servingUnit: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>,
) {
  updateFood(db(), id, updates);
}

export async function doDeleteFood(id: string) {
  deleteFood(db(), id);
}

// --- Nutrients ---

export async function fetchFoodNutrients(foodId: string) {
  const d = db();
  const nutrients = getFoodNutrients(d, foodId);
  const allNutrients = getNutrients(d);
  return nutrients.map((fn) => {
    const nutrient = allNutrients.find((n) => n.id === fn.nutrientId);
    return { ...fn, name: nutrient?.name ?? '', unit: nutrient?.unit ?? '', rda: nutrient?.rdaValue ?? null };
  });
}

// --- Goals ---

export async function fetchActiveGoals(date: string) {
  try { return getActiveGoals(db(), date); } catch { return null; }
}

export async function fetchAllGoals() {
  return getDailyGoals(db());
}

export async function doCreateGoals(
  id: string,
  input: { calories: number; proteinG: number; carbsG: number; fatG: number; effectiveDate: string },
) {
  createDailyGoals(db(), id, input);
}

export async function doUpdateGoals(
  id: string,
  updates: Partial<{ calories: number; proteinG: number; carbsG: number; fatG: number; effectiveDate: string }>,
) {
  updateDailyGoals(db(), id, updates);
}

export async function doDeleteGoals(id: string) {
  deleteDailyGoals(db(), id);
}

// --- Settings ---

export async function fetchSetting(key: string) {
  try { return getSetting(db(), key) ?? null; } catch { return null; }
}

export async function fetchAllSettings() {
  try { return getAllSettings(db()); } catch { return {}; }
}

export async function doSetSetting(key: string, value: string) {
  setSetting(db(), key, value);
}

export async function doDeleteSetting(key: string) {
  deleteSetting(db(), key);
}

// --- Stats / Dashboard ---

export async function fetchMacroRatios(startDate: string, endDate: string) {
  try { return getMacroRatios(db(), startDate, endDate); } catch { return null; }
}

export async function fetchMicronutrientSummary(date: string) {
  try { return getMicronutrientSummary(db(), date); } catch { return []; }
}

export async function fetchMicronutrientDeficiencies(days: number) {
  try { return getMicronutrientDeficiencies(db(), days); } catch { return []; }
}

export async function fetchTopNutrientSources(nutrientId: string, limit = 10) {
  try { return getTopNutrientSources(db(), nutrientId, limit); } catch { return []; }
}

// --- Trends ---

export async function fetchWeeklyTrends(weekStartDate: string) {
  try { return getWeeklyTrends(db(), weekStartDate); } catch { return []; }
}

export async function fetchMonthlyTrends(year: number, month: number) {
  try { return getMonthlyTrends(db(), year, month); } catch { return []; }
}

export async function fetchCalorieHistory(days: number) {
  try { return getCalorieHistory(db(), days); } catch { return []; }
}

// --- Export ---

export async function doExportFoodLog(startDate?: string, endDate?: string) {
  return exportFoodLogCSV(db(), startDate, endDate);
}

export async function doExportNutritionSummary(startDate?: string, endDate?: string) {
  return exportNutritionSummaryCSV(db(), startDate, endDate);
}
