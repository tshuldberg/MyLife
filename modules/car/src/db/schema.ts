/**
 * SQLite schema for MyCar module.
 * All table names use the cr_ prefix to avoid collisions in the shared hub database.
 *
 * UUIDs stored as TEXT.
 * Dates stored as TEXT in ISO datetime format.
 * Booleans stored as INTEGER (0/1).
 * Money stored as INTEGER (cents).
 */

// -- 1. Vehicles --
export const CREATE_VEHICLES = `
CREATE TABLE IF NOT EXISTS cr_vehicles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT,
    vin TEXT,
    license_plate TEXT,
    odometer INTEGER NOT NULL DEFAULT 0,
    fuel_type TEXT NOT NULL DEFAULT 'gas',
    is_primary INTEGER NOT NULL DEFAULT 0,
    image_uri TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 2. Maintenance --
export const CREATE_MAINTENANCE = `
CREATE TABLE IF NOT EXISTS cr_maintenance (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES cr_vehicles(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'other',
    description TEXT,
    cost_cents INTEGER,
    odometer_at INTEGER,
    performed_at TEXT NOT NULL,
    next_due_date TEXT,
    next_due_odometer INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 3. Fuel Logs --
export const CREATE_FUEL_LOGS = `
CREATE TABLE IF NOT EXISTS cr_fuel_logs (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES cr_vehicles(id) ON DELETE CASCADE,
    gallons REAL NOT NULL,
    cost_cents INTEGER NOT NULL,
    odometer_at INTEGER NOT NULL,
    station TEXT,
    is_full_tank INTEGER NOT NULL DEFAULT 1,
    logged_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- 4. Settings --
export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS cr_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// -- Indexes --
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS cr_maintenance_vehicle_idx ON cr_maintenance(vehicle_id)`,
  `CREATE INDEX IF NOT EXISTS cr_maintenance_performed_idx ON cr_maintenance(performed_at)`,
  `CREATE INDEX IF NOT EXISTS cr_fuel_logs_vehicle_idx ON cr_fuel_logs(vehicle_id)`,
  `CREATE INDEX IF NOT EXISTS cr_fuel_logs_logged_idx ON cr_fuel_logs(logged_at)`,
  `CREATE INDEX IF NOT EXISTS cr_vehicles_primary_idx ON cr_vehicles(is_primary)`,
];

/** All table creation statements in dependency order */
export const ALL_TABLES = [
  CREATE_VEHICLES,
  CREATE_MAINTENANCE,
  CREATE_FUEL_LOGS,
  CREATE_SETTINGS,
];

/** Seed SQL for default settings */
export const SEED_SETTINGS = [
  `INSERT OR IGNORE INTO cr_settings (key, value) VALUES ('distanceUnit', 'miles')`,
  `INSERT OR IGNORE INTO cr_settings (key, value) VALUES ('fuelUnit', 'gallons')`,
  `INSERT OR IGNORE INTO cr_settings (key, value) VALUES ('currencyCode', 'USD')`,
];
