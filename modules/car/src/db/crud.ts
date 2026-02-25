import type { DatabaseAdapter } from '@mylife/db';
import type { Vehicle, Maintenance, FuelLog } from '../types';

// ---------------------------------------------------------------------------
// Row mappers (snake_case SQL → camelCase TS)
// ---------------------------------------------------------------------------

function rowToVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: row.id as string,
    name: row.name as string,
    make: row.make as string,
    model: row.model as string,
    year: row.year as number,
    color: (row.color as string) ?? null,
    vin: (row.vin as string) ?? null,
    licensePlate: (row.license_plate as string) ?? null,
    odometer: row.odometer as number,
    fuelType: row.fuel_type as Vehicle['fuelType'],
    isPrimary: !!(row.is_primary as number),
    imageUri: (row.image_uri as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMaintenance(row: Record<string, unknown>): Maintenance {
  return {
    id: row.id as string,
    vehicleId: row.vehicle_id as string,
    type: row.type as Maintenance['type'],
    description: (row.description as string) ?? null,
    costCents: (row.cost_cents as number) ?? null,
    odometerAt: (row.odometer_at as number) ?? null,
    performedAt: row.performed_at as string,
    nextDueDate: (row.next_due_date as string) ?? null,
    nextDueOdometer: (row.next_due_odometer as number) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToFuelLog(row: Record<string, unknown>): FuelLog {
  return {
    id: row.id as string,
    vehicleId: row.vehicle_id as string,
    gallons: row.gallons as number,
    costCents: row.cost_cents as number,
    odometerAt: row.odometer_at as number,
    station: (row.station as string) ?? null,
    isFullTank: !!(row.is_full_tank as number),
    loggedAt: row.logged_at as string,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export function createVehicle(
  db: DatabaseAdapter,
  id: string,
  input: { name: string; make: string; model: string; year: number; fuelType?: string; odometer?: number },
): void {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO cr_vehicles (id, name, make, model, year, fuel_type, odometer, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.name, input.make, input.model, input.year, input.fuelType ?? 'gas', input.odometer ?? 0, now, now],
  );
}

export function getVehicles(db: DatabaseAdapter): Vehicle[] {
  return db.query<Record<string, unknown>>('SELECT * FROM cr_vehicles ORDER BY is_primary DESC, name ASC').map(rowToVehicle);
}

export function getVehicleById(db: DatabaseAdapter, id: string): Vehicle | null {
  const rows = db.query<Record<string, unknown>>('SELECT * FROM cr_vehicles WHERE id = ?', [id]);
  return rows.length > 0 ? rowToVehicle(rows[0]) : null;
}

export function updateVehicle(db: DatabaseAdapter, id: string, updates: Partial<{ name: string; make: string; model: string; year: number; odometer: number; fuelType: string; isPrimary: boolean }>): void {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (updates.name !== undefined) { sets.push('name = ?'); params.push(updates.name); }
  if (updates.make !== undefined) { sets.push('make = ?'); params.push(updates.make); }
  if (updates.model !== undefined) { sets.push('model = ?'); params.push(updates.model); }
  if (updates.year !== undefined) { sets.push('year = ?'); params.push(updates.year); }
  if (updates.odometer !== undefined) { sets.push('odometer = ?'); params.push(updates.odometer); }
  if (updates.fuelType !== undefined) { sets.push('fuel_type = ?'); params.push(updates.fuelType); }
  if (updates.isPrimary !== undefined) { sets.push('is_primary = ?'); params.push(updates.isPrimary ? 1 : 0); }
  if (sets.length === 0) return;
  sets.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);
  db.execute(`UPDATE cr_vehicles SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function deleteVehicle(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM cr_vehicles WHERE id = ?', [id]);
}

export function countVehicles(db: DatabaseAdapter): number {
  return (db.query<{ c: number }>('SELECT COUNT(*) as c FROM cr_vehicles')[0]).c;
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

export function createMaintenance(
  db: DatabaseAdapter,
  id: string,
  vehicleId: string,
  input: { type: string; performedAt: string; description?: string; costCents?: number; odometerAt?: number },
): void {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO cr_maintenance (id, vehicle_id, type, description, cost_cents, odometer_at, performed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, vehicleId, input.type, input.description ?? null, input.costCents ?? null, input.odometerAt ?? null, input.performedAt, now],
  );
}

export function getMaintenanceByVehicle(db: DatabaseAdapter, vehicleId: string): Maintenance[] {
  return db.query<Record<string, unknown>>(
    'SELECT * FROM cr_maintenance WHERE vehicle_id = ? ORDER BY performed_at DESC',
    [vehicleId],
  ).map(rowToMaintenance);
}

export function deleteMaintenance(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM cr_maintenance WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Fuel Logs
// ---------------------------------------------------------------------------

export function createFuelLog(
  db: DatabaseAdapter,
  id: string,
  vehicleId: string,
  input: { gallons: number; costCents: number; odometerAt: number; loggedAt: string; station?: string; isFullTank?: boolean },
): void {
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO cr_fuel_logs (id, vehicle_id, gallons, cost_cents, odometer_at, station, is_full_tank, logged_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, vehicleId, input.gallons, input.costCents, input.odometerAt, input.station ?? null, input.isFullTank !== false ? 1 : 0, input.loggedAt, now],
  );
}

export function getFuelLogsByVehicle(db: DatabaseAdapter, vehicleId: string): FuelLog[] {
  return db.query<Record<string, unknown>>(
    'SELECT * FROM cr_fuel_logs WHERE vehicle_id = ? ORDER BY logged_at DESC',
    [vehicleId],
  ).map(rowToFuelLog);
}

export function deleteFuelLog(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM cr_fuel_logs WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSetting(db: DatabaseAdapter, key: string): string | undefined {
  const rows = db.query<{ value: string }>('SELECT value FROM cr_settings WHERE key = ?', [key]);
  return rows.length > 0 ? rows[0].value : undefined;
}

export function setSetting(db: DatabaseAdapter, key: string, value: string): void {
  db.execute(
    `INSERT INTO cr_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value],
  );
}
