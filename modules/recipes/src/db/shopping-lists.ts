import type { DatabaseAdapter } from '@mylife/db';
import type {
  ShoppingList,
  ShoppingListItemRow,
  CreateShoppingListItem,
  ShoppingListSummary,
  GrocerySection,
} from '../types';
import { getStructuredIngredients } from './crud';
import { categorizeItem } from '../grocery/categorize';
import { parseIngredientText } from '../parser/ingredient-parser';

// ─────────────────────────────────────────────────────────────────────────
// List CRUD
// ─────────────────────────────────────────────────────────────────────────

export function createShoppingList(db: DatabaseAdapter, id: string, name: string): void {
  db.execute(
    `INSERT INTO rc_shopping_lists (id, name) VALUES (?, ?)`,
    [id, name],
  );
}

export function getShoppingLists(db: DatabaseAdapter, activeOnly = true): ShoppingList[] {
  const sql = activeOnly
    ? `SELECT * FROM rc_shopping_lists WHERE is_active = 1 ORDER BY updated_at DESC`
    : `SELECT * FROM rc_shopping_lists ORDER BY updated_at DESC`;
  return db.query<ShoppingList>(sql);
}

export function getShoppingListById(db: DatabaseAdapter, id: string): ShoppingList | null {
  const rows = db.query<ShoppingList>(
    `SELECT * FROM rc_shopping_lists WHERE id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

export function updateShoppingList(
  db: DatabaseAdapter,
  id: string,
  updates: { name?: string; is_active?: number },
): void {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    params.push(updates.name);
  }
  if (updates.is_active !== undefined) {
    sets.push('is_active = ?');
    params.push(updates.is_active);
  }

  if (sets.length === 0) return;

  sets.push("updated_at = datetime('now')");
  params.push(id);
  db.execute(`UPDATE rc_shopping_lists SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function deleteShoppingList(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM rc_shopping_lists WHERE id = ?`, [id]);
}

export function completeShoppingList(db: DatabaseAdapter, id: string): void {
  updateShoppingList(db, id, { is_active: 0 });
}

// ─────────────────────────────────────────────────────────────────────────
// Item CRUD
// ─────────────────────────────────────────────────────────────────────────

export function addShoppingListItem(
  db: DatabaseAdapter,
  id: string,
  listId: string,
  item: CreateShoppingListItem,
): void {
  db.execute(
    `INSERT INTO rc_shopping_list_items (id, list_id, item, quantity, unit, grocery_section, recipe_id, recipe_multiplier, is_custom, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      listId,
      item.item,
      item.quantity ?? null,
      item.unit ?? null,
      item.grocery_section ?? 'other',
      item.recipe_id ?? null,
      item.recipe_multiplier ?? 1,
      item.is_custom ?? 0,
      item.sort_order ?? 0,
    ],
  );
}

export function getShoppingListItems(db: DatabaseAdapter, listId: string): ShoppingListItemRow[] {
  return db.query<ShoppingListItemRow>(
    `SELECT * FROM rc_shopping_list_items WHERE list_id = ? ORDER BY grocery_section, sort_order, item`,
    [listId],
  );
}

export function updateShoppingListItem(
  db: DatabaseAdapter,
  id: string,
  updates: Partial<CreateShoppingListItem & { is_checked: number }>,
): void {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (updates.item !== undefined) { sets.push('item = ?'); params.push(updates.item); }
  if (updates.quantity !== undefined) { sets.push('quantity = ?'); params.push(updates.quantity); }
  if (updates.unit !== undefined) { sets.push('unit = ?'); params.push(updates.unit); }
  if (updates.grocery_section !== undefined) { sets.push('grocery_section = ?'); params.push(updates.grocery_section); }
  if (updates.is_checked !== undefined) { sets.push('is_checked = ?'); params.push(updates.is_checked); }
  if (updates.sort_order !== undefined) { sets.push('sort_order = ?'); params.push(updates.sort_order); }

  if (sets.length === 0) return;

  sets.push("updated_at = datetime('now')");
  params.push(id);
  db.execute(`UPDATE rc_shopping_list_items SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function deleteShoppingListItem(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM rc_shopping_list_items WHERE id = ?`, [id]);
}

export function toggleItemChecked(db: DatabaseAdapter, id: string): boolean {
  db.execute(
    `UPDATE rc_shopping_list_items SET is_checked = CASE WHEN is_checked = 0 THEN 1 ELSE 0 END, updated_at = datetime('now') WHERE id = ?`,
    [id],
  );
  const rows = db.query<{ is_checked: number }>(
    `SELECT is_checked FROM rc_shopping_list_items WHERE id = ?`,
    [id],
  );
  return rows[0]?.is_checked === 1;
}

export function uncheckAllItems(db: DatabaseAdapter, listId: string): void {
  db.execute(
    `UPDATE rc_shopping_list_items SET is_checked = 0, updated_at = datetime('now') WHERE list_id = ?`,
    [listId],
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Recipe integration
// ─────────────────────────────────────────────────────────────────────────

/**
 * Add all ingredients from a recipe to a shopping list, scaled by multiplier.
 * Each ingredient is categorized into a grocery section automatically.
 */
export function addRecipeToShoppingList(
  db: DatabaseAdapter,
  listId: string,
  recipeId: string,
  multiplier: number,
  generateId: () => string,
): void {
  const ingredients = getStructuredIngredients(db, recipeId);
  const maxRows = db.query<{ mx: number | null }>(
    `SELECT MAX(sort_order) as mx FROM rc_shopping_list_items WHERE list_id = ?`,
    [listId],
  );
  let sortOrder = (maxRows[0]?.mx ?? -1) + 1;

  for (const ing of ingredients) {
    const scaledQty = ing.quantity_value !== null ? ing.quantity_value * multiplier : null;
    const section = categorizeItem(ing.item || ing.name);

    addShoppingListItem(db, generateId(), listId, {
      item: ing.item || ing.name,
      quantity: scaledQty,
      unit: ing.unit,
      grocery_section: section,
      recipe_id: recipeId,
      recipe_multiplier: multiplier,
      is_custom: 0,
      sort_order: sortOrder++,
    });
  }

  // Touch the list's updated_at
  db.execute(`UPDATE rc_shopping_lists SET updated_at = datetime('now') WHERE id = ?`, [listId]);
}

/** Remove all items sourced from a specific recipe. */
export function removeRecipeFromShoppingList(
  db: DatabaseAdapter,
  listId: string,
  recipeId: string,
): void {
  db.execute(
    `DELETE FROM rc_shopping_list_items WHERE list_id = ? AND recipe_id = ?`,
    [listId, recipeId],
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Custom items
// ─────────────────────────────────────────────────────────────────────────

/**
 * Add a custom typed item. Parses the text with the ingredient NLP parser
 * to extract quantity/unit, then auto-categorizes into a grocery section.
 */
export function addCustomItem(
  db: DatabaseAdapter,
  id: string,
  listId: string,
  itemText: string,
): void {
  const parsed = parseIngredientText(itemText);
  const section: GrocerySection = categorizeItem(parsed.item);

  const maxRows = db.query<{ mx: number | null }>(
    `SELECT MAX(sort_order) as mx FROM rc_shopping_list_items WHERE list_id = ?`,
    [listId],
  );

  addShoppingListItem(db, id, listId, {
    item: parsed.item,
    quantity: parsed.quantity,
    unit: parsed.unit,
    grocery_section: section,
    is_custom: 1,
    sort_order: (maxRows[0]?.mx ?? -1) + 1,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Pantry sync
// ─────────────────────────────────────────────────────────────────────────

/**
 * Bulk-add checked (purchased) shopping list items to the pantry.
 * Returns the number of items added.
 */
export function addCheckedItemsToPantry(
  db: DatabaseAdapter,
  listId: string,
  generateId: () => string,
): number {
  const checked = db.query<ShoppingListItemRow>(
    `SELECT * FROM rc_shopping_list_items WHERE list_id = ? AND is_checked = 1`,
    [listId],
  );

  let count = 0;
  for (const item of checked) {
    // Skip items already in pantry with the same name
    const existing = db.query<{ id: string }>(
      `SELECT id FROM rc_pantry_items WHERE LOWER(name) = LOWER(?)`,
      [item.item],
    );
    if (existing.length > 0) continue;

    db.execute(
      `INSERT INTO rc_pantry_items (id, name, quantity, unit, storage_location, grocery_section)
       VALUES (?, ?, ?, ?, 'pantry', ?)`,
      [generateId(), item.item, item.quantity, item.unit, item.grocery_section],
    );
    count++;
  }

  return count;
}

// ─────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────

export function getShoppingListSummary(db: DatabaseAdapter, listId: string): ShoppingListSummary | null {
  const list = getShoppingListById(db, listId);
  if (!list) return null;

  const rows = db.query<{ total: number; checked: number; recipes: number; custom: number }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN is_checked = 1 THEN 1 ELSE 0 END) as checked,
       COUNT(DISTINCT recipe_id) as recipes,
       SUM(CASE WHEN is_custom = 1 THEN 1 ELSE 0 END) as custom
     FROM rc_shopping_list_items WHERE list_id = ?`,
    [listId],
  );
  const totals = rows[0];

  return {
    list,
    totalItems: totals?.total ?? 0,
    checkedItems: totals?.checked ?? 0,
    recipeCount: totals?.recipes ?? 0,
    customItemCount: totals?.custom ?? 0,
  };
}

/** Get distinct recipes added to a shopping list with their multipliers. */
export function getRecipesInShoppingList(
  db: DatabaseAdapter,
  listId: string,
): Array<{ recipe_id: string; recipe_title: string; multiplier: number }> {
  return db.query<{ recipe_id: string; recipe_title: string; multiplier: number }>(
    `SELECT DISTINCT sli.recipe_id, r.title as recipe_title, sli.recipe_multiplier as multiplier
     FROM rc_shopping_list_items sli
     JOIN rc_recipes r ON r.id = sli.recipe_id
     WHERE sli.list_id = ? AND sli.recipe_id IS NOT NULL
     ORDER BY r.title`,
    [listId],
  );
}
