import type { DatabaseAdapter } from '@mylife/db';
import {
  type ConsolidatedShoppingItem,
  type CookingStepWithTimer,
  type Event,
  type EventAllergyWarning,
  type EventBundle,
  type EventCourse,
  type EventGuest,
  type EventInviteBundle,
  type EventResponse,
  type EventTimelineItem,
  type GardenJournalEntry,
  type GardenLayout,
  type GardenLayoutCell,
  type GardenPlant,
  type GardenPlantDashboard,
  type Harvest,
  type MealPlan,
  type MealPlanItem,
  type MealPlanWeek,
  type MealSlot,
  type PlantCareLog,
  type PlantCareType,
  type PlantLocation,
  type SubstitutionSuggestion,
  type StructuredIngredient,
} from '../types';
import { generateShoppingList } from '../grocery';
import { areUnitsCompatible, convertUnit } from '../grocery/units';
import { resolveItemName } from '../pantry/name-normalizer';
import { getPantryItems } from './pantry';
import { getStructuredIngredients } from './crud';

const SUBSTITUTION_MAP: Record<string, Array<{ substitute: string; quantity_hint: string }>> = {
  milk: [
    { substitute: 'oat milk', quantity_hint: '1:1' },
    { substitute: 'almond milk', quantity_hint: '1:1' },
    { substitute: 'water + butter', quantity_hint: '3/4 cup water + 1/4 cup butter per cup' },
  ],
  egg: [
    { substitute: 'flax egg', quantity_hint: '1 tbsp flax meal + 3 tbsp water per egg' },
    { substitute: 'chia egg', quantity_hint: '1 tbsp chia + 3 tbsp water per egg' },
    { substitute: 'unsweetened applesauce', quantity_hint: '1/4 cup per egg' },
  ],
  butter: [
    { substitute: 'olive oil', quantity_hint: '3/4 amount' },
    { substitute: 'ghee', quantity_hint: '1:1' },
    { substitute: 'coconut oil', quantity_hint: '1:1' },
  ],
  onion: [
    { substitute: 'shallot', quantity_hint: '1:1 by weight' },
    { substitute: 'leek', quantity_hint: '1:1 by volume' },
    { substitute: 'onion powder', quantity_hint: '1 tsp per 1/2 cup chopped onion' },
  ],
  garlic: [
    { substitute: 'garlic powder', quantity_hint: '1/8 tsp per clove' },
    { substitute: 'shallot', quantity_hint: '1 small shallot per 2 cloves' },
    { substitute: 'asafoetida', quantity_hint: 'pinch for aroma only' },
  ],
  flour: [
    { substitute: 'all-purpose flour', quantity_hint: '1:1' },
    { substitute: 'gluten-free flour blend', quantity_hint: '1:1' },
    { substitute: 'almond flour', quantity_hint: '1:1 with extra binder' },
  ],
  sugar: [
    { substitute: 'brown sugar', quantity_hint: '1:1' },
    { substitute: 'honey', quantity_hint: '3/4 cup per cup sugar' },
    { substitute: 'maple syrup', quantity_hint: '3/4 cup per cup sugar' },
  ],
};

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeWeekStartDate(date: string | Date): string {
  const value = typeof date === 'string' ? new Date(`${date}T00:00:00.000Z`) : new Date(date.getTime());
  const day = value.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  value.setUTCDate(value.getUTCDate() - diffToMonday);
  value.setUTCHours(0, 0, 0, 0);
  return value.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function clampGrid(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(2, Math.min(24, Math.floor(value)));
}

function sanitizeLayoutCells(cells: GardenLayoutCell[]): GardenLayoutCell[] {
  const seen = new Set<string>();
  const clean: GardenLayoutCell[] = [];

  for (const cell of cells) {
    const x = Math.max(0, Math.floor(cell.x));
    const y = Math.max(0, Math.floor(cell.y));
    const key = `${x}:${y}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    clean.push({
      x,
      y,
      plantId: cell.plantId ?? null,
      species: cell.species ?? null,
    });
  }

  return clean;
}

function parseLayoutCells(cellsJson: string): GardenLayoutCell[] {
  try {
    const parsed = JSON.parse(cellsJson) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const rows: GardenLayoutCell[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      const row = entry as Record<string, unknown>;
      const x = typeof row.x === 'number' ? row.x : Number(row.x);
      const y = typeof row.y === 'number' ? row.y : Number(row.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        continue;
      }
      rows.push({
        x,
        y,
        plantId: typeof row.plantId === 'string' ? row.plantId : null,
        species: typeof row.species === 'string' ? row.species : null,
      });
    }

    return sanitizeLayoutCells(rows);
  } catch {
    return [];
  }
}

function getEventByInviteTokenInternal(db: DatabaseAdapter, inviteToken: string): Event | null {
  const rows = db.query<Event>(
    `SELECT
      id,
      title,
      event_date,
      event_time,
      location,
      description,
      capacity,
      invite_token,
      created_at,
      updated_at
     FROM ev_events
     WHERE invite_token = ?`,
    [inviteToken],
  );
  return rows[0] ?? null;
}

function getOrCreateMealPlan(db: DatabaseAdapter, weekStartDateInput: string): MealPlan {
  const weekStartDate = normalizeWeekStartDate(weekStartDateInput);
  const existing = db.query<MealPlan>(
    `SELECT id, week_start_date, created_at, updated_at
     FROM rc_meal_plans
     WHERE week_start_date = ?`,
    [weekStartDate],
  );
  if (existing.length > 0) {
    return existing[0];
  }

  const id = randomId('meal-plan');
  const now = nowIso();
  db.execute(
    `INSERT INTO rc_meal_plans (id, week_start_date, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [id, weekStartDate, now, now],
  );
  return {
    id,
    week_start_date: weekStartDate,
    created_at: now,
    updated_at: now,
  };
}

function getPantryLookup() {
  return new Map<string, string>();
}

export function upsertMealPlanItem(
  db: DatabaseAdapter,
  input: {
    weekStartDate: string;
    dayOfWeek: number;
    mealSlot: MealSlot;
    recipeId: string;
    servings?: number;
  },
): MealPlanItem {
  const plan = getOrCreateMealPlan(db, input.weekStartDate);
  const now = nowIso();
  const servings = Math.max(1, input.servings ?? 1);

  const existing = db.query<MealPlanItem>(
    `SELECT id, meal_plan_id, recipe_id, day_of_week, meal_slot, servings, created_at, updated_at
     FROM rc_meal_plan_items
     WHERE meal_plan_id = ? AND day_of_week = ? AND meal_slot = ?`,
    [plan.id, input.dayOfWeek, input.mealSlot],
  );

  if (existing.length > 0) {
    db.execute(
      `UPDATE rc_meal_plan_items
       SET recipe_id = ?, servings = ?, updated_at = ?
       WHERE id = ?`,
      [input.recipeId, servings, now, existing[0].id],
    );
    return {
      ...existing[0],
      recipe_id: input.recipeId,
      servings,
      updated_at: now,
    };
  }

  const id = randomId('meal-item');
  db.execute(
    `INSERT INTO rc_meal_plan_items
      (id, meal_plan_id, recipe_id, day_of_week, meal_slot, servings, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, plan.id, input.recipeId, input.dayOfWeek, input.mealSlot, servings, now, now],
  );

  return {
    id,
    meal_plan_id: plan.id,
    recipe_id: input.recipeId,
    day_of_week: input.dayOfWeek,
    meal_slot: input.mealSlot,
    servings,
    created_at: now,
    updated_at: now,
  };
}

export function removeMealPlanItem(db: DatabaseAdapter, mealPlanItemId: string): void {
  db.execute(`DELETE FROM rc_meal_plan_items WHERE id = ?`, [mealPlanItemId]);
}

export function getMealPlanWeek(
  db: DatabaseAdapter,
  weekStartDate: string,
): Array<MealPlanItem & { recipe_title: string; recipe_image_uri: string | null }> {
  const plan = getOrCreateMealPlan(db, weekStartDate);
  return db.query<MealPlanItem & { recipe_title: string; recipe_image_uri: string | null }>(
    `SELECT
      i.id,
      i.meal_plan_id,
      i.recipe_id,
      i.day_of_week,
      i.meal_slot,
      i.servings,
      i.created_at,
      i.updated_at,
      r.title AS recipe_title,
      r.image_uri AS recipe_image_uri
     FROM rc_meal_plan_items i
     JOIN rc_recipes r ON r.id = i.recipe_id
     WHERE i.meal_plan_id = ?
     ORDER BY i.day_of_week ASC, i.meal_slot ASC`,
    [plan.id],
  );
}

export function getMealPlanWeekBundle(db: DatabaseAdapter, weekStartDate: string): MealPlanWeek {
  const plan = getOrCreateMealPlan(db, weekStartDate);
  return {
    plan,
    items: getMealPlanWeek(db, weekStartDate),
  };
}

export function generateMealPlanShoppingList(
  db: DatabaseAdapter,
  weekStartDate: string,
): ConsolidatedShoppingItem[] {
  const items = getMealPlanWeek(db, weekStartDate);
  if (items.length === 0) {
    return [];
  }

  return generateShoppingList(db, {
    recipeIds: items.map((item) => item.recipe_id),
    subtractPantry: true,
    subtractStaples: true,
  }).map((item) => ({
    item: item.item,
    quantity: item.needed ?? item.quantity,
    unit: item.unit,
    in_stock: item.inPantry,
    grocery_section: item.grocerySection,
    needed: item.needed,
    recipe_ids: item.recipeIds,
  }));
}

export function detectStepTimerMinutes(instruction: string): number | null {
  const text = instruction.toLowerCase();
  const range = text.match(/(\d+)\s*-\s*(\d+)\s*(minute|min|minutes|hour|hours|hr|hrs)/);
  if (range) {
    const high = Number.parseInt(range[2], 10);
    return range[3].startsWith('h') ? high * 60 : high;
  }

  const hours = text.match(/(\d+)\s*(hour|hours|hr|hrs)/);
  const minutes = text.match(/(\d+)\s*(minute|minutes|min|mins)/);
  const hourValue = hours ? Number.parseInt(hours[1], 10) : 0;
  const minuteValue = minutes ? Number.parseInt(minutes[1], 10) : 0;
  if (hourValue > 0 || minuteValue > 0) {
    return (hourValue * 60) + minuteValue;
  }

  return null;
}

export function getCookingStepsWithTimers(
  db: DatabaseAdapter,
  recipeId: string,
): CookingStepWithTimer[] {
  const steps = db.query<{
    id: string;
    recipe_id: string;
    step_number: number;
    instruction: string;
    timer_minutes: number | null;
    sort_order: number;
    section: string | null;
  }>(
    `SELECT id, recipe_id, step_number, instruction, timer_minutes, sort_order, section
     FROM rc_steps
     WHERE recipe_id = ?
     ORDER BY sort_order ASC, step_number ASC`,
    [recipeId],
  );

  return steps.map((step) => ({
    ...step,
    inferred_timer_minutes: step.timer_minutes ?? detectStepTimerMinutes(step.instruction),
  }));
}

export function suggestIngredientSubstitutions(
  db: DatabaseAdapter,
  recipeId: string,
): Record<string, SubstitutionSuggestion[]> {
  const pantry = getPantryItems(db);
  const pantryNames = new Set(pantry.map((item) => resolveItemName(item.name)));
  const ingredients = getStructuredIngredients(db, recipeId);
  const suggestions: Record<string, SubstitutionSuggestion[]> = {};

  for (const ingredient of ingredients) {
    const key = resolveItemName(ingredient.item);
    const matches = SUBSTITUTION_MAP[key];
    if (!matches || matches.length === 0) {
      continue;
    }

    suggestions[ingredient.item] = matches.map((match) => ({
      substitute: match.substitute,
      quantity_hint: match.quantity_hint,
      reason: `Useful swap for ${ingredient.item}`,
      in_pantry: pantryNames.has(resolveItemName(match.substitute)),
    }));
  }

  return suggestions;
}

export function createGardenPlant(
  db: DatabaseAdapter,
  input: {
    id: string;
    species: string;
    location: PlantLocation;
    plantingDate: string;
    wateringIntervalDays: number;
    notes?: string;
  },
): GardenPlant {
  const now = nowIso();
  db.execute(
    `INSERT INTO gd_plants
      (id, species, location, planting_date, watering_interval_days, last_watered_at, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.species,
      input.location,
      input.plantingDate,
      Math.max(1, input.wateringIntervalDays),
      null,
      input.notes ?? null,
      now,
      now,
    ],
  );

  return {
    id: input.id,
    species: input.species,
    location: input.location,
    planting_date: input.plantingDate,
    watering_interval_days: Math.max(1, input.wateringIntervalDays),
    last_watered_at: null,
    notes: input.notes ?? null,
    created_at: now,
    updated_at: now,
  };
}

export function getGardenPlants(db: DatabaseAdapter): GardenPlant[] {
  return db.query<GardenPlant>(
    `SELECT
      id,
      species,
      location,
      planting_date,
      watering_interval_days,
      last_watered_at,
      notes,
      created_at,
      updated_at
     FROM gd_plants
     ORDER BY created_at DESC`,
  );
}

export function getNextWateringDate(
  plant: Pick<GardenPlant, 'last_watered_at' | 'planting_date' | 'watering_interval_days'>,
): string {
  const base = plant.last_watered_at ?? plant.planting_date;
  return addDays(base.slice(0, 10), Math.max(1, plant.watering_interval_days));
}

export function getGardenDashboard(db: DatabaseAdapter): GardenPlantDashboard[] {
  const today = new Date().toISOString().slice(0, 10);
  return getGardenPlants(db).map((plant) => {
    const nextWateringDate = getNextWateringDate(plant);
    const overdueDays = Math.max(
      0,
      Math.floor(
        (new Date(`${today}T00:00:00.000Z`).getTime() - new Date(`${nextWateringDate}T00:00:00.000Z`).getTime()) /
          86_400_000,
      ),
    );
    return {
      ...plant,
      next_watering_date: nextWateringDate,
      needs_water: nextWateringDate <= today,
      overdue_days: overdueDays,
    };
  });
}

export function markPlantWatered(
  db: DatabaseAdapter,
  plantId: string,
  wateredAt = nowIso(),
): void {
  db.execute(`UPDATE gd_plants SET last_watered_at = ?, updated_at = ? WHERE id = ?`, [
    wateredAt,
    nowIso(),
    plantId,
  ]);
  createPlantCareLog(db, {
    plantId,
    careType: 'watered',
    performedAt: wateredAt,
  });
}

export function createPlantCareLog(
  db: DatabaseAdapter,
  input: {
    plantId: string;
    careType: PlantCareType;
    performedAt?: string;
    notes?: string;
  },
): PlantCareLog {
  const now = nowIso();
  const performedAt = input.performedAt ?? now;
  const id = randomId('plant-care');

  db.execute(
    `INSERT INTO gd_plant_care_logs (id, plant_id, care_type, performed_at, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.plantId, input.careType, performedAt, input.notes ?? null, now],
  );

  return {
    id,
    plant_id: input.plantId,
    care_type: input.careType,
    performed_at: performedAt,
    notes: input.notes ?? null,
    created_at: now,
  };
}

export function getGardenLayouts(db: DatabaseAdapter): GardenLayout[] {
  return db.query<GardenLayout>(
    `SELECT id, name, grid_width, grid_height, cells_json, created_at, updated_at
     FROM gd_garden_layouts
     ORDER BY updated_at DESC, created_at DESC`,
  );
}

export function getGardenLayoutCells(db: DatabaseAdapter, layoutId: string): GardenLayoutCell[] {
  const rows = db.query<{ cells_json: string }>(
    `SELECT cells_json FROM gd_garden_layouts WHERE id = ?`,
    [layoutId],
  );
  if (rows.length === 0) {
    return [];
  }
  return parseLayoutCells(rows[0].cells_json);
}

export function upsertGardenLayout(
  db: DatabaseAdapter,
  input: {
    layoutId?: string;
    name: string;
    gridWidth: number;
    gridHeight: number;
    cells: GardenLayoutCell[];
  },
): GardenLayout {
  const now = nowIso();
  const id = input.layoutId ?? randomId('layout');
  const name = input.name.trim() || 'Garden Layout';
  const gridWidth = clampGrid(input.gridWidth, 8);
  const gridHeight = clampGrid(input.gridHeight, 8);
  const cellsJson = JSON.stringify(sanitizeLayoutCells(input.cells));

  const existing = db.query<GardenLayout>(
    `SELECT id, name, grid_width, grid_height, cells_json, created_at, updated_at
     FROM gd_garden_layouts
     WHERE id = ?`,
    [id],
  );

  if (existing.length > 0) {
    db.execute(
      `UPDATE gd_garden_layouts
       SET name = ?, grid_width = ?, grid_height = ?, cells_json = ?, updated_at = ?
       WHERE id = ?`,
      [name, gridWidth, gridHeight, cellsJson, now, id],
    );
    return {
      ...existing[0],
      name,
      grid_width: gridWidth,
      grid_height: gridHeight,
      cells_json: cellsJson,
      updated_at: now,
    };
  }

  db.execute(
    `INSERT INTO gd_garden_layouts (id, name, grid_width, grid_height, cells_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, gridWidth, gridHeight, cellsJson, now, now],
  );
  return {
    id,
    name,
    grid_width: gridWidth,
    grid_height: gridHeight,
    cells_json: cellsJson,
    created_at: now,
    updated_at: now,
  };
}

export function addGardenJournalEntry(
  db: DatabaseAdapter,
  input: {
    plantId?: string | null;
    photoPath: string;
    note?: string;
    identifiedSpecies?: string;
    capturedAt?: string;
  },
): GardenJournalEntry {
  const id = randomId('garden-journal');
  const capturedAt = input.capturedAt ?? nowIso();
  const now = nowIso();

  db.execute(
    `INSERT INTO gd_garden_journal
      (id, plant_id, photo_path, note, identified_species, captured_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.plantId ?? null,
      input.photoPath,
      input.note ?? null,
      input.identifiedSpecies ?? null,
      capturedAt,
      now,
    ],
  );

  return {
    id,
    plant_id: input.plantId ?? null,
    photo_path: input.photoPath,
    note: input.note ?? null,
    identified_species: input.identifiedSpecies ?? null,
    captured_at: capturedAt,
    created_at: now,
  };
}

export function getGardenJournal(db: DatabaseAdapter, plantId?: string): GardenJournalEntry[] {
  if (plantId) {
    return db.query<GardenJournalEntry>(
      `SELECT id, plant_id, photo_path, note, identified_species, captured_at, created_at
       FROM gd_garden_journal
       WHERE plant_id = ?
       ORDER BY captured_at DESC`,
      [plantId],
    );
  }

  return db.query<GardenJournalEntry>(
    `SELECT id, plant_id, photo_path, note, identified_species, captured_at, created_at
     FROM gd_garden_journal
     ORDER BY captured_at DESC`,
  );
}

export function logHarvest(
  db: DatabaseAdapter,
  input: {
    plantId?: string | null;
    itemName: string;
    quantity?: number | null;
    unit?: string | null;
    harvestedAt?: string;
    note?: string;
  },
): Harvest {
  const id = randomId('harvest');
  const harvestedAt = input.harvestedAt ?? nowIso();
  const now = nowIso();

  db.execute(
    `INSERT INTO gd_harvests
      (id, plant_id, item_name, quantity, unit, harvested_at, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.plantId ?? null,
      input.itemName,
      input.quantity ?? null,
      input.unit ?? null,
      harvestedAt,
      input.note ?? null,
      now,
    ],
  );

  return {
    id,
    plant_id: input.plantId ?? null,
    item_name: input.itemName,
    quantity: input.quantity ?? null,
    unit: input.unit ?? null,
    harvested_at: harvestedAt,
    note: input.note ?? null,
    created_at: now,
  };
}

export function getRecipesForHarvest(
  db: DatabaseAdapter,
  harvestItem: string,
): Array<{ recipe_id: string; recipe_title: string; ingredient: string }> {
  const match = harvestItem.toLowerCase();
  return db.query<{ recipe_id: string; recipe_title: string; ingredient: string }>(
    `SELECT DISTINCT
      r.id AS recipe_id,
      r.title AS recipe_title,
      COALESCE(ing.item, ing.name) AS ingredient
     FROM rc_ingredients ing
     JOIN rc_recipes r ON r.id = ing.recipe_id
     WHERE lower(COALESCE(ing.item, ing.name)) LIKE ?`,
    [`%${match}%`],
  );
}

export function linkHarvestToRecipes(
  db: DatabaseAdapter,
  harvestId: string,
  recipeIds: string[],
  reason = 'manual',
): void {
  db.transaction(() => {
    for (const recipeId of recipeIds) {
      db.execute(
        `INSERT INTO gd_harvest_recipe_links (id, harvest_id, recipe_id, match_reason, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [randomId('harvest-link'), harvestId, recipeId, reason, nowIso()],
      );
    }
  });
}

export function createHostedEvent(
  db: DatabaseAdapter,
  input: {
    id: string;
    title: string;
    eventDate: string;
    eventTime: string;
    location?: string;
    description?: string;
    capacity?: number;
  },
): Event {
  const now = nowIso();
  const inviteToken = `invite-${Math.random().toString(16).slice(2, 10)}`;
  db.execute(
    `INSERT INTO ev_events
      (id, title, event_date, event_time, location, description, capacity, invite_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.title,
      input.eventDate,
      input.eventTime,
      input.location ?? null,
      input.description ?? null,
      input.capacity ?? null,
      inviteToken,
      now,
      now,
    ],
  );

  return {
    id: input.id,
    title: input.title,
    event_date: input.eventDate,
    event_time: input.eventTime,
    location: input.location ?? null,
    description: input.description ?? null,
    capacity: input.capacity ?? null,
    invite_token: inviteToken,
    created_at: now,
    updated_at: now,
  };
}

export function createEvent(
  db: DatabaseAdapter,
  input: {
    id: string;
    title: string;
    eventDate: string;
    eventTime: string;
    location?: string;
    description?: string;
    capacity?: number;
  },
): Event {
  return createHostedEvent(db, input);
}

export function getHostedEvents(db: DatabaseAdapter): Event[] {
  return db.query<Event>(
    `SELECT
      id,
      title,
      event_date,
      event_time,
      location,
      description,
      capacity,
      invite_token,
      created_at,
      updated_at
     FROM ev_events
     ORDER BY event_date ASC, event_time ASC`,
  );
}

export function getEventByInviteToken(db: DatabaseAdapter, inviteToken: string): Event | null {
  return getEventByInviteTokenInternal(db, inviteToken);
}

export function addEventGuest(
  db: DatabaseAdapter,
  input: {
    id: string;
    eventId: string;
    name: string;
    contact?: string;
    dietaryPreferences?: string;
    allergies?: string;
  },
): EventGuest {
  const now = nowIso();
  db.execute(
    `INSERT INTO ev_guests (id, event_id, name, contact, dietary_preferences, allergies, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.eventId,
      input.name,
      input.contact ?? null,
      input.dietaryPreferences ?? null,
      input.allergies ?? null,
      now,
      now,
    ],
  );

  return {
    id: input.id,
    event_id: input.eventId,
    name: input.name,
    contact: input.contact ?? null,
    dietary_preferences: input.dietaryPreferences ?? null,
    allergies: input.allergies ?? null,
    created_at: now,
    updated_at: now,
  };
}

export function respondToEventInvite(
  db: DatabaseAdapter,
  input: {
    id: string;
    eventId: string;
    guestId: string;
    response: EventResponse;
    note?: string;
  },
): void {
  const now = nowIso();
  db.execute(
    `INSERT OR REPLACE INTO ev_rsvps
      (id, event_id, guest_id, response, note, responded_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.id, input.eventId, input.guestId, input.response, input.note ?? null, now, now, now],
  );
}

export function respondToInvite(
  db: DatabaseAdapter,
  input: {
    id: string;
    eventId: string;
    guestId: string;
    response: EventResponse;
    note?: string;
  },
): void {
  respondToEventInvite(db, input);
}

export function respondToInviteToken(
  db: DatabaseAdapter,
  input: {
    inviteToken: string;
    guestName: string;
    response: EventResponse;
    note?: string;
    contact?: string;
    dietaryPreferences?: string;
    allergies?: string;
  },
): { event: Event; guest: EventGuest } | null {
  const event = getEventByInviteTokenInternal(db, input.inviteToken);
  if (!event) {
    return null;
  }

  const normalizedName = input.guestName.trim().toLowerCase();
  if (!normalizedName) {
    return null;
  }

  const existingGuests = db.query<EventGuest>(
    `SELECT id, event_id, name, contact, dietary_preferences, allergies, created_at, updated_at
     FROM ev_guests
     WHERE event_id = ? AND lower(name) = ?
     LIMIT 1`,
    [event.id, normalizedName],
  );

  const now = nowIso();
  let guest: EventGuest;
  if (existingGuests.length > 0) {
    guest = existingGuests[0];
    const contact = input.contact?.trim() || guest.contact;
    const dietaryPreferences = input.dietaryPreferences?.trim() || guest.dietary_preferences;
    const allergies = input.allergies?.trim() || guest.allergies;
    db.execute(
      `UPDATE ev_guests
       SET contact = ?, dietary_preferences = ?, allergies = ?, updated_at = ?
       WHERE id = ?`,
      [contact ?? null, dietaryPreferences ?? null, allergies ?? null, now, guest.id],
    );
    guest = {
      ...guest,
      contact: contact ?? null,
      dietary_preferences: dietaryPreferences ?? null,
      allergies: allergies ?? null,
      updated_at: now,
    };
  } else {
    guest = addEventGuest(db, {
      id: randomId('guest'),
      eventId: event.id,
      name: input.guestName.trim(),
      contact: input.contact?.trim() || undefined,
      dietaryPreferences: input.dietaryPreferences?.trim() || undefined,
      allergies: input.allergies?.trim() || undefined,
    });
  }

  const existingRsvp = db.query<{ id: string }>(
    `SELECT id FROM ev_rsvps WHERE event_id = ? AND guest_id = ? LIMIT 1`,
    [event.id, guest.id],
  );
  respondToEventInvite(db, {
    id: existingRsvp[0]?.id ?? randomId('rsvp'),
    eventId: event.id,
    guestId: guest.id,
    response: input.response,
    note: input.note?.trim() || undefined,
  });

  return { event, guest };
}

export function addEventMenuItem(
  db: DatabaseAdapter,
  input: {
    eventId: string;
    recipeId: string;
    course?: EventCourse;
    servings?: number;
  },
): void {
  const now = nowIso();
  db.execute(
    `INSERT INTO ev_menu_items (id, event_id, recipe_id, course, servings, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      randomId('menu-item'),
      input.eventId,
      input.recipeId,
      input.course ?? 'main',
      Math.max(1, input.servings ?? 1),
      now,
      now,
    ],
  );
}

export function replaceEventMenuWithRecipes(
  db: DatabaseAdapter,
  input: {
    eventId: string;
    recipeIds: string[];
    servings: number;
  },
): void {
  db.transaction(() => {
    db.execute(`DELETE FROM ev_menu_items WHERE event_id = ?`, [input.eventId]);
    for (const recipeId of input.recipeIds) {
      addEventMenuItem(db, {
        eventId: input.eventId,
        recipeId,
        course: 'main',
        servings: input.servings,
      });
    }
  });
}

export function setEventMenu(
  db: DatabaseAdapter,
  input: {
    eventId: string;
    recipeIds: string[];
    servings: number;
  },
): void {
  replaceEventMenuWithRecipes(db, input);
}

export function addPotluckClaim(
  db: DatabaseAdapter,
  input: {
    eventId: string;
    guestId: string;
    dishName: string;
    note?: string;
  },
): void {
  db.execute(
    `INSERT INTO ev_potluck_claims (id, event_id, guest_id, dish_name, note, claimed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      randomId('potluck'),
      input.eventId,
      input.guestId,
      input.dishName,
      input.note ?? null,
      nowIso(),
      nowIso(),
    ],
  );
}

export function addEventTimelineItem(
  db: DatabaseAdapter,
  input: {
    eventId: string;
    label: string;
    startsAt: string;
    sortOrder?: number;
  },
): EventTimelineItem {
  const id = randomId('timeline');
  const now = nowIso();
  const sortOrder = input.sortOrder ?? 0;

  db.execute(
    `INSERT INTO ev_event_timeline (id, event_id, label, starts_at, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.eventId, input.label, input.startsAt, sortOrder, now, now],
  );

  return {
    id,
    event_id: input.eventId,
    label: input.label,
    starts_at: input.startsAt,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  };
}

export function getEventAllergyWarnings(
  db: DatabaseAdapter,
  eventId: string,
): EventAllergyWarning[] {
  const guestRows = db.query<{ id: string; name: string; allergies: string | null }>(
    `SELECT id, name, allergies FROM ev_guests WHERE event_id = ?`,
    [eventId],
  );
  const recipeRows = db.query<{ recipe_id: string; title: string }>(
    `SELECT m.recipe_id, r.title
     FROM ev_menu_items m
     JOIN rc_recipes r ON r.id = m.recipe_id
     WHERE m.event_id = ?`,
    [eventId],
  );

  const warnings: EventAllergyWarning[] = [];
  for (const guest of guestRows) {
    const allergies = (guest.allergies ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (allergies.length === 0) {
      continue;
    }

    for (const recipe of recipeRows) {
      const ingredients = getStructuredIngredients(db, recipe.recipe_id);
      for (const ingredient of ingredients) {
        const lower = ingredient.item.toLowerCase();
        for (const allergy of allergies) {
          if (lower.includes(allergy) || (allergy === 'nut' && lower.includes('nut'))) {
            warnings.push({
              guest_name: guest.name,
              allergy,
              recipe_id: recipe.recipe_id,
              recipe_title: recipe.title,
              ingredient: ingredient.item,
            });
          }
        }
      }
    }
  }

  return warnings;
}

export function generateEventShoppingList(
  db: DatabaseAdapter,
  eventId: string,
): ConsolidatedShoppingItem[] {
  const recipeRows = db.query<{ recipe_id: string }>(
    `SELECT recipe_id FROM ev_menu_items WHERE event_id = ?`,
    [eventId],
  );

  return generateShoppingList(db, {
    recipeIds: recipeRows.map((row) => row.recipe_id),
    subtractPantry: true,
    subtractStaples: true,
  }).map((item) => ({
    item: item.item,
    quantity: item.needed ?? item.quantity,
    unit: item.unit,
    in_stock: item.inPantry,
    grocery_section: item.grocerySection,
    needed: item.needed,
    recipe_ids: item.recipeIds,
  }));
}

export function getEventBundle(db: DatabaseAdapter, eventId: string): EventBundle | null {
  const events = db.query<Event>(
    `SELECT
      id,
      title,
      event_date,
      event_time,
      location,
      description,
      capacity,
      invite_token,
      created_at,
      updated_at
     FROM ev_events
     WHERE id = ?`,
    [eventId],
  );
  const event = events[0];
  if (!event) {
    return null;
  }

  const guests = db.query<EventGuest>(
    `SELECT id, event_id, name, contact, dietary_preferences, allergies, created_at, updated_at
     FROM ev_guests
     WHERE event_id = ?
     ORDER BY created_at ASC`,
    [eventId],
  );
  const rsvps = db.query(
    `SELECT id, event_id, guest_id, response, note, responded_at, created_at, updated_at
     FROM ev_rsvps
     WHERE event_id = ?
     ORDER BY responded_at DESC`,
    [eventId],
  ) as EventBundle['rsvps'];
  const menu = db.query(
    `SELECT id, event_id, recipe_id, course, servings, created_at, updated_at
     FROM ev_menu_items
     WHERE event_id = ?
     ORDER BY created_at ASC`,
    [eventId],
  ) as EventBundle['menu'];
  const potluck = db.query(
    `SELECT id, event_id, guest_id, dish_name, note, claimed_at, created_at
     FROM ev_potluck_claims
     WHERE event_id = ?
     ORDER BY claimed_at DESC`,
    [eventId],
  ) as EventBundle['potluck'];
  const timeline = db.query<EventTimelineItem>(
    `SELECT id, event_id, label, starts_at, sort_order, created_at, updated_at
     FROM ev_event_timeline
     WHERE event_id = ?
     ORDER BY sort_order ASC, starts_at ASC`,
    [eventId],
  );

  return {
    event,
    guests,
    rsvps,
    menu,
    potluck,
    timeline,
    allergyWarnings: getEventAllergyWarnings(db, eventId),
  };
}

export function getEventInviteBundle(
  db: DatabaseAdapter,
  inviteToken: string,
): EventInviteBundle | null {
  const event = getEventByInviteTokenInternal(db, inviteToken);
  if (!event) {
    return null;
  }

  const menu = db.query<{
    recipe_id: string;
    recipe_title: string;
    servings: number;
    course: EventCourse;
  }>(
    `SELECT m.recipe_id, r.title AS recipe_title, m.servings, m.course
     FROM ev_menu_items m
     JOIN rc_recipes r ON r.id = m.recipe_id
     WHERE m.event_id = ?
     ORDER BY m.created_at ASC`,
    [event.id],
  );

  const timeline = db.query<EventTimelineItem>(
    `SELECT id, event_id, label, starts_at, sort_order, created_at, updated_at
     FROM ev_event_timeline
     WHERE event_id = ?
     ORDER BY sort_order ASC, starts_at ASC`,
    [event.id],
  );

  const summary = { attending: 0, maybe: 0, declined: 0 };
  const summaryRows = db.query<{ response: EventResponse; total: number }>(
    `SELECT response, COUNT(*) AS total
     FROM ev_rsvps
     WHERE event_id = ?
     GROUP BY response`,
    [event.id],
  );
  for (const row of summaryRows) {
    summary[row.response] = row.total;
  }

  return {
    event,
    menu,
    timeline,
    rsvpSummary: summary,
  };
}
