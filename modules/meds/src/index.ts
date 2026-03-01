export { MEDS_MODULE } from './definition';

// Re-export all models
export * from './models';

// Re-export legacy CRUD operations (backward compat)
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

// Extended medication CRUD + refill tracking
export {
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
} from './medication';
export type { LowSupplyAlert } from './medication';

// Reminders, dose logging, and adherence engine
export {
  createRemindersForMedication,
  getActiveReminders,
  snoozeReminder,
  dismissReminder,
  getRemindersForMedication,
  logDose,
  getDoseLogsForDate,
  getDoseLogsForMedication,
  undoDoseLog,
  getAdherenceRate as getAdherenceRateV2,
  getStreak,
  getAdherenceStats,
  getAdherenceByDay,
  getAdherenceCalendar,
} from './reminders';
export type { AdherenceStats, DayStatus, DayAdherence, MedDayStatus, CalendarDay } from './reminders';

// Drug interaction checker
export {
  seedAdditionalInteractions,
  checkInteractions,
  getInteractionsForMedication,
  ADDITIONAL_INTERACTIONS,
} from './interactions';
export type { BundledInteraction } from './interactions';

// Health measurements
export {
  logMeasurement,
  getMeasurements,
  getMeasurementById,
  updateMeasurement,
  deleteMeasurement,
  getMeasurementTrend,
  getMeasurementTrendWithMedMarkers,
} from './measurements';

// Mood, activities, symptoms, and calendar
export {
  MOOD_VOCABULARY,
  MOOD_VOCABULARY_SIMPLIFIED,
  DEFAULT_ACTIVITIES,
  HIGH_ENERGY_PLEASANT,
  HIGH_ENERGY_UNPLEASANT,
  LOW_ENERGY_PLEASANT,
  LOW_ENERGY_UNPLEASANT,
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
} from './mood';
export type { MoodQuadrant } from './mood';

// Analytics and correlation engine
export {
  getMoodMedicationCorrelation,
  getSymptomMedicationCorrelation,
  getAdherenceMoodCorrelation,
  getOverallWellnessTimeline,
  getOverallStats,
} from './analytics';
export type {
  MoodMedicationCorrelation,
  SymptomMedicationCorrelation,
  SymptomCorrelationItem,
  AdherenceMoodCorrelation,
  WellnessTimelineEntry,
  MedicationSummary,
  OverallStats,
} from './analytics';

// Export reports (doctor + therapy markdown)
export { generateDoctorReport, generateTherapyReport } from './export';
