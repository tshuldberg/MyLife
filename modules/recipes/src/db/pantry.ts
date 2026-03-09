import type { DatabaseAdapter } from '@mylife/db';
import type { CreatePantryItem, PantryFilters, PantryItem, UpdatePantryItem } from '../types';

export function createPantryItem(db: DatabaseAdapter, input: CreatePantryItem): PantryItem {
  const id = `pantry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const now = new Date().toISOString();

  db.execute(
    `INSERT INTO rc_pantry_items (
      id,
      name,
      quantity,
      unit,
      storage_location,
      expiration_date,
      purchase_date,
      barcode,
      photo_path,
      notes,
      grocery_section,
      is_staple,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.quantity ?? null,
      input.unit ?? null,
      input.storage_location,
      input.expiration_date ?? null,
      input.purchase_date ?? null,
      input.barcode ?? null,
      input.photo_path ?? null,
      input.notes ?? null,
      input.grocery_section ?? 'other',
      input.is_staple ?? 0,
      now,
      now,
    ],
  );

  return {
    id,
    name: input.name,
    quantity: input.quantity ?? null,
    unit: input.unit ?? null,
    storage_location: input.storage_location,
    expiration_date: input.expiration_date ?? null,
    purchase_date: input.purchase_date ?? null,
    barcode: input.barcode ?? null,
    photo_path: input.photo_path ?? null,
    notes: input.notes ?? null,
    grocery_section: input.grocery_section ?? 'other',
    is_staple: input.is_staple ?? 0,
    created_at: now,
    updated_at: now,
  };
}

export function getPantryItems(db: DatabaseAdapter, filters?: PantryFilters): PantryItem[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.search) {
    conditions.push('name LIKE ?');
    params.push(`%${filters.search}%`);
  }
  if (filters?.storageLocation) {
    conditions.push('storage_location = ?');
    params.push(filters.storageLocation);
  }
  if (filters?.grocerySection) {
    conditions.push('grocery_section = ?');
    params.push(filters.grocerySection);
  }
  if (filters?.isStaple !== undefined) {
    conditions.push('is_staple = ?');
    params.push(filters.isStaple ? 1 : 0);
  }
  if (filters?.expirationStatus) {
    const today = new Date().toISOString().split('T')[0];
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 3);
    const soonString = soonDate.toISOString().split('T')[0];

    switch (filters.expirationStatus) {
      case 'expired':
        conditions.push('expiration_date IS NOT NULL AND expiration_date < ?');
        params.push(today);
        break;
      case 'expiring_soon':
        conditions.push('expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?');
        params.push(today, soonString);
        break;
      case 'fresh':
        conditions.push('expiration_date IS NOT NULL AND expiration_date > ?');
        params.push(soonString);
        break;
      case 'no_date':
        conditions.push('expiration_date IS NULL');
        break;
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortBy = filters?.sortBy ?? 'created_at';
  const sortDir = filters?.sortDir ?? 'DESC';

  return db.query<PantryItem>(
    `SELECT
      id,
      name,
      quantity,
      unit,
      storage_location,
      expiration_date,
      purchase_date,
      barcode,
      photo_path,
      notes,
      grocery_section,
      is_staple,
      created_at,
      updated_at
     FROM rc_pantry_items
     ${where}
     ORDER BY ${sortBy} ${sortDir}`,
    params,
  );
}

export function getPantryItemById(db: DatabaseAdapter, id: string): PantryItem | null {
  const rows = db.query<PantryItem>(
    `SELECT
      id,
      name,
      quantity,
      unit,
      storage_location,
      expiration_date,
      purchase_date,
      barcode,
      photo_path,
      notes,
      grocery_section,
      is_staple,
      created_at,
      updated_at
     FROM rc_pantry_items
     WHERE id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

export function updatePantryItem(db: DatabaseAdapter, id: string, updates: UpdatePantryItem): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  const fieldMap: Record<string, keyof UpdatePantryItem> = {
    name: 'name',
    quantity: 'quantity',
    unit: 'unit',
    storage_location: 'storage_location',
    expiration_date: 'expiration_date',
    purchase_date: 'purchase_date',
    barcode: 'barcode',
    photo_path: 'photo_path',
    notes: 'notes',
    grocery_section: 'grocery_section',
    is_staple: 'is_staple',
  };

  for (const [column, key] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.execute(`UPDATE rc_pantry_items SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deletePantryItem(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM rc_pantry_items WHERE id = ?', [id]);
}

export function getPantryItemByBarcode(db: DatabaseAdapter, barcode: string): PantryItem | null {
  const rows = db.query<PantryItem>(
    `SELECT
      id,
      name,
      quantity,
      unit,
      storage_location,
      expiration_date,
      purchase_date,
      barcode,
      photo_path,
      notes,
      grocery_section,
      is_staple,
      created_at,
      updated_at
     FROM rc_pantry_items
     WHERE barcode = ?
     LIMIT 1`,
    [barcode],
  );
  return rows[0] ?? null;
}

export function getExpiringItems(db: DatabaseAdapter, daysAhead: number): PantryItem[] {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureString = futureDate.toISOString().split('T')[0];

  return db.query<PantryItem>(
    `SELECT
      id,
      name,
      quantity,
      unit,
      storage_location,
      expiration_date,
      purchase_date,
      barcode,
      photo_path,
      notes,
      grocery_section,
      is_staple,
      created_at,
      updated_at
     FROM rc_pantry_items
     WHERE expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?
     ORDER BY expiration_date ASC`,
    [today, futureString],
  );
}

export function getPantryItemsByName(db: DatabaseAdapter, name: string): PantryItem[] {
  return db.query<PantryItem>(
    `SELECT
      id,
      name,
      quantity,
      unit,
      storage_location,
      expiration_date,
      purchase_date,
      barcode,
      photo_path,
      notes,
      grocery_section,
      is_staple,
      created_at,
      updated_at
     FROM rc_pantry_items
     WHERE name LIKE ? COLLATE NOCASE`,
    [`%${name}%`],
  );
}

export function bulkUpdateQuantities(
  db: DatabaseAdapter,
  updates: Array<{ id: string; quantity: number }>,
): void {
  db.transaction(() => {
    for (const update of updates) {
      db.execute(
        `UPDATE rc_pantry_items
         SET quantity = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [update.quantity, update.id],
      );
    }
  });
}
