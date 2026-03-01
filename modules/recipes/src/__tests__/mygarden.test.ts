import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseAdapter } from '@mylife/db';
import { createModuleTestDatabase } from '@mylife/db';
import { RECIPES_MODULE } from '../definition';
import { createRecipe, addIngredient } from '../db/crud';
import {
  addEventGuest,
  createGardenPlant,
  createEvent,
  detectStepTimerMinutes,
  getEventInviteBundle,
  getGardenLayoutCells,
  generateMealPlanShoppingList,
  getEventAllergyWarnings,
  getNextWateringDate,
  respondToInviteToken,
  setEventMenu,
  upsertGardenLayout,
  upsertMealPlanItem,
} from '../db/mygarden';

describe('@mylife/recipes mygarden features', () => {
  let adapter: DatabaseAdapter;
  let closeDb: () => void;

  beforeEach(() => {
    const testDb = createModuleTestDatabase('recipes', RECIPES_MODULE.migrations!);
    adapter = testDb.adapter;
    closeDb = testDb.close;
  });

  afterEach(() => {
    closeDb();
  });

  it('detects step timer from instruction text', () => {
    expect(detectStepTimerMinutes('Bake for 25 minutes at 350F')).toBe(25);
    expect(detectStepTimerMinutes('Simmer for 1 hour 10 minutes')).toBe(70);
  });

  it('aggregates grocery list for meal plans', () => {
    createRecipe(adapter, 'r1', { title: 'Soup' });
    addIngredient(adapter, 'i1', { recipe_id: 'r1', name: 'onion', quantity: '1', unit: 'whole' });
    createRecipe(adapter, 'r2', { title: 'Stew' });
    addIngredient(adapter, 'i2', { recipe_id: 'r2', name: 'onion', quantity: '2', unit: 'whole' });

    upsertMealPlanItem(adapter, {
      weekStartDate: '2026-03-02',
      dayOfWeek: 1,
      mealSlot: 'dinner',
      recipeId: 'r1',
    });
    upsertMealPlanItem(adapter, {
      weekStartDate: '2026-03-02',
      dayOfWeek: 2,
      mealSlot: 'dinner',
      recipeId: 'r2',
    });

    const list = generateMealPlanShoppingList(adapter, '2026-03-02');
    const onion = list.find((item) => item.item === 'onion');
    expect(onion?.quantity).toBe(3);
  });

  it('calculates plant watering schedule and can create events', () => {
    const plant = createGardenPlant(adapter, {
      id: 'p1',
      species: 'Tomato',
      location: 'raised_bed',
      plantingDate: '2026-08-12',
      wateringIntervalDays: 3,
    });
    expect(getNextWateringDate(plant)).toBe('2026-08-15');

    const event = createEvent(adapter, {
      id: 'e1',
      title: 'Garden Dinner',
      eventDate: '2026-08-20',
      eventTime: '18:00',
      capacity: 8,
    });
    expect(event.title).toBe('Garden Dinner');
  });

  it('persists garden layout and supports invite token RSVP', () => {
    const layout = upsertGardenLayout(adapter, {
      name: 'Bed 1',
      gridWidth: 3,
      gridHeight: 2,
      cells: [{ x: 0, y: 0, plantId: 'p1', species: 'Tomato' }],
    });
    const cells = getGardenLayoutCells(adapter, layout.id);
    expect(cells.length).toBe(1);
    expect(cells[0].species).toBe('Tomato');

    createRecipe(adapter, 'r-menu', { title: 'Peanut Slaw' });
    addIngredient(adapter, 'i-menu', { recipe_id: 'r-menu', name: 'peanut', quantity: '1', unit: 'cup' });
    const event = createEvent(adapter, {
      id: 'e2',
      title: 'Invite Night',
      eventDate: '2026-08-21',
      eventTime: '19:00',
      capacity: 6,
    });
    setEventMenu(adapter, { eventId: event.id, recipeIds: ['r-menu'], servings: 6 });

    const invite = getEventInviteBundle(adapter, event.invite_token ?? '');
    expect(invite).not.toBeNull();
    expect(invite?.menu.length).toBe(1);

    const response = respondToInviteToken(adapter, {
      inviteToken: event.invite_token ?? '',
      guestName: 'Alex',
      allergies: 'nut',
      response: 'attending',
    });
    expect(response).not.toBeNull();

    addEventGuest(adapter, { id: 'g-manual', eventId: event.id, name: 'Manual Guest', allergies: '' });
    const warnings = getEventAllergyWarnings(adapter, event.id);
    expect(warnings.some((warning) => warning.guest_name === 'Alex')).toBe(true);
  });
});
