export {
  normalizeItemName,
  resolveItemName,
  itemsMatch,
  fuzzyItemMatch,
} from './name-normalizer';
export {
  classifyExpiration,
  daysUntilExpiration,
  getExpirationColor,
  getExpirationLabel,
} from './expiration';
export { previewDeduction, deductPantryForRecipe } from './deduction';
export {
  matchRecipesToPantry,
  suggestRecipesForExpiringItems,
  calculateMaxServings,
} from './matching';
export { lookupBarcode, mapOffCategoryToSection } from './open-food-facts';
export type { OffLookupResult, OffNutritionData } from './open-food-facts';
export { identifyFood } from './food-recognition';
export type { FoodRecognitionResult } from './food-recognition';
