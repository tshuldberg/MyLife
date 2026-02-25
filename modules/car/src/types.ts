import { z } from 'zod';

// ── Fuel type enum ──────────────────────────────────────────────────────────
export const FuelTypeSchema = z.enum(['gas', 'diesel', 'electric', 'hybrid']);
export type FuelType = z.infer<typeof FuelTypeSchema>;

// ── Maintenance type enum ───────────────────────────────────────────────────
export const MaintenanceTypeSchema = z.enum([
  'oil_change',
  'tire_rotation',
  'brakes',
  'battery',
  'inspection',
  'wash',
  'other',
]);
export type MaintenanceType = z.infer<typeof MaintenanceTypeSchema>;

// ── Vehicle ─────────────────────────────────────────────────────────────────
export const VehicleSchema = z.object({
  id: z.string(),
  name: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  color: z.string().nullable(),
  vin: z.string().nullable(),
  licensePlate: z.string().nullable(),
  odometer: z.number().int(),
  fuelType: FuelTypeSchema,
  isPrimary: z.boolean(),
  imageUri: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

// ── Maintenance record ──────────────────────────────────────────────────────
export const MaintenanceSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  type: MaintenanceTypeSchema,
  description: z.string().nullable(),
  costCents: z.number().int().nullable(),
  odometerAt: z.number().int().nullable(),
  performedAt: z.string(),
  nextDueDate: z.string().nullable(),
  nextDueOdometer: z.number().int().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type Maintenance = z.infer<typeof MaintenanceSchema>;

// ── Fuel log entry ──────────────────────────────────────────────────────────
export const FuelLogSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  gallons: z.number(),
  costCents: z.number().int(),
  odometerAt: z.number().int(),
  station: z.string().nullable(),
  isFullTank: z.boolean(),
  loggedAt: z.string(),
  createdAt: z.string(),
});
export type FuelLog = z.infer<typeof FuelLogSchema>;
