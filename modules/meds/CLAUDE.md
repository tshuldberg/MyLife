# @mylife/meds

## Overview

Medication tracking module with dose logging, reminder scheduling, adherence analytics, drug interaction checking, mood/symptom journaling, health measurements with med-marker correlation, and exportable doctor/therapy reports. Never miss a dose with smart reminders, refill tracking, and comprehensive wellness insights.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `MEDS_MODULE` | ModuleDefinition | Module registration contract (id: `meds`, prefix: `md_`, tier: premium) |
| Models | Zod schemas | Medication, DoseLog, Reminder, Refill, Symptom, MoodEntry, Measurement, Interaction schemas |
| Legacy CRUD | Functions | `createMedication`, `getMedications`, `recordDose`, `getDoses`, `getAdherenceRate`, etc. |
| Extended medication | Functions | `createMedicationExtended`, `getActiveMedications`, `updatePillCount`, `decrementPillCount` |
| Refill tracking | Functions | `recordRefill`, `getRefillHistory`, `calculateBurnRate`, `getDaysRemaining`, `getLowSupplyAlerts` |
| Reminders | Functions | `createRemindersForMedication`, `getActiveReminders`, `snoozeReminder`, `dismissReminder` |
| Dose logging | Functions | `logDose`, `getDoseLogsForDate`, `undoDoseLog` |
| Adherence | Functions | `getAdherenceRateV2`, `getStreak`, `getAdherenceStats`, `getAdherenceByDay`, `getAdherenceCalendar` |
| Interactions | Functions | `checkInteractions`, `getInteractionsForMedication`, `seedAdditionalInteractions` |
| Measurements | Functions | `logMeasurement`, `getMeasurements`, `getMeasurementTrend`, `getMeasurementTrendWithMedMarkers` |
| Mood | Functions | `createMoodEntry`, `getMoodCalendar`, `getDailyMoodSummary`, vocabulary, activities, symptoms |
| Analytics | Functions | Mood-medication correlation, symptom-medication correlation, adherence-mood correlation, wellness timeline |
| Export | Functions | `generateDoctorReport`, `generateTherapyReport` (markdown) |

## Storage

- **Type:** sqlite
- **Table prefix:** `md_`
- **Schema version:** 2
- **Key tables:** `md_medications`, `md_doses`, `md_dose_logs`, `md_reminders`, `md_refills`, `md_symptoms`, `md_symptom_logs`, `md_mood_entries`, `md_activities`, `md_mood_activities`, `md_measurements`, `md_interactions`, `md_settings`

## Engines

- **medication/refill-tracker.ts** -- Burn rate calculation, days remaining, low supply alerts
- **reminders/scheduler.ts** -- Reminder creation from medication schedule
- **reminders/adherence.ts** -- Adherence rate calculation, streaks, calendar view
- **reminders/calendar.ts** -- Adherence calendar generation
- **interactions/checker.ts** -- Drug interaction checking engine
- **interactions/database.ts** -- Bundled interaction database with severity levels
- **measurements/trends.ts** -- Measurement trend analysis with medication markers
- **mood/check-in.ts** -- Mood check-in workflow
- **mood/vocabulary.ts** -- Mood vocabulary (full and simplified sets)
- **mood/activities.ts** -- Activity tracking with mood correlation
- **mood/symptoms.ts** -- Symptom logging and tracking
- **mood/calendar.ts** -- Mood calendar with day detail
- **analytics/correlation.ts** -- Mood-med, symptom-med, adherence-mood correlation engines
- **analytics/stats.ts** -- Overall wellness statistics
- **export/markdown-report.ts** -- Doctor and therapy report generation

## Schemas

- `MedicationSchema`, `DoseLogSchema`, `ReminderSchema`, `RefillSchema`
- `SymptomSchema`, `MoodEntrySchema`, `MeasurementSchema`, `InteractionSchema`
- Various insert/update schemas per domain

## Test Coverage

- **Test files:** 10
- **Covered:** Core meds CRUD (`meds.test.ts`), extended medication (`medication-extended.test.ts`), refill tracking (`refill.test.ts`), reminders (`reminders.test.ts`), adherence (`adherence.test.ts`), interactions (`interactions.test.ts`), mood (`mood.test.ts`), correlation (`correlation.test.ts`), export (`export.test.ts`), measurements (`measurements.test.ts`)
- **Gaps:** Calendar generation edge cases, vocabulary helpers

## Parity Status

- **Standalone repo:** design-only (absorbed into MyHealth)
- **Hub integration:** wired (also re-exported via @mylife/health)

## Key Files

- `src/definition.ts` -- Module definition (2 migrations, 13+ tables)
- `src/index.ts` -- Public API barrel export
- `src/models/` -- Zod model schemas (medication, dose-log, reminder, refill, symptom, mood-entry, measurement, interaction)
- `src/db/crud.ts` -- Legacy CRUD operations
- `src/db/schema.ts` -- CREATE TABLE statements
- `src/medication/refill-tracker.ts` -- Refill and supply tracking
- `src/reminders/adherence.ts` -- Adherence calculation engine
- `src/interactions/checker.ts` -- Drug interaction checker
- `src/analytics/correlation.ts` -- Correlation analysis engine
- `src/export/markdown-report.ts` -- Report generation
