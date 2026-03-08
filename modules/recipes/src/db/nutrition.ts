import type { DatabaseAdapter } from '@mylife/db';
import type { NutritionData, CreateNutritionData, UpdateNutritionData } from '../types';

export function createNutritionData(
  db: DatabaseAdapter,
  id: string,
  input: CreateNutritionData,
): NutritionData {
  const now = new Date().toISOString();
  const data: NutritionData = {
    id,
    pantry_item_id: input.pantry_item_id ?? null,
    barcode: input.barcode ?? null,
    product_name: input.product_name ?? null,
    brand: input.brand ?? null,
    serving_size_text: input.serving_size_text ?? null,
    calories: input.calories ?? null,
    fat_g: input.fat_g ?? null,
    saturated_fat_g: input.saturated_fat_g ?? null,
    carbs_g: input.carbs_g ?? null,
    fiber_g: input.fiber_g ?? null,
    sugar_g: input.sugar_g ?? null,
    protein_g: input.protein_g ?? null,
    sodium_mg: input.sodium_mg ?? null,
    source: input.source,
    fetched_at: now,
  };
  db.execute(
    `INSERT INTO rc_nutrition_data (id, pantry_item_id, barcode, product_name, brand, serving_size_text, calories, fat_g, saturated_fat_g, carbs_g, fiber_g, sugar_g, protein_g, sodium_mg, source, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.id, data.pantry_item_id, data.barcode, data.product_name, data.brand, data.serving_size_text, data.calories, data.fat_g, data.saturated_fat_g, data.carbs_g, data.fiber_g, data.sugar_g, data.protein_g, data.sodium_mg, data.source, data.fetched_at],
  );
  return data;
}

export function getNutritionForItem(db: DatabaseAdapter, pantryItemId: string): NutritionData | null {
  const rows = db.query<NutritionData>(
    `SELECT * FROM rc_nutrition_data WHERE pantry_item_id = ? LIMIT 1`,
    [pantryItemId],
  );
  return rows[0] ?? null;
}

export function getNutritionByBarcode(db: DatabaseAdapter, barcode: string): NutritionData | null {
  const rows = db.query<NutritionData>(
    `SELECT * FROM rc_nutrition_data WHERE barcode = ? ORDER BY fetched_at DESC LIMIT 1`,
    [barcode],
  );
  return rows[0] ?? null;
}

export function updateNutritionData(db: DatabaseAdapter, id: string, updates: UpdateNutritionData): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.execute(`UPDATE rc_nutrition_data SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deleteNutritionData(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM rc_nutrition_data WHERE id = ?`, [id]);
}
