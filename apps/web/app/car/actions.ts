'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  countVehicles,
  createMaintenance,
  getMaintenanceByVehicle,
  deleteMaintenance,
  createFuelLog,
  getFuelLogsByVehicle,
  deleteFuelLog,
} from '@mylife/car';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('car');
  return adapter;
}

/* ── Vehicles ── */

export async function fetchVehicles() {
  return getVehicles(db());
}

export async function fetchVehicleById(id: string) {
  return getVehicleById(db(), id);
}

export async function doCreateVehicle(
  id: string,
  input: {
    name: string;
    make: string;
    model: string;
    year: number;
    fuelType?: string;
    odometer?: number;
  },
) {
  createVehicle(db(), id, input);
}

export async function doUpdateVehicle(
  id: string,
  updates: Partial<{
    name: string;
    make: string;
    model: string;
    year: number;
    odometer: number;
    fuelType: string;
    isPrimary: boolean;
  }>,
) {
  updateVehicle(db(), id, updates);
}

export async function doDeleteVehicle(id: string) {
  deleteVehicle(db(), id);
}

export async function fetchVehicleCount() {
  return countVehicles(db());
}

/* ── Maintenance ── */

export async function fetchMaintenance(vehicleId: string) {
  return getMaintenanceByVehicle(db(), vehicleId);
}

export async function doCreateMaintenance(
  id: string,
  vehicleId: string,
  input: {
    type: string;
    performedAt: string;
    description?: string;
    costCents?: number;
    odometerAt?: number;
  },
) {
  createMaintenance(db(), id, vehicleId, input);
}

export async function doDeleteMaintenance(id: string) {
  deleteMaintenance(db(), id);
}

/* ── Fuel Logs ── */

export async function fetchFuelLogs(vehicleId: string) {
  return getFuelLogsByVehicle(db(), vehicleId);
}

export async function doCreateFuelLog(
  id: string,
  vehicleId: string,
  input: {
    gallons: number;
    costCents: number;
    odometerAt: number;
    loggedAt: string;
    station?: string;
    isFullTank?: boolean;
  },
) {
  createFuelLog(db(), id, vehicleId, input);
}

export async function doDeleteFuelLog(id: string) {
  deleteFuelLog(db(), id);
}
