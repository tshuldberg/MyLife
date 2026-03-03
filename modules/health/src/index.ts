// Module definition
export { HEALTH_MODULE } from './definition';

// Health-specific schema and migration
export { HEALTH_MIGRATION_V1 } from './db/migrations';
export * from './db/schema';

// Re-export absorbed module APIs so consumers access everything via @mylife/health.
// Business logic is NOT duplicated -- these are pass-through re-exports.

// --- MyMeds (medication tracking, dose logging, mood, symptoms, analytics) ---
export {
  // Medication CRUD
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
  getSetting as getMedsSetting,
  setSetting as setMedsSetting,
  // Extended medication CRUD + refill tracking
  createMedicationExtended,
  getMedicationExtended,
  getActiveMedications,
  updatePillCount,
  decrementPillCount,
  recordRefill,
  getRefillHistory,
  calculateBurnRate,
  getDaysRemaining,
  getLowSupplyAlerts,
  // Reminders, dose logging, adherence
  createRemindersForMedication,
  getActiveReminders,
  snoozeReminder,
  dismissReminder,
  getRemindersForMedication,
  logDose,
  getDoseLogsForDate,
  getDoseLogsForMedication,
  undoDoseLog,
  getAdherenceRateV2,
  getStreak,
  getAdherenceStats,
  getAdherenceByDay,
  getAdherenceCalendar,
  // Drug interactions
  seedAdditionalInteractions,
  checkInteractions,
  getInteractionsForMedication,
  ADDITIONAL_INTERACTIONS,
  // Measurements
  logMeasurement,
  getMeasurements,
  getMeasurementById,
  updateMeasurement,
  deleteMeasurement,
  getMeasurementTrend,
  getMeasurementTrendWithMedMarkers,
  // Mood, activities, symptoms
  MOOD_VOCABULARY,
  MOOD_VOCABULARY_SIMPLIFIED,
  DEFAULT_ACTIVITIES,
  moodColor,
  createMoodEntry,
  getMoodEntries,
  getMoodEntryById,
  deleteMoodEntry,
  getMoodEntriesForDate,
  addActivity,
  getActivities,
  removeActivity,
  getDailyMoodSummary,
  seedPredefinedSymptoms,
  getSymptoms,
  createCustomSymptom,
  logSymptom,
  getSymptomLogs,
  getSymptomLogsForSymptom,
  getMoodCalendar,
  getMoodCalendarMonth,
  getDayDetail,
  // Analytics
  getMoodMedicationCorrelation,
  getSymptomMedicationCorrelation,
  getAdherenceMoodCorrelation,
  getOverallWellnessTimeline,
  getOverallStats,
  // Export reports
  generateDoctorReport,
  generateTherapyReport,
} from '@mylife/meds';

export type {
  LowSupplyAlert,
  AdherenceStats,
  DayStatus,
  DayAdherence,
  MedDayStatus,
  CalendarDay,
  MoodQuadrant,
  MoodMedicationCorrelation,
  SymptomMedicationCorrelation,
  SymptomCorrelationItem,
  AdherenceMoodCorrelation,
  WellnessTimelineEntry,
  MedicationSummary,
  OverallStats,
  BundledInteraction,
} from '@mylife/meds';

// --- MyFast (fasting timer, protocols, weight, water, goals, streaks) ---
export { FAST_MODULE } from '@mylife/fast';

// --- Health-specific business logic (new, not absorbed from other modules) ---

// Documents (health records, lab results, prescriptions)
export {
  createDocument,
  getDocuments,
  getDocument,
  getDocumentsByType,
  getStarredDocuments,
  updateDocument,
  deleteDocument,
} from './documents/crud';
export type {
  HealthDocument,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentType,
} from './documents/types';
export { MAX_DOCUMENT_SIZE } from './documents/types';

// Vitals (heart rate, HRV, SpO2, BP, temperature, steps, energy)
export {
  logVital,
  getVitals,
  getVitalsByType,
  getVitalsByDateRange,
  getVitalAggregates,
  getLatestVital,
  deleteVital,
} from './vitals/crud';
export type { Vital, LogVitalInput, VitalAggregate, VitalType, VitalSource } from './vitals/types';

// Sleep (sessions, quality scoring)
export {
  logSleep,
  getSleepSessions,
  getSleepByDateRange,
  getLastNightSleep,
  computeQualityScore,
  deleteSleepSession,
} from './sleep/crud';
export type { SleepSession, LogSleepInput, SleepSource } from './sleep/types';
export { DEFAULT_SLEEP_TARGET_HOURS } from './sleep/types';

// Goals (cross-domain health goals)
export {
  createGoal,
  getActiveGoals,
  getGoalById,
  deactivateGoal,
  deleteGoal,
  recordProgress,
  getGoalProgress,
} from './goals/crud';
export type { HealthGoal, CreateGoalInput, GoalProgress, GoalDomain, GoalPeriod, GoalDirection } from './goals/types';

// Emergency info (ICE card)
export {
  getEmergencyInfo,
  updateEmergencyInfo,
} from './emergency/crud';
export type { EmergencyInfo, UpdateEmergencyInfoInput, BloodType } from './emergency/types';

// Consolidated settings
export {
  getHealthSetting,
  setHealthSetting,
  getAllHealthSettings,
  isHealthSyncEnabled,
  setHealthSyncToggle,
} from './settings';

// Migration (absorbed module consolidation)
export {
  detectAbsorbedModuleData,
  isAbsorptionMigrated,
  migrateAbsorbedSettings,
  disableAbsorbedModules,
} from './migration/absorb';
export type { AbsorbedModuleData } from './migration/absorb';
