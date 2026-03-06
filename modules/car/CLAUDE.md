# @mylife/car

## Overview

Vehicle maintenance and fuel tracking module. Track multiple vehicles with service history, maintenance records, fuel logs, and cost analysis. All data local SQLite, no network required.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `CAR_MODULE` | ModuleDefinition | Module registration contract (id: `car`, prefix: `cr_`, tier: premium) |
| `VehicleSchema` / `Vehicle` | Zod schema + type | Vehicle record (make, model, year, VIN, odometer, fuel type) |
| `MaintenanceSchema` / `Maintenance` | Zod schema + type | Maintenance/service record |
| `FuelLogSchema` / `FuelLog` | Zod schema + type | Fuel log entry |
| `FuelTypeSchema` / `FuelType` | Zod schema + type | Fuel type enum (gas, diesel, electric, hybrid) |
| `MaintenanceTypeSchema` / `MaintenanceType` | Zod schema + type | Maintenance category enum |
| CRUD functions | Functions | Full CRUD for vehicles, maintenance records, fuel logs, settings |

## Storage

- **Type:** sqlite
- **Table prefix:** `cr_`
- **Schema version:** 1
- **Key tables:** `cr_vehicles`, `cr_maintenance`, `cr_fuel_logs`, `cr_settings`

## Engines

None. Straightforward CRUD module.

## Schemas

- `VehicleSchema`
- `FuelTypeSchema`
- `MaintenanceSchema`
- `MaintenanceTypeSchema`
- `FuelLogSchema`

## Test Coverage

- **Test files:** 1
- **Covered:** Core CRUD operations (`__tests__/car.test.ts`)
- **Gaps:** None significant for current scope

## Parity Status

- **Standalone repo:** MyCar (design-only)
- **Hub integration:** wired

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 4 tables)
- `src/index.ts` -- Public API barrel export
- `src/types.ts` -- Zod schemas and TypeScript types
- `src/db/crud.ts` -- All CRUD operations
- `src/db/schema.ts` -- CREATE TABLE statements
