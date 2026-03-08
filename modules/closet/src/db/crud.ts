import type { DatabaseAdapter } from '@mylife/db';
import {
  ClosetDashboardSchema,
  ClosetSettingSchema,
  ClothingItemFilterSchema,
  ClothingItemSchema,
  ClosetTagSchema,
  CreateClothingItemInputSchema,
  CreateOutfitInputSchema,
  CreateWearLogInputSchema,
  OutfitSchema,
  UpdateClothingItemInputSchema,
  WearLogSchema,
  type ClosetDashboard,
  type ClosetSetting,
  type ClosetTag,
  type ClothingItem,
  type ClothingItemFilter,
  type CreateClothingItemInput,
  type CreateOutfitInput,
  type CreateWearLogInput,
  type Outfit,
  type UpdateClothingItemInput,
  type WearLog,
} from '../types';
import { summarizeClosetDashboard } from '../engine/analytics';

function nowIso(): string {
  return new Date().toISOString();
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function createId(prefix: string): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (typeof c?.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTagName(value: string): string {
  return value.trim().toLowerCase();
}

function parseStringArray(raw: unknown): string[] {
  if (typeof raw !== 'string') {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function getItemTags(db: DatabaseAdapter, itemId: string): string[] {
  return db.query<{ name: string }>(
    `SELECT t.name
     FROM cl_tags t
     INNER JOIN cl_item_tags it ON it.tag_id = t.id
     WHERE it.item_id = ?
     ORDER BY t.name ASC`,
    [itemId],
  ).map((row) => row.name);
}

function syncItemTags(db: DatabaseAdapter, itemId: string, tags: string[], createdAt: string): void {
  db.execute(`DELETE FROM cl_item_tags WHERE item_id = ?`, [itemId]);

  for (const tagName of [...new Set(tags.map(normalizeTagName).filter(Boolean))]) {
    const existing = db.query<{ id: string }>(`SELECT id FROM cl_tags WHERE name = ?`, [tagName])[0];
    const tagId = existing?.id ?? createId('cl_tag');

    if (!existing) {
      db.execute(
        `INSERT INTO cl_tags (id, name, created_at) VALUES (?, ?, ?)`,
        [tagId, tagName, createdAt],
      );
    }

    db.execute(
      `INSERT OR IGNORE INTO cl_item_tags (id, item_id, tag_id, created_at) VALUES (?, ?, ?, ?)`,
      [createId('cl_item_tag'), itemId, tagId, createdAt],
    );
  }
}

function getOutfitItemIds(db: DatabaseAdapter, outfitId: string): string[] {
  return db.query<{ item_id: string }>(
    `SELECT item_id FROM cl_outfit_items WHERE outfit_id = ? ORDER BY created_at ASC`,
    [outfitId],
  ).map((row) => row.item_id);
}

function getWearLogItemIds(db: DatabaseAdapter, wearLogId: string): string[] {
  return db.query<{ item_id: string }>(
    `SELECT item_id FROM cl_wear_log_items WHERE wear_log_id = ? ORDER BY created_at ASC`,
    [wearLogId],
  ).map((row) => row.item_id);
}

function rowToItem(row: Record<string, unknown>, tags: string[] = []): ClothingItem {
  return ClothingItemSchema.parse({
    id: row.id,
    name: row.name,
    category: row.category,
    color: row.color ?? null,
    brand: row.brand ?? null,
    purchasePriceCents: row.purchase_price_cents ?? null,
    purchaseDate: row.purchase_date ?? null,
    imageUri: row.image_uri ?? null,
    seasons: parseStringArray(row.seasons_json),
    occasions: parseStringArray(row.occasions_json),
    condition: row.condition,
    status: row.status,
    laundryStatus: row.laundry_status,
    timesWorn: Number(row.times_worn ?? 0),
    lastWornDate: row.last_worn_date ?? null,
    notes: row.notes ?? null,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function rowToOutfit(db: DatabaseAdapter, row: Record<string, unknown>): Outfit {
  return OutfitSchema.parse({
    id: row.id,
    name: row.name,
    itemIds: getOutfitItemIds(db, row.id as string),
    occasion: row.occasion ?? null,
    season: row.season ?? null,
    imageUri: row.image_uri ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function rowToWearLog(db: DatabaseAdapter, row: Record<string, unknown>): WearLog {
  return WearLogSchema.parse({
    id: row.id,
    date: row.date,
    outfitId: row.outfit_id ?? null,
    itemIds: getWearLogItemIds(db, row.id as string),
    notes: row.notes ?? null,
    createdAt: row.created_at,
  });
}

function rowToTag(row: Record<string, unknown>): ClosetTag {
  return ClosetTagSchema.parse({
    id: row.id,
    name: row.name,
    usageCount: Number(row.usage_count ?? 0),
    createdAt: row.created_at,
  });
}

export function createClothingItem(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateClothingItemInput,
): ClothingItem {
  const input = CreateClothingItemInputSchema.parse(rawInput);
  const now = nowIso();

  db.transaction(() => {
    db.execute(
      `INSERT INTO cl_items (
        id, name, category, color, brand, purchase_price_cents, purchase_date, image_uri,
        seasons_json, occasions_json, condition, status, laundry_status, times_worn, last_worn_date,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, ?)`,
      [
        id,
        input.name.trim(),
        input.category,
        input.color,
        input.brand,
        input.purchasePriceCents,
        input.purchaseDate,
        input.imageUri,
        JSON.stringify(input.seasons),
        JSON.stringify(input.occasions),
        input.condition,
        input.status,
        input.laundryStatus,
        input.notes,
        now,
        now,
      ],
    );

    syncItemTags(db, id, input.tags, now);
  });

  return getClothingItemById(db, id)!;
}

export function updateClothingItem(
  db: DatabaseAdapter,
  itemId: string,
  rawInput: UpdateClothingItemInput,
): ClothingItem | null {
  const existing = getClothingItemById(db, itemId);
  if (!existing) {
    return null;
  }
  const input = UpdateClothingItemInputSchema.parse(rawInput);
  const now = nowIso();
  const next = {
    name: input.name?.trim() ?? existing.name,
    category: input.category ?? existing.category,
    color: input.color === undefined ? existing.color : input.color,
    brand: input.brand === undefined ? existing.brand : input.brand,
    purchasePriceCents:
      input.purchasePriceCents === undefined ? existing.purchasePriceCents : input.purchasePriceCents,
    purchaseDate: input.purchaseDate === undefined ? existing.purchaseDate : input.purchaseDate,
    imageUri: input.imageUri === undefined ? existing.imageUri : input.imageUri,
    seasons: input.seasons ?? existing.seasons,
    occasions: input.occasions ?? existing.occasions,
    condition: input.condition ?? existing.condition,
    status: input.status ?? existing.status,
    laundryStatus: input.laundryStatus ?? existing.laundryStatus,
    timesWorn: input.timesWorn ?? existing.timesWorn,
    lastWornDate: input.lastWornDate === undefined ? existing.lastWornDate : input.lastWornDate,
    notes: input.notes === undefined ? existing.notes : input.notes,
    tags: input.tags ?? existing.tags,
  };

  db.transaction(() => {
    db.execute(
      `UPDATE cl_items
       SET name = ?, category = ?, color = ?, brand = ?, purchase_price_cents = ?, purchase_date = ?,
           image_uri = ?, seasons_json = ?, occasions_json = ?, condition = ?, status = ?,
           laundry_status = ?, times_worn = ?, last_worn_date = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        next.name,
        next.category,
        next.color,
        next.brand,
        next.purchasePriceCents,
        next.purchaseDate,
        next.imageUri,
        JSON.stringify(next.seasons),
        JSON.stringify(next.occasions),
        next.condition,
        next.status,
        next.laundryStatus,
        next.timesWorn,
        next.lastWornDate,
        next.notes,
        now,
        itemId,
      ],
    );
    syncItemTags(db, itemId, next.tags, now);
  });

  return getClothingItemById(db, itemId);
}

export function getClothingItemById(db: DatabaseAdapter, itemId: string): ClothingItem | null {
  const row = db.query<Record<string, unknown>>(`SELECT * FROM cl_items WHERE id = ?`, [itemId])[0];
  return row ? rowToItem(row, getItemTags(db, itemId)) : null;
}

export function listClothingItems(
  db: DatabaseAdapter,
  rawFilter?: ClothingItemFilter,
): ClothingItem[] {
  const filter = ClothingItemFilterSchema.parse(rawFilter ?? {});
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.category) {
    conditions.push(`i.category = ?`);
    params.push(filter.category);
  }
  if (filter.status) {
    conditions.push(`i.status = ?`);
    params.push(filter.status);
  }
  if (filter.tag) {
    conditions.push(
      `i.id IN (
        SELECT it.item_id
        FROM cl_item_tags it
        INNER JOIN cl_tags t ON t.id = it.tag_id
        WHERE t.name = ?
      )`,
    );
    params.push(normalizeTagName(filter.tag));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db
    .query<Record<string, unknown>>(
      `SELECT i.* FROM cl_items i
       ${where}
       ORDER BY i.created_at DESC
       LIMIT ?`,
      [...params, filter.limit],
    )
    .map((row) => rowToItem(row, getItemTags(db, row.id as string)));
}

export function listClosetTags(db: DatabaseAdapter): ClosetTag[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT t.id, t.name, t.created_at, COUNT(it.item_id) AS usage_count
       FROM cl_tags t
       LEFT JOIN cl_item_tags it ON it.tag_id = t.id
       GROUP BY t.id
       ORDER BY t.name ASC`,
    )
    .map(rowToTag);
}

export function createOutfit(db: DatabaseAdapter, id: string, rawInput: CreateOutfitInput): Outfit {
  const input = CreateOutfitInputSchema.parse(rawInput);
  const now = nowIso();
  const itemIds = [...new Set(input.itemIds)];

  db.transaction(() => {
    db.execute(
      `INSERT INTO cl_outfits (id, name, occasion, season, image_uri, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.name.trim(), input.occasion, input.season, input.imageUri, input.notes, now, now],
    );

    for (const itemId of itemIds) {
      db.execute(
        `INSERT OR IGNORE INTO cl_outfit_items (id, outfit_id, item_id, created_at) VALUES (?, ?, ?, ?)`,
        [createId('cl_outfit_item'), id, itemId, now],
      );
    }
  });

  return getOutfitById(db, id)!;
}

export function getOutfitById(db: DatabaseAdapter, outfitId: string): Outfit | null {
  const row = db.query<Record<string, unknown>>(`SELECT * FROM cl_outfits WHERE id = ?`, [outfitId])[0];
  return row ? rowToOutfit(db, row) : null;
}

export function listOutfits(db: DatabaseAdapter): Outfit[] {
  return db
    .query<Record<string, unknown>>(`SELECT * FROM cl_outfits ORDER BY created_at DESC`)
    .map((row) => rowToOutfit(db, row));
}

export function logWearEvent(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateWearLogInput,
): WearLog {
  const input = CreateWearLogInputSchema.parse(rawInput);
  const now = nowIso();
  const date = input.date ?? dateOnly(now);
  const outfitItemIds = input.outfitId ? getOutfitItemIds(db, input.outfitId) : [];
  const itemIds = [...new Set([...input.itemIds, ...outfitItemIds])];

  db.transaction(() => {
    db.execute(
      `INSERT INTO cl_wear_logs (id, date, outfit_id, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
      [id, date, input.outfitId, input.notes, now],
    );

    for (const itemId of itemIds) {
      db.execute(
        `INSERT OR IGNORE INTO cl_wear_log_items (id, wear_log_id, item_id, created_at) VALUES (?, ?, ?, ?)`,
        [createId('cl_wear_log_item'), id, itemId, now],
      );
      db.execute(
        `UPDATE cl_items
         SET times_worn = times_worn + 1, last_worn_date = ?, updated_at = ?
         WHERE id = ?`,
        [date, now, itemId],
      );
    }
  });

  return getWearLogById(db, id)!;
}

export function getWearLogById(db: DatabaseAdapter, wearLogId: string): WearLog | null {
  const row = db.query<Record<string, unknown>>(`SELECT * FROM cl_wear_logs WHERE id = ?`, [wearLogId])[0];
  return row ? rowToWearLog(db, row) : null;
}

export function listWearLogs(
  db: DatabaseAdapter,
  options?: { startDate?: string; endDate?: string; limit?: number },
): WearLog[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options?.startDate) {
    conditions.push(`date >= ?`);
    params.push(options.startDate);
  }
  if (options?.endDate) {
    conditions.push(`date <= ?`);
    params.push(options.endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM cl_wear_logs
       ${where}
       ORDER BY date DESC, created_at DESC
       LIMIT ?`,
      [...params, options?.limit ?? 60],
    )
    .map((row) => rowToWearLog(db, row));
}

export function getClosetSetting(db: DatabaseAdapter, key: string): string | null {
  const row = db.query<{ value: string }>(`SELECT value FROM cl_settings WHERE key = ?`, [key])[0];
  return row?.value ?? null;
}

export function setClosetSetting(db: DatabaseAdapter, key: string, value: string): ClosetSetting {
  db.execute(
    `INSERT INTO cl_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
  return ClosetSettingSchema.parse({ key, value });
}

export function listDonationCandidates(
  db: DatabaseAdapter,
  referenceDate = dateOnly(nowIso()),
): ClothingItem[] {
  const thresholdDays = Number(getClosetSetting(db, 'donationThresholdDays') ?? '365');
  const cutoff = new Date(`${referenceDate}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - thresholdDays);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM cl_items
       WHERE status = 'active'
         AND (last_worn_date IS NULL OR last_worn_date < ?)
       ORDER BY COALESCE(last_worn_date, '0000-00-00') ASC, created_at ASC`,
      [cutoffDate],
    )
    .map((row) => rowToItem(row, getItemTags(db, row.id as string)));
}

export function getClosetDashboard(
  db: DatabaseAdapter,
  referenceDate = dateOnly(nowIso()),
): ClosetDashboard {
  const items = listClothingItems(db, { status: 'active', limit: 500 });
  const totalOutfits = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM cl_outfits`)[0]?.count ?? 0;
  const windowStart = new Date(`${referenceDate}T00:00:00Z`);
  windowStart.setUTCDate(windowStart.getUTCDate() - 29);
  const itemsWorn30Days =
    db.query<{ count: number }>(
      `SELECT COUNT(DISTINCT item_id) as count
       FROM cl_wear_log_items wli
       INNER JOIN cl_wear_logs wl ON wl.id = wli.wear_log_id
       WHERE wl.date >= ? AND wl.date <= ?`,
      [windowStart.toISOString().slice(0, 10), referenceDate],
    )[0]?.count ?? 0;
  const donationCandidateCount = listDonationCandidates(db, referenceDate).length;

  return ClosetDashboardSchema.parse(
    summarizeClosetDashboard(items, totalOutfits, itemsWorn30Days, donationCandidateCount),
  );
}
