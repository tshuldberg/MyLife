import type { DatabaseAdapter } from '@mylife/db';
import type {
  Event,
  EventResponse,
  GardenPlant,
  MealPlan,
  MealPlanItem,
  MealSlot,
  PlantLocation,
} from '../types';

export interface ConsolidatedShoppingItem {
  item: string;
  quantity: number | null;
  unit: string | null;
  in_stock: boolean;
}

export interface AllergyWarning {
  guest_name: string;
  allergy: string;
  recipe_id: string;
  recipe_title: string;
  ingredient: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeWeekStartDate(date: string): string {
  const dt = new Date(`${date}T00:00:00.000Z`);
  const day = dt.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - diffToMonday);
  return dt.toISOString().slice(0, 10);
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

  const id = `mp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  const id = `mpi-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

export function generateMealPlanShoppingList(
  db: DatabaseAdapter,
  weekStartDate: string,
): ConsolidatedShoppingItem[] {
  const items = getMealPlanWeek(db, weekStartDate);
  if (items.length === 0) {
    return [];
  }

  const ingredientRows = db.query<{
    name: string;
    quantity: string | null;
    unit: string | null;
  }>(
    `SELECT ing.name, ing.quantity, ing.unit
     FROM rc_ingredients ing
     JOIN rc_meal_plan_items mpi ON mpi.recipe_id = ing.recipe_id
     JOIN rc_meal_plans mp ON mp.id = mpi.meal_plan_id
     WHERE mp.week_start_date = ?`,
    [normalizeWeekStartDate(weekStartDate)],
  );

  const pantryRows = db.query<{ name: string; quantity: number | null; unit: string | null }>(
    `SELECT item_name AS name, quantity, unit FROM gd_harvests`,
  );
  const pantrySet = new Set(pantryRows.map((row) => row.name.toLowerCase()));

  const grouped = new Map<string, { quantity: number | null; unit: string | null }>();
  for (const row of ingredientRows) {
    const key = row.name.trim().toLowerCase();
    const parsedQty = row.quantity ? Number.parseFloat(row.quantity) : null;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        quantity: Number.isNaN(parsedQty as number) ? null : parsedQty,
        unit: row.unit,
      });
      continue;
    }
    if (current.quantity !== null && parsedQty !== null && !Number.isNaN(parsedQty)) {
      current.quantity += parsedQty;
    } else {
      current.quantity = null;
    }
  }

  return Array.from(grouped.entries()).map(([item, value]) => ({
    item,
    quantity: value.quantity,
    unit: value.unit,
    in_stock: pantrySet.has(item),
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
  const mins = text.match(/(\d+)\s*(minute|minutes|min|mins)/);
  const hourValue = hours ? Number.parseInt(hours[1], 10) : 0;
  const minuteValue = mins ? Number.parseInt(mins[1], 10) : 0;
  if (hourValue > 0 || minuteValue > 0) {
    return (hourValue * 60) + minuteValue;
  }
  return null;
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

export function getNextWateringDate(
  plant: Pick<GardenPlant, 'last_watered_at' | 'planting_date' | 'watering_interval_days'>,
): string {
  const base = plant.last_watered_at ?? plant.planting_date;
  const baseDate = new Date(`${base.slice(0, 10)}T00:00:00.000Z`);
  baseDate.setUTCDate(baseDate.getUTCDate() + Math.max(1, plant.watering_interval_days));
  return baseDate.toISOString().slice(0, 10);
}

export function markPlantWatered(
  db: DatabaseAdapter,
  plantId: string,
  wateredAt = nowIso(),
): void {
  db.execute(
    `UPDATE gd_plants SET last_watered_at = ?, updated_at = ? WHERE id = ?`,
    [wateredAt, nowIso(), plantId],
  );
  db.execute(
    `INSERT INTO gd_plant_care_logs (id, plant_id, care_type, performed_at, created_at)
     VALUES (?, ?, 'watered', ?, ?)`,
    [`care-${Date.now()}-${Math.random().toString(16).slice(2)}`, plantId, wateredAt, nowIso()],
  );
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
      ing.name AS ingredient
     FROM rc_ingredients ing
     JOIN rc_recipes r ON r.id = ing.recipe_id
     WHERE lower(ing.name) LIKE ?`,
    [`%${match}%`],
  );
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

export function addEventGuest(
  db: DatabaseAdapter,
  input: {
    id: string;
    eventId: string;
    name: string;
    allergies?: string;
  },
): void {
  const now = nowIso();
  db.execute(
    `INSERT INTO ev_guests (id, event_id, name, allergies, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.id, input.eventId, input.name, input.allergies ?? null, now, now],
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
  const now = nowIso();
  db.execute(
    `INSERT OR REPLACE INTO ev_rsvps
      (id, event_id, guest_id, response, note, responded_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.id, input.eventId, input.guestId, input.response, input.note ?? null, now, now, now],
  );
}

export function setEventMenu(
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
      const id = `menu-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      db.execute(
        `INSERT INTO ev_menu_items
          (id, event_id, recipe_id, course, servings, created_at, updated_at)
         VALUES (?, ?, ?, 'main', ?, ?, ?)`,
        [id, input.eventId, recipeId, Math.max(1, input.servings), nowIso(), nowIso()],
      );
    }
  });
}

export function getEventAllergyWarnings(
  db: DatabaseAdapter,
  eventId: string,
): AllergyWarning[] {
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

  const warnings: AllergyWarning[] = [];
  for (const guest of guestRows) {
    const allergies = (guest.allergies ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (allergies.length === 0) {
      continue;
    }

    for (const recipe of recipeRows) {
      const ingredientRows = db.query<{ name: string }>(
        `SELECT name FROM rc_ingredients WHERE recipe_id = ?`,
        [recipe.recipe_id],
      );
      for (const ingredient of ingredientRows) {
        const lower = ingredient.name.toLowerCase();
        for (const allergy of allergies) {
          if (lower.includes(allergy) || (allergy === 'nut' && lower.includes('nut'))) {
            warnings.push({
              guest_name: guest.name,
              allergy,
              recipe_id: recipe.recipe_id,
              recipe_title: recipe.title,
              ingredient: ingredient.name,
            });
          }
        }
      }
    }
  }

  return warnings;
}
