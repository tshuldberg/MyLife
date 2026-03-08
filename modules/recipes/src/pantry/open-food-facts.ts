import { z } from 'zod';
import type { GrocerySection } from '../types';

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const USER_AGENT = 'MyRecipes/1.0 (privacy-first recipe app)';
const TIMEOUT_MS = 10_000;

/** Zod schema for Open Food Facts API response (lenient parsing). */
const OffProductSchema = z.object({
  code: z.string(),
  status: z.number(),
  product: z
    .object({
      product_name: z.string().optional().default(''),
      brands: z.string().optional().default(''),
      categories_tags: z.array(z.string()).optional().default([]),
      nutriments: z
        .object({
          'energy-kcal_100g': z.number().optional(),
          fat_100g: z.number().optional(),
          'saturated-fat_100g': z.number().optional(),
          carbohydrates_100g: z.number().optional(),
          fiber_100g: z.number().optional(),
          sugars_100g: z.number().optional(),
          proteins_100g: z.number().optional(),
          sodium_100g: z.number().optional(),
        })
        .optional()
        .default({}),
      serving_size: z.string().optional(),
      image_url: z.string().optional(),
    })
    .optional(),
});

export interface OffNutritionData {
  source: 'open_food_facts';
  barcode: string;
  product_name: string | null;
  brand: string | null;
  serving_size_text: string | null;
  calories: number | null;
  fat_g: number | null;
  saturated_fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  protein_g: number | null;
  sodium_mg: number | null;
}

export interface OffLookupResult {
  found: boolean;
  productName: string | null;
  brand: string | null;
  category: GrocerySection;
  nutrition: OffNutritionData | null;
  imageUrl: string | null;
}

export const NOT_FOUND: OffLookupResult = {
  found: false,
  productName: null,
  brand: null,
  category: 'other',
  nutrition: null,
  imageUrl: null,
};

/**
 * Look up a barcode via the Open Food Facts API.
 * Only called on explicit user action (barcode scan).
 * Returns product info and nutrition data when available.
 */
export async function lookupBarcode(
  barcode: string,
): Promise<OffLookupResult> {
  let response: Response;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    response = await fetch(`${OFF_API_BASE}/${barcode}.json`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });

    clearTimeout(timer);
  } catch {
    return NOT_FOUND;
  }

  if (!response.ok) return NOT_FOUND;

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return NOT_FOUND;
  }

  const parsed = OffProductSchema.safeParse(json);
  if (!parsed.success || !parsed.data.product || parsed.data.status !== 1) {
    return NOT_FOUND;
  }

  const { product } = parsed.data;
  const productName = product.product_name || null;
  const brand = product.brands || null;
  const category = mapOffCategoryToSection(product.categories_tags);
  const imageUrl = product.image_url ?? null;

  const n = product.nutriments;
  const hasAnyNutrition =
    n['energy-kcal_100g'] !== undefined ||
    n.fat_100g !== undefined ||
    n.proteins_100g !== undefined ||
    n.carbohydrates_100g !== undefined;

  const nutrition: OffNutritionData | null = hasAnyNutrition
    ? {
        source: 'open_food_facts',
        barcode,
        product_name: productName,
        brand,
        serving_size_text: product.serving_size ?? null,
        calories: n['energy-kcal_100g'] ?? null,
        fat_g: n.fat_100g ?? null,
        saturated_fat_g: n['saturated-fat_100g'] ?? null,
        carbs_g: n.carbohydrates_100g ?? null,
        fiber_g: n.fiber_100g ?? null,
        sugar_g: n.sugars_100g ?? null,
        protein_g: n.proteins_100g ?? null,
        sodium_mg:
          n.sodium_100g !== undefined
            ? Math.round(n.sodium_100g * 1000)
            : null,
      }
    : null;

  return {
    found: true,
    productName,
    brand,
    category,
    nutrition,
    imageUrl,
  };
}

/** Category tag prefixes mapped to grocery sections. */
const CATEGORY_MAP: ReadonlyArray<[string, GrocerySection]> = [
  ['en:dairies', 'dairy'],
  ['en:milks', 'dairy'],
  ['en:cheeses', 'dairy'],
  ['en:yogurts', 'dairy'],
  ['en:butters', 'dairy'],
  ['en:meats', 'meat'],
  ['en:poultry', 'meat'],
  ['en:fishes', 'meat'],
  ['en:seafoods', 'meat'],
  ['en:fruits', 'produce'],
  ['en:vegetables', 'produce'],
  ['en:fresh-foods', 'produce'],
  ['en:frozen-foods', 'frozen'],
  ['en:frozen', 'frozen'],
  ['en:breads', 'bakery'],
  ['en:pastries', 'bakery'],
  ['en:baked-goods', 'bakery'],
  ['en:beverages', 'beverages'],
  ['en:drinks', 'beverages'],
  ['en:waters', 'beverages'],
  ['en:juices', 'beverages'],
  ['en:sodas', 'beverages'],
  ['en:coffees', 'beverages'],
  ['en:teas', 'beverages'],
  ['en:snacks', 'snacks'],
  ['en:chips', 'snacks'],
  ['en:crackers', 'snacks'],
  ['en:chocolates', 'snacks'],
  ['en:candies', 'snacks'],
  ['en:sauces', 'condiments'],
  ['en:condiments', 'condiments'],
  ['en:mustards', 'condiments'],
  ['en:ketchups', 'condiments'],
  ['en:dressings', 'condiments'],
  ['en:vinegars', 'condiments'],
  ['en:spices', 'pantry'],
  ['en:cereals', 'pantry'],
  ['en:pastas', 'pantry'],
  ['en:rices', 'pantry'],
  ['en:canned-foods', 'pantry'],
  ['en:oils', 'pantry'],
  ['en:flours', 'pantry'],
  ['en:sugars', 'pantry'],
  ['en:legumes', 'pantry'],
  ['en:nuts', 'pantry'],
];

/**
 * Map Open Food Facts category tags to our 10 grocery sections.
 * Checks each tag against known prefixes and returns the first match.
 * Defaults to 'other' if no match found.
 */
export function mapOffCategoryToSection(tags: string[]): GrocerySection {
  for (const tag of tags) {
    for (const [prefix, section] of CATEGORY_MAP) {
      if (tag === prefix || tag.startsWith(prefix + ':')) {
        return section;
      }
    }
  }
  return 'other';
}
