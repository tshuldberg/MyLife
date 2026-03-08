# @mylife/recipes

## Overview

Recipe management module that has expanded into MyGarden -- a unified cooking, meal planning, garden tracking, and event hosting platform. "Grow it, cook it, host it." Manage recipes with ingredients, steps, and tags; plan weekly meals with auto-generated shopping lists; track garden plants with watering schedules and harvests; host events with invite tokens, potluck claims, and RSVP management. Collections for organizing recipes, nutrition data tracking, URL recipe import, barcode-based pantry lookup, and AI food recognition. All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `RECIPES_MODULE` | ModuleDefinition | Module registration contract (id: `recipes`, name: MyGarden, prefix: `rc_`, tier: premium) |
| `Recipe`, `Ingredient`, `Step`, `RecipeTag`, `Difficulty` | Types | Core recipe domain types |
| `Collection`, `CreateCollection` | Types | Recipe collection types |
| `NutritionData`, `CreateNutritionData`, `UpdateNutritionData`, `NutritionSource` | Types | Nutrition data types |
| `MealPlan`, `MealPlanItem`, `MealSlot` | Types | Meal planning types |
| `GardenPlant`, `PlantLocation` | Types | Garden tracking types |
| `Event`, `EventResponse` | Types | Event/hosting types |
| Recipe CRUD | Functions | `createRecipe`, `getRecipes`, `getRecipeById`, `updateRecipe`, `deleteRecipe`, `countRecipes`, `getRecipeWithDetails`, `duplicateRecipe`, `getDefaultServings`, `getMeasurementSystem` |
| Collection CRUD | Functions | `getCollections`, `createCollection`, `updateCollection`, `deleteCollection`, `addRecipeToCollection`, `removeRecipeFromCollection` |
| Nutrition CRUD | Functions | `createNutritionData`, `getNutritionForItem`, `getNutritionByBarcode`, `updateNutritionData`, `deleteNutritionData` |
| Ingredient/Tag CRUD | Functions | `addIngredient`, `getIngredients`, `updateIngredient`, `deleteIngredient`, `addTag`, `getTags`, `deleteTag` |
| Meal planning | Functions | `getMealPlanWeek`, `upsertMealPlanItem`, `generateMealPlanShoppingList` |
| Garden | Functions | `createGardenPlant`, `getGardenLayouts`, `getGardenLayoutCells`, `upsertGardenLayout`, `markPlantWatered`, `getNextWateringDate`, `getRecipesForHarvest` |
| Events | Functions | `createEvent`, `addEventGuest`, `setEventMenu`, `respondToInvite`, `respondToInviteToken`, `getEventByInviteToken`, `getEventInviteBundle`, `getEventAllergyWarnings` |
| Parser | Functions | `parseIngredientText`, `parseRecipeFromText`, `parseRecipeFromHtml`, `parseIsoDuration` |
| Pantry | Functions | `lookupBarcode`, `identifyFood`, `mapOffCategoryToSection` |
| Utilities | Functions | `detectStepTimerMinutes`, `toFraction`, `formatQuantity`, `formatDuration` |

## Storage

- **Type:** sqlite
- **Table prefix:** `rc_` (recipes), `gd_` (garden), `ev_` (events)
- **Schema version:** 4
- **Key tables:**
  - Recipes: `rc_recipes`, `rc_ingredients`, `rc_steps`, `rc_recipe_tags`, `rc_settings`
  - Collections: `rc_collections`, `rc_recipe_collections`
  - Nutrition: `rc_nutrition_data`
  - Pantry: `rc_pantry_items`, `rc_pantry_staples`
  - Meal planning: `rc_meal_plans`, `rc_meal_plan_items`
  - Garden: `gd_plants`, `gd_plant_care_logs`, `gd_garden_layouts`, `gd_garden_journal`, `gd_harvests`, `gd_harvest_recipe_links`
  - Events: `ev_events`, `ev_guests`, `ev_rsvps`, `ev_menu_items`, `ev_potluck_claims`, `ev_event_timeline`

## Engines

- **db/mygarden.ts** -- Meal plan shopping list generation, garden watering schedule, harvest-to-recipe linking, event invite token system, allergy warning detection, potluck coordination
- **parser/url-parser.ts** -- HTML recipe extraction (JSON-LD, Microdata, Meta tag fallback) using cheerio
- **pantry/open-food-facts.ts** -- Barcode lookup via Open Food Facts API (product name, brand, category, nutrition)
- **pantry/food-recognition.ts** -- Claude Vision API food identification (name, category, confidence, labels)
- **detectStepTimerMinutes** -- Parses recipe step text to extract timer durations

## Schemas

- `Recipe`, `CreateRecipe`, `UpdateRecipe`, `Ingredient`, `CreateIngredient`, `RecipeTag`, `Difficulty`, `RecipeFilters`, `Step`
- `Collection`, `CreateCollection`
- `NutritionData`, `CreateNutritionData`, `UpdateNutritionData`, `NutritionSource`
- `MealPlan`, `MealPlanItem`, `MealSlot`
- `GardenPlant`, `PlantLocation`
- `Event`, `EventResponse`

## Test Coverage

- **Test files:** 16
- **Tests:** 189
- **Covered:** Recipe CRUD, ingredient/tag CRUD, pantry CRUD, collections CRUD, nutrition CRUD, MyGarden expansion, ingredient parser, text parser, URL parser (JSON-LD/Microdata/Meta), scaler, unit conversion, grocery categorize/merge, pantry name normalizer (62 tests), expiration classification, fractions, time formatting
- **Gaps:** Meal plan shopping list generation, event invite flow edge cases, open-food-facts network calls (would need mocking), food-recognition API calls

## Parity Status

- **Standalone repo:** MyRecipes (archived -- consolidated into hub)
- **Hub integration:** Full parity achieved. All standalone features migrated.

## Dependencies

- `zod` ^3.24.0 (runtime)
- `cheerio` ^1.2.0 (runtime -- URL recipe parsing)
- `@mylife/db` (peer -- DatabaseAdapter)
- `@mylife/module-registry` (peer -- ModuleDefinition)

## Key Files

- `src/definition.ts` -- Module definition (4 migrations, 25+ tables across 3 domains)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All TypeScript types and Zod schemas
- `src/db/crud.ts` -- Core recipe CRUD + detail/duplicate/settings helpers
- `src/db/collections.ts` -- Collections CRUD
- `src/db/nutrition.ts` -- Nutrition data CRUD
- `src/db/mygarden.ts` -- Meal planning, garden, and events CRUD
- `src/db/pantry.ts` -- Pantry inventory CRUD
- `src/db/schema.ts` -- All CREATE TABLE statements
- `src/parser/url-parser.ts` -- HTML recipe extraction engine
- `src/pantry/open-food-facts.ts` -- Barcode lookup service
- `src/pantry/food-recognition.ts` -- AI food identification service
