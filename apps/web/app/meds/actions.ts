'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  createMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  countMedications,
  recordDose,
  getDosesForDate,
  deleteDose,
  getAdherenceRate,
} from '@mylife/meds';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('meds');
  return adapter;
}

export async function fetchMedications(opts?: { isActive?: boolean }) {
  return getMedications(db(), opts);
}

export async function fetchMedicationById(id: string) {
  return getMedicationById(db(), id);
}

export async function doCreateMedication(
  id: string,
  input: { name: string; dosage?: string; unit?: string; frequency?: string },
) {
  createMedication(db(), id, input);
}

export async function doUpdateMedication(
  id: string,
  updates: Partial<{
    name: string;
    dosage: string;
    unit: string;
    frequency: string;
    isActive: boolean;
    sortOrder: number;
  }>,
) {
  updateMedication(db(), id, updates);
}

export async function doDeleteMedication(id: string) {
  deleteMedication(db(), id);
}

export async function fetchMedicationCount() {
  return countMedications(db());
}

export async function doRecordDose(
  id: string,
  medicationId: string,
  takenAt: string,
  skipped?: boolean,
) {
  recordDose(db(), id, medicationId, takenAt, skipped);
}

export async function fetchDosesForDate(date: string) {
  return getDosesForDate(db(), date);
}

export async function doDeleteDose(id: string) {
  deleteDose(db(), id);
}

export async function fetchAdherenceRate(
  medicationId: string,
  from: string,
  to: string,
) {
  return getAdherenceRate(db(), medicationId, from, to);
}
