import type { DatabaseAdapter } from '@mylife/db';

export interface RecipesImportResult {
  recipesImported: number;
  ingredientsImported: number;
  stepsImported: number;
  tagsImported: number;
  collectionsImported: number;
  groceryListsImported: number;
  groceryItemsImported: number;
  mealPlansImported: number;
  mealPlanItemsImported: number;
  settingsImported: number;
  errors: string[];
  warnings: string[];
}

/**
 * Import data from a standalone MyRecipes SQLite database into the hub database.
 * Reads from unprefixed tables in sourceDb, writes to rc_-prefixed tables in hubDb.
 *
 * Table mapping (standalone -> hub):
 *   recipes           -> rc_recipes
 *   ingredients        -> rc_ingredients
 *   steps              -> rc_steps
 *   tags + recipe_tags -> rc_recipe_tags (hub uses inline tags, not a separate tags table)
 *   collections        -> (not in hub schema, warning)
 *   recipe_collections -> (not in hub schema, warning)
 *   grocery_lists      -> (not in hub schema, warning)
 *   grocery_items      -> (not in hub schema, warning)
 *   preferences        -> rc_settings
 *   rc_meal_plans      -> rc_meal_plans (same prefix in both)
 *   rc_meal_plan_items -> rc_meal_plan_items (same prefix in both)
 *
 * Garden tables (gd_*, ev_*) share the same prefix in both standalone and hub,
 * so they are imported directly.
 */
export function importFromMyRecipes(
  sourceDb: DatabaseAdapter,
  hubDb: DatabaseAdapter,
): RecipesImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let recipesImported = 0;
  let ingredientsImported = 0;
  let stepsImported = 0;
  let tagsImported = 0;
  let collectionsImported = 0;
  let groceryListsImported = 0;
  let groceryItemsImported = 0;
  let mealPlansImported = 0;
  let mealPlanItemsImported = 0;
  let settingsImported = 0;

  hubDb.transaction(() => {
    // 1. Import recipes
    // Standalone: recipes(id, title, description, prep_time_min, cook_time_min, total_time_min,
    //   servings, yield_text, source_url, source_name, image_path, is_favorite, rating, notes, ...)
    // Hub: rc_recipes(id, title, description, servings, prep_time_mins, cook_time_mins,
    //   total_time_mins, difficulty, source_url, image_uri, is_favorite, rating, notes, ...)
    const recipes = sourceDb.query<Record<string, unknown>>('SELECT * FROM recipes');
    for (const r of recipes) {
      try {
        // Map standalone column names to hub column names
        // Standalone uses prep_time_min, hub uses prep_time_mins
        // Standalone uses image_path, hub uses image_uri
        // Standalone has yield_text and source_name which hub doesn't have
        const rating = (r.rating as number | null) ?? 0;

        hubDb.execute(
          `INSERT OR IGNORE INTO rc_recipes (id, title, description, servings, prep_time_mins, cook_time_mins, total_time_mins, source_url, image_uri, is_favorite, rating, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.title, r.description, r.servings, r.prep_time_min, r.cook_time_min, r.total_time_min, r.source_url, r.image_path, r.is_favorite, rating, r.notes, r.created_at, r.updated_at],
        );
        recipesImported++;

        if (r.yield_text) {
          warnings.push(`Recipe "${r.title}": yield_text "${r.yield_text}" not preserved (hub has no equivalent field).`);
        }
        if (r.source_name) {
          warnings.push(`Recipe "${r.title}": source_name "${r.source_name}" not preserved (hub has no equivalent field).`);
        }
      } catch (e) {
        errors.push(`Recipe ${r.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 2. Import ingredients
    // Standalone: ingredients(id, recipe_id, section, quantity, unit, item, prep_note, is_optional, sort_order)
    // Hub: rc_ingredients(id, recipe_id, name, quantity, unit, sort_order)
    const ingredients = sourceDb.query<Record<string, unknown>>('SELECT * FROM ingredients');
    for (const ing of ingredients) {
      try {
        // Hub uses "name" instead of "item"; combine item + prep_note for the name
        let name = ing.item as string;
        if (ing.prep_note) {
          name = `${name}, ${ing.prep_note}`;
        }
        if (ing.section) {
          // Prefix with section info if present
          warnings.push(
            `Ingredient "${name}" in recipe ${ing.recipe_id}: section "${ing.section}" not preserved as separate field.`,
          );
        }
        // Hub stores quantity as TEXT, standalone as REAL
        const quantity = ing.quantity != null ? String(ing.quantity) : null;

        hubDb.execute(
          `INSERT OR IGNORE INTO rc_ingredients (id, recipe_id, name, quantity, unit, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ing.id, ing.recipe_id, name, quantity, ing.unit, ing.sort_order],
        );
        ingredientsImported++;

        if ((ing.is_optional as number) === 1) {
          warnings.push(`Ingredient "${name}": is_optional flag not preserved (hub has no equivalent field).`);
        }
      } catch (e) {
        errors.push(`Ingredient ${ing.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 3. Import steps
    // Standalone: steps(id, recipe_id, section, step_number, instruction, timer_minutes, sort_order)
    // Hub: rc_steps(id, recipe_id, step_number, instruction, timer_minutes, sort_order)
    const steps = sourceDb.query<Record<string, unknown>>('SELECT * FROM steps');
    for (const s of steps) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO rc_steps (id, recipe_id, step_number, instruction, timer_minutes, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [s.id, s.recipe_id, s.step_number, s.instruction, s.timer_minutes, s.sort_order],
        );
        stepsImported++;

        if (s.section) {
          warnings.push(
            `Step ${s.step_number} in recipe ${s.recipe_id}: section "${s.section}" not preserved.`,
          );
        }
      } catch (e) {
        errors.push(`Step ${s.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 4. Import tags
    // Standalone uses a normalized tag system: tags(id, name, type, color) + recipe_tags(recipe_id, tag_id)
    // Hub uses inline tags: rc_recipe_tags(id, recipe_id, tag)
    // We need to join and flatten.
    try {
      const tagMap = new Map<string, string>();
      const tagRows = sourceDb.query<Record<string, unknown>>('SELECT * FROM tags');
      for (const t of tagRows) {
        tagMap.set(t.id as string, t.name as string);
      }

      const recipeTags = sourceDb.query<Record<string, unknown>>('SELECT * FROM recipe_tags');
      let tagId = 0;
      for (const rt of recipeTags) {
        try {
          const tagName = tagMap.get(rt.tag_id as string);
          if (!tagName) {
            warnings.push(`RecipeTag: tag_id "${rt.tag_id}" not found in tags table, skipping.`);
            continue;
          }

          // Generate a unique ID for the hub rc_recipe_tags row
          const hubTagId = `imported-tag-${++tagId}`;
          hubDb.execute(
            'INSERT OR IGNORE INTO rc_recipe_tags (id, recipe_id, tag) VALUES (?, ?, ?)',
            [hubTagId, rt.recipe_id, tagName],
          );
          tagsImported++;
        } catch (e) {
          errors.push(`RecipeTag: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch {
      // Tags table may not exist
    }

    // 5. Import collections (warning -- hub rc_ schema does not have collections)
    try {
      const collections = sourceDb.query<Record<string, unknown>>('SELECT * FROM collections');
      collectionsImported = collections.length;
      if (collectionsImported > 0) {
        warnings.push(
          `${collectionsImported} collection(s) skipped. Hub recipe module does not have a collections table.`,
        );
      }
    } catch {
      // Table may not exist
    }

    // 6. Import grocery lists (warning -- hub rc_ schema does not have grocery tables)
    try {
      const groceryLists = sourceDb.query<Record<string, unknown>>('SELECT * FROM grocery_lists');
      groceryListsImported = groceryLists.length;
      if (groceryListsImported > 0) {
        warnings.push(
          `${groceryListsImported} grocery list(s) skipped. Hub recipe module does not have grocery tables.`,
        );
      }
    } catch {
      // Table may not exist
    }

    try {
      const groceryItems = sourceDb.query<Record<string, unknown>>('SELECT * FROM grocery_items');
      groceryItemsImported = groceryItems.length;
    } catch {
      // Table may not exist
    }

    // 7. Import preferences as settings
    // Standalone: preferences(key, value) -> Hub: rc_settings(key, value)
    try {
      const prefs = sourceDb.query<Record<string, unknown>>('SELECT * FROM preferences');
      for (const p of prefs) {
        try {
          hubDb.execute(
            'INSERT OR IGNORE INTO rc_settings (key, value) VALUES (?, ?)',
            [p.key, p.value],
          );
          settingsImported++;
        } catch (e) {
          errors.push(`Preference ${p.key}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch {
      // Table may not exist
    }

    // 8. Import meal plans (same prefix in standalone and hub)
    try {
      const mealPlans = sourceDb.query<Record<string, unknown>>('SELECT * FROM rc_meal_plans');
      for (const mp of mealPlans) {
        try {
          hubDb.execute(
            `INSERT OR IGNORE INTO rc_meal_plans (id, week_start_date, created_at, updated_at)
             VALUES (?, ?, ?, ?)`,
            [mp.id, mp.week_start_date, mp.created_at, mp.updated_at],
          );
          mealPlansImported++;
        } catch (e) {
          errors.push(`MealPlan ${mp.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch {
      // Table may not exist
    }

    // 9. Import meal plan items
    try {
      const mealPlanItems = sourceDb.query<Record<string, unknown>>('SELECT * FROM rc_meal_plan_items');
      for (const mpi of mealPlanItems) {
        try {
          hubDb.execute(
            `INSERT OR IGNORE INTO rc_meal_plan_items (id, meal_plan_id, recipe_id, day_of_week, meal_slot, servings, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [mpi.id, mpi.meal_plan_id, mpi.recipe_id, mpi.day_of_week, mpi.meal_slot, mpi.servings, mpi.created_at, mpi.updated_at],
          );
          mealPlanItemsImported++;
        } catch (e) {
          errors.push(`MealPlanItem ${mpi.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch {
      // Table may not exist
    }

    // 10. Import garden tables (gd_* prefix is the same in standalone and hub)
    importGardenTables(sourceDb, hubDb, errors, warnings);

    // 11. Import event tables (ev_* prefix is the same in standalone and hub)
    importEventTables(sourceDb, hubDb, errors, warnings);
  });

  return {
    recipesImported,
    ingredientsImported,
    stepsImported,
    tagsImported,
    collectionsImported,
    groceryListsImported,
    groceryItemsImported,
    mealPlansImported,
    mealPlanItemsImported,
    settingsImported,
    errors,
    warnings,
  };
}

function importGardenTables(
  sourceDb: DatabaseAdapter,
  hubDb: DatabaseAdapter,
  errors: string[],
  warnings: string[],
): void {
  // gd_plants
  try {
    const plants = sourceDb.query<Record<string, unknown>>('SELECT * FROM gd_plants');
    for (const p of plants) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO gd_plants (id, species, location, planting_date, watering_interval_days, last_watered_at, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.species, p.location, p.planting_date, p.watering_interval_days, p.last_watered_at, p.notes, p.created_at, p.updated_at],
        );
      } catch (e) {
        errors.push(`Plant ${p.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // gd_plant_care_logs
  try {
    const careLogs = sourceDb.query<Record<string, unknown>>('SELECT * FROM gd_plant_care_logs');
    for (const cl of careLogs) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO gd_plant_care_logs (id, plant_id, care_type, performed_at, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [cl.id, cl.plant_id, cl.care_type, cl.performed_at, cl.notes, cl.created_at],
        );
      } catch (e) {
        errors.push(`PlantCareLog ${cl.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // gd_garden_layouts
  try {
    const layouts = sourceDb.query<Record<string, unknown>>('SELECT * FROM gd_garden_layouts');
    for (const l of layouts) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO gd_garden_layouts (id, name, grid_width, grid_height, cells_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [l.id, l.name, l.grid_width, l.grid_height, l.cells_json, l.created_at, l.updated_at],
        );
      } catch (e) {
        errors.push(`GardenLayout ${l.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // gd_garden_journal
  try {
    const journal = sourceDb.query<Record<string, unknown>>('SELECT * FROM gd_garden_journal');
    for (const j of journal) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO gd_garden_journal (id, plant_id, photo_path, note, identified_species, captured_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [j.id, j.plant_id, j.photo_path, j.note, j.identified_species, j.captured_at, j.created_at],
        );
      } catch (e) {
        errors.push(`GardenJournal ${j.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // gd_harvests
  try {
    const harvests = sourceDb.query<Record<string, unknown>>('SELECT * FROM gd_harvests');
    for (const h of harvests) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO gd_harvests (id, plant_id, item_name, quantity, unit, harvested_at, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [h.id, h.plant_id, h.item_name, h.quantity, h.unit, h.harvested_at, h.note, h.created_at],
        );
      } catch (e) {
        errors.push(`Harvest ${h.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // gd_harvest_recipe_links
  try {
    const links = sourceDb.query<Record<string, unknown>>('SELECT * FROM gd_harvest_recipe_links');
    for (const l of links) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO gd_harvest_recipe_links (id, harvest_id, recipe_id, match_reason, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [l.id, l.harvest_id, l.recipe_id, l.match_reason, l.created_at],
        );
      } catch (e) {
        errors.push(`HarvestRecipeLink ${l.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }
}

function importEventTables(
  sourceDb: DatabaseAdapter,
  hubDb: DatabaseAdapter,
  errors: string[],
  _warnings: string[],
): void {
  // ev_events
  try {
    const events = sourceDb.query<Record<string, unknown>>('SELECT * FROM ev_events');
    for (const ev of events) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO ev_events (id, title, event_date, event_time, location, description, capacity, invite_token, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [ev.id, ev.title, ev.event_date, ev.event_time, ev.location, ev.description, ev.capacity, ev.invite_token, ev.created_at, ev.updated_at],
        );
      } catch (e) {
        errors.push(`Event ${ev.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // ev_guests
  try {
    const guests = sourceDb.query<Record<string, unknown>>('SELECT * FROM ev_guests');
    for (const g of guests) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO ev_guests (id, event_id, name, contact, dietary_preferences, allergies, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [g.id, g.event_id, g.name, g.contact, g.dietary_preferences, g.allergies, g.created_at, g.updated_at],
        );
      } catch (e) {
        errors.push(`Guest ${g.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // ev_rsvps
  try {
    const rsvps = sourceDb.query<Record<string, unknown>>('SELECT * FROM ev_rsvps');
    for (const r of rsvps) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO ev_rsvps (id, event_id, guest_id, response, note, responded_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.event_id, r.guest_id, r.response, r.note, r.responded_at, r.created_at, r.updated_at],
        );
      } catch (e) {
        errors.push(`RSVP ${r.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // ev_menu_items
  try {
    const menuItems = sourceDb.query<Record<string, unknown>>('SELECT * FROM ev_menu_items');
    for (const mi of menuItems) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO ev_menu_items (id, event_id, recipe_id, course, servings, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [mi.id, mi.event_id, mi.recipe_id, mi.course, mi.servings, mi.created_at, mi.updated_at],
        );
      } catch (e) {
        errors.push(`MenuItem ${mi.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // ev_potluck_claims
  try {
    const claims = sourceDb.query<Record<string, unknown>>('SELECT * FROM ev_potluck_claims');
    for (const c of claims) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO ev_potluck_claims (id, event_id, guest_id, dish_name, note, claimed_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.event_id, c.guest_id, c.dish_name, c.note, c.claimed_at, c.created_at],
        );
      } catch (e) {
        errors.push(`PotluckClaim ${c.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }

  // ev_event_timeline
  try {
    const timeline = sourceDb.query<Record<string, unknown>>('SELECT * FROM ev_event_timeline');
    for (const t of timeline) {
      try {
        hubDb.execute(
          `INSERT OR IGNORE INTO ev_event_timeline (id, event_id, label, starts_at, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.event_id, t.label, t.starts_at, t.sort_order, t.created_at, t.updated_at],
        );
      } catch (e) {
        errors.push(`EventTimeline ${t.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    // Table may not exist
  }
}
