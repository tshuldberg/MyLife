# @mylife/recipes

## Overview

Recipe management module that has expanded into MyGarden -- a unified cooking, meal planning, garden tracking, and event hosting platform. "Grow it, cook it, host it." Manage recipes with ingredients, steps, and tags; plan weekly meals with auto-generated shopping lists; track garden plants with watering schedules and harvests; host events with invite tokens, potluck claims, and RSVP management. All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `RECIPES_MODULE` | ModuleDefinition | Module registration contract (id: `recipes`, name: MyGarden, prefix: `rc_`, tier: premium) |
| `Recipe`, `Ingredient`, `Step`, `RecipeTag`, `Difficulty` | Types | Core recipe domain types |
| `MealPlan`, `MealPlanItem`, `MealSlot` | Types | Meal planning types |
| `GardenPlant`, `PlantLocation` | Types | Garden tracking types |
| `Event`, `EventResponse` | Types | Event/hosting types |
| Recipe CRUD | Functions | `createRecipe`, `getRecipes`, `getRecipeById`, `updateRecipe`, `deleteRecipe`, `countRecipes` |
| Ingredient/Tag CRUD | Functions | `addIngredient`, `getIngredients`, `updateIngredient`, `deleteIngredient`, `addTag`, `getTags`, `deleteTag` |
| Meal planning | Functions | `getMealPlanWeek`, `upsertMealPlanItem`, `generateMealPlanShoppingList` |
| Garden | Functions | `createGardenPlant`, `getGardenLayouts`, `getGardenLayoutCells`, `upsertGardenLayout`, `markPlantWatered`, `getNextWateringDate`, `getRecipesForHarvest` |
| Events | Functions | `createEvent`, `addEventGuest`, `setEventMenu`, `respondToInvite`, `respondToInviteToken`, `getEventByInviteToken`, `getEventInviteBundle`, `getEventAllergyWarnings` |
| Utilities | Functions | `detectStepTimerMinutes` (step timer detection from recipe text) |

## Storage

- **Type:** sqlite
- **Table prefix:** `rc_` (recipes), `gd_` (garden), `ev_` (events)
- **Schema version:** 2
- **Key tables:**
  - Recipes: `rc_recipes`, `rc_ingredients`, `rc_steps`, `rc_recipe_tags`, `rc_settings`
  - Meal planning: `rc_meal_plans`, `rc_meal_plan_items`
  - Garden: `gd_plants`, `gd_plant_care_logs`, `gd_garden_layouts`, `gd_garden_journal`, `gd_harvests`, `gd_harvest_recipe_links`
  - Events: `ev_events`, `ev_guests`, `ev_rsvps`, `ev_menu_items`, `ev_potluck_claims`, `ev_event_timeline`

## Engines

- **db/mygarden.ts** -- Meal plan shopping list generation, garden watering schedule, harvest-to-recipe linking, event invite token system, allergy warning detection, potluck coordination
- **detectStepTimerMinutes** -- Parses recipe step text to extract timer durations

## Schemas

- `Recipe`, `CreateRecipe`, `UpdateRecipe`, `Ingredient`, `CreateIngredient`, `RecipeTag`, `Difficulty`, `RecipeFilters`, `Step`
- `MealPlan`, `MealPlanItem`, `MealSlot`
- `GardenPlant`, `PlantLocation`
- `Event`, `EventResponse`

## Test Coverage

- **Test files:** 2
- **Covered:** Core recipe CRUD (`__tests__/recipes.test.ts`), MyGarden expansion (`__tests__/mygarden.test.ts`)
- **Gaps:** Meal plan shopping list generation, event invite flow edge cases

## Parity Status

- **Standalone repo:** MyRecipes (exists as standalone submodule)
- **Hub integration:** wired

## Key Files

- `src/definition.ts` -- Module definition (2 migrations, 17+ tables across 3 domains)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- All TypeScript types and Zod schemas
- `src/db/crud.ts` -- Core recipe CRUD operations
- `src/db/mygarden.ts` -- Meal planning, garden, and events CRUD
- `src/db/schema.ts` -- All CREATE TABLE statements
