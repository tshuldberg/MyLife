export { MEDS_MODULE } from './definition';

// Re-export all models
export * from './models';

// Re-export CRUD operations
export {
  createMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  countMedications,
  recordDose,
  getDoses,
  getDosesForDate,
  deleteDose,
  getAdherenceRate,
  getSetting,
  setSetting,
} from './db';

// Re-export migration for external use
export { MEDS_MIGRATION_V2 } from './db/migrations';
