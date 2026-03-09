import type { DatabaseAdapter } from '@mylife/db';
import type {
  ExpiringRecipeSuggestion,
  MatchOptions,
  MatchedIngredient,
  PantryItem,
  RecipeMatch,
  StructuredIngredient,
} from '../types';
import { getPantryItems, getExpiringItems } from '../db/pantry';
import { getRecipes } from '../db/crud';
import { resolveItemName, fuzzyItemMatch } from './name-normalizer';
import { daysUntilExpiration } from './expiration';
import { areUnitsCompatible, convertUnit } from '../grocery/units';

const MATCH_THRESHOLD = 0.6;
const DEFAULT_MIN_MATCH_PERCENT = 50;
const DEFAULT_MAX_RESULTS = 50;

interface NormalizedPantryEntry {
  item: PantryItem;
  normalizedName: string;
}

export function matchRecipesToPantry(
  db: DatabaseAdapter,
  options?: MatchOptions,
): RecipeMatch[] {
  const minMatchPercent = options?.minMatchPercent ?? DEFAULT_MIN_MATCH_PERCENT;
  const maxResults = options?.maxResults ?? DEFAULT_MAX_RESULTS;
  const includeStaples = options?.includeStaplesAsAvailable ?? true;

  const pantryItems = getPantryItems(db);
  const pantryLookup: NormalizedPantryEntry[] = pantryItems.map((item) => ({
    item,
    normalizedName: resolveItemName(item.name),
  }));

  const stapleNames = new Set<string>();
  if (includeStaples) {
    const stapleRows = db.query<{ item: string }>('SELECT item FROM rc_pantry_staples');
    for (const row of stapleRows) {
      stapleNames.add(resolveItemName(row.item));
    }
  }

  const recipes = getRecipes(db, { limit: 500 });
  const results: RecipeMatch[] = [];

  for (const recipe of recipes) {
    const ingredients = db.query<StructuredIngredient>(
      `SELECT
        id,
        recipe_id,
        section,
        quantity_value,
        quantity,
        unit,
        COALESCE(item, name) AS item,
        name,
        prep_note,
        COALESCE(is_optional, 0) AS is_optional,
        sort_order
       FROM rc_ingredients
       WHERE recipe_id = ?
       ORDER BY sort_order`,
      [recipe.id],
    );
    if (ingredients.length === 0) continue;

    const availableIngredients: MatchedIngredient[] = [];
    const missingIngredients: MatchedIngredient[] = [];
    for (const ingredient of ingredients) {
      const matched = matchIngredientToPantry(ingredient, pantryLookup, stapleNames);
      if (matched.pantryItemId !== null || matched.matchScore > 0) {
        availableIngredients.push(matched);
      } else {
        missingIngredients.push(matched);
      }
    }

    const totalIngredients = ingredients.length;
    const matchedIngredients = availableIngredients.length;
    const matchPercentage =
      totalIngredients > 0 ? Math.round((matchedIngredients / totalIngredients) * 100) : 0;

    if (matchPercentage >= minMatchPercent) {
      results.push({
        recipeId: recipe.id,
        title: recipe.title,
        totalIngredients,
        matchedIngredients,
        missingIngredients,
        availableIngredients,
        matchPercentage,
        canMake:
          matchedIngredients === totalIngredients &&
          availableIngredients.every((ingredient) => ingredient.quantitySufficient !== false),
      });
    }
  }

  results.sort((left, right) => {
    if (right.matchPercentage !== left.matchPercentage) {
      return right.matchPercentage - left.matchPercentage;
    }
    return left.title.localeCompare(right.title);
  });

  return results.slice(0, maxResults);
}

export function suggestRecipesForExpiringItems(
  db: DatabaseAdapter,
  daysAhead = 5,
  maxResults = 10,
): ExpiringRecipeSuggestion[] {
  const expiringItems = getExpiringItems(db, daysAhead);
  if (expiringItems.length === 0) {
    return [];
  }

  const expiringLookup = expiringItems.map((item) => ({
    item,
    normalizedName: resolveItemName(item.name),
    daysLeft: item.expiration_date ? daysUntilExpiration(item.expiration_date) : daysAhead,
  }));

  const allMatches = matchRecipesToPantry(db, { minMatchPercent: 30, maxResults: 100 });
  const suggestions: ExpiringRecipeSuggestion[] = [];

  for (const match of allMatches) {
    const usedExpiringItems: Array<{ name: string; daysLeft: number }> = [];
    for (const available of match.availableIngredients) {
      for (const expiring of expiringLookup) {
        if (
          available.pantryItemId === expiring.item.id ||
          fuzzyItemMatch(available.ingredientItem, expiring.item.name) >= MATCH_THRESHOLD
        ) {
          usedExpiringItems.push({
            name: expiring.item.name,
            daysLeft: expiring.daysLeft,
          });
        }
      }
    }

    if (usedExpiringItems.length > 0) {
      suggestions.push({ recipe: match, expiringItems: usedExpiringItems });
    }
  }

  suggestions.sort((left, right) => {
    if (right.expiringItems.length !== left.expiringItems.length) {
      return right.expiringItems.length - left.expiringItems.length;
    }
    const leftMin = Math.min(...left.expiringItems.map((item) => item.daysLeft));
    const rightMin = Math.min(...right.expiringItems.map((item) => item.daysLeft));
    return leftMin - rightMin;
  });

  return suggestions.slice(0, maxResults);
}

export function calculateMaxServings(
  db: DatabaseAdapter,
  recipeId: string,
  baseServings = 1,
): number {
  if (baseServings <= 0) return 0;

  const pantryItems = getPantryItems(db);
  const ingredients = db.query<StructuredIngredient>(
    `SELECT
      id,
      recipe_id,
      section,
      quantity_value,
      quantity,
      unit,
      COALESCE(item, name) AS item,
      name,
      prep_note,
      COALESCE(is_optional, 0) AS is_optional,
      sort_order
     FROM rc_ingredients
     WHERE recipe_id = ?
     ORDER BY sort_order`,
    [recipeId],
  );

  let maxMultiplier = Number.POSITIVE_INFINITY;
  for (const ingredient of ingredients) {
    if (ingredient.is_optional || ingredient.quantity_value == null) {
      continue;
    }

    const pantryMatch = pantryItems
      .map((item) => ({ item, score: fuzzyItemMatch(ingredient.item, item.name) }))
      .filter((entry) => entry.score >= MATCH_THRESHOLD)
      .sort((left, right) => right.score - left.score)[0];

    if (!pantryMatch || pantryMatch.item.quantity == null) {
      return 0;
    }

    let available = pantryMatch.item.quantity;
    if (
      ingredient.unit &&
      pantryMatch.item.unit &&
      ingredient.unit !== pantryMatch.item.unit &&
      areUnitsCompatible(pantryMatch.item.unit, ingredient.unit)
    ) {
      const converted = convertUnit(pantryMatch.item.quantity, pantryMatch.item.unit, ingredient.unit);
      if (converted !== null) {
        available = converted;
      }
    }

    maxMultiplier = Math.min(maxMultiplier, available / ingredient.quantity_value);
  }

  if (!Number.isFinite(maxMultiplier)) {
    return baseServings;
  }

  return Math.max(0, Math.floor(maxMultiplier * baseServings));
}

function matchIngredientToPantry(
  ingredient: StructuredIngredient,
  pantryLookup: NormalizedPantryEntry[],
  stapleNames: Set<string>,
): MatchedIngredient {
  const resolvedName = resolveItemName(ingredient.item);

  let bestMatch: NormalizedPantryEntry | null = null;
  let bestScore = 0;
  for (const entry of pantryLookup) {
    const score = fuzzyItemMatch(ingredient.item, entry.item.name);
    if (score >= MATCH_THRESHOLD && score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch) {
    const quantityResult = checkQuantitySufficiency(ingredient, bestMatch.item);
    return {
      ingredientId: ingredient.id,
      ingredientItem: ingredient.item,
      pantryItemId: bestMatch.item.id,
      pantryItemName: bestMatch.item.name,
      matchScore: bestScore,
      quantitySufficient: quantityResult.sufficient,
      quantityNeeded: ingredient.quantity_value,
      quantityAvailable: quantityResult.available,
      unit: ingredient.unit,
    };
  }

  if (stapleNames.has(resolvedName)) {
    return {
      ingredientId: ingredient.id,
      ingredientItem: ingredient.item,
      pantryItemId: null,
      pantryItemName: null,
      matchScore: 1,
      quantitySufficient: null,
      quantityNeeded: ingredient.quantity_value,
      quantityAvailable: null,
      unit: ingredient.unit,
    };
  }

  return {
    ingredientId: ingredient.id,
    ingredientItem: ingredient.item,
    pantryItemId: null,
    pantryItemName: null,
    matchScore: 0,
    quantitySufficient: null,
    quantityNeeded: ingredient.quantity_value,
    quantityAvailable: null,
    unit: ingredient.unit,
  };
}

function checkQuantitySufficiency(
  ingredient: StructuredIngredient,
  pantryItem: PantryItem,
): { sufficient: boolean | null; available: number | null } {
  if (ingredient.quantity_value == null || pantryItem.quantity == null) {
    return { sufficient: null, available: pantryItem.quantity };
  }

  if (ingredient.unit === pantryItem.unit || (!ingredient.unit && !pantryItem.unit)) {
    return {
      sufficient: pantryItem.quantity >= ingredient.quantity_value,
      available: pantryItem.quantity,
    };
  }

  if (ingredient.unit && pantryItem.unit && areUnitsCompatible(ingredient.unit, pantryItem.unit)) {
    const converted = convertUnit(pantryItem.quantity, pantryItem.unit, ingredient.unit);
    if (converted !== null) {
      return {
        sufficient: converted >= ingredient.quantity_value,
        available: converted,
      };
    }
  }

  return { sufficient: null, available: pantryItem.quantity };
}
