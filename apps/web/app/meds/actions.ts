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
  // Extended medication + refill
  getActiveMedications,
  getMedicationExtended,
  createMedicationExtended,
  updatePillCount,
  recordRefill,
  getRefillHistory,
  getLowSupplyAlerts,
  getDaysRemaining,
  // Interactions
  checkInteractions,
  getInteractionsForMedication,
  // Dose logging v2
  logDose,
  getDoseLogsForDate,
  getAdherenceStats,
  getAdherenceCalendar,
  getStreak,
  // Measurements
  logMeasurement,
  getMeasurements,
  getMeasurementTrend,
  // Mood
  createMoodEntry,
  getMoodEntries,
  getMoodCalendarMonth,
  getDayDetail,
  logSymptom,
  getSymptomLogs,
  // Analytics
  getMoodMedicationCorrelation,
  getOverallStats,
  // Export
  generateDoctorReport,
  generateTherapyReport,
} from '@mylife/meds';
import type { CreateMedicationInput } from '@mylife/meds';
import type { CreateRefillInput } from '@mylife/meds';
import type { CreateDoseLogInput } from '@mylife/meds';
import type { CreateMeasurementInput } from '@mylife/meds';
import type { CreateMoodEntryInput } from '@mylife/meds';

function db() {
  const adapter = getAdapter();
  ensureModuleMigrations('meds');
  return adapter;
}

// ---------------------------------------------------------------------------
// Legacy CRUD (v1 -- keep existing)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Extended medication CRUD + refill tracking
// ---------------------------------------------------------------------------

export async function fetchActiveMedications() {
  return getActiveMedications(db());
}

export async function fetchMedicationExtended(id: string) {
  return getMedicationExtended(db(), id);
}

export async function doCreateMedicationExtended(
  id: string,
  input: CreateMedicationInput,
) {
  createMedicationExtended(db(), id, input);
}

export async function doUpdatePillCount(id: string, count: number) {
  updatePillCount(db(), id, count);
}

export async function doRecordRefill(id: string, input: CreateRefillInput) {
  recordRefill(db(), id, input);
}

export async function fetchRefillHistory(medicationId: string) {
  return getRefillHistory(db(), medicationId);
}

export async function fetchLowSupplyAlerts() {
  return getLowSupplyAlerts(db());
}

export async function fetchDaysRemaining(medicationId: string) {
  return getDaysRemaining(db(), medicationId);
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

export async function doCheckInteractions(
  drugName: string,
  activeMedNames: string[],
) {
  return checkInteractions(db(), drugName, activeMedNames);
}

export async function fetchInteractions(medicationId: string) {
  return getInteractionsForMedication(db(), medicationId);
}

// ---------------------------------------------------------------------------
// Dose logging v2
// ---------------------------------------------------------------------------

export async function doLogDoseV2(id: string, input: CreateDoseLogInput) {
  logDose(db(), id, input);
}

export async function fetchDoseLogsForDate(date: string) {
  return getDoseLogsForDate(db(), date);
}

export async function fetchAdherenceStats(
  medicationId: string,
  days: number = 30,
) {
  return getAdherenceStats(db(), medicationId, days);
}

export async function fetchAdherenceCalendar(month: string) {
  return getAdherenceCalendar(db(), month);
}

export async function fetchStreak(medicationId: string) {
  return getStreak(db(), medicationId);
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

export async function doLogMeasurement(
  id: string,
  input: CreateMeasurementInput,
) {
  logMeasurement(db(), id, input);
}

export async function fetchMeasurements(opts?: {
  type?: string;
  from?: string;
  to?: string;
}) {
  return getMeasurements(db(), opts);
}

export async function fetchMeasurementTrend(
  type: string,
  from: string,
  to: string,
) {
  return getMeasurementTrend(db(), type, from, to);
}

// ---------------------------------------------------------------------------
// Mood + symptoms
// ---------------------------------------------------------------------------

export async function doCreateMoodEntry(
  id: string,
  input: CreateMoodEntryInput,
) {
  createMoodEntry(db(), id, input);
}

export async function fetchMoodEntries(from?: string, to?: string) {
  return getMoodEntries(db(), from, to);
}

export async function fetchMoodCalendarMonth(year: number, month: number) {
  return getMoodCalendarMonth(db(), year, month);
}

export async function fetchDayDetail(date: string) {
  return getDayDetail(db(), date);
}

export async function doLogSymptom(
  id: string,
  symptomId: string,
  severity: number,
  notes?: string,
) {
  logSymptom(db(), id, symptomId, severity, notes);
}

export async function fetchSymptomLogs(from?: string, to?: string) {
  return getSymptomLogs(db(), from, to);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function fetchCorrelation(medicationId: string) {
  return getMoodMedicationCorrelation(db(), medicationId);
}

export async function fetchOverallStats() {
  return getOverallStats(db());
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function generateReport(
  type: 'doctor' | 'therapy',
  from: string,
  to: string,
) {
  if (type === 'therapy') {
    return generateTherapyReport(db(), from, to);
  }
  return generateDoctorReport(db(), from, to);
}
