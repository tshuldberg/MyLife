# @mylife/pets

## Overview

Pet health records and care tracker for the MyLife hub. Manage pet profiles across 9 species (dog, cat, bird, fish, reptile, rabbit, small mammal, horse, other), vaccination records with reminders, vet visit logs, medication tracking with dose scheduling, weight tracking with trend analysis, feeding schedules, and expense tracking with cost-of-ownership analytics. All data local SQLite.

## Exports

| Name | Type | Description |
|------|------|-------------|
| `PETS_MODULE` | ModuleDefinition | Module registration contract (id: `pets`, prefix: `pt_`, tier: premium) |
| Schemas | Zod | 20+ Zod schemas (pet, vet visit, vaccination, medication, medication log, weight entry, feeding schedule, expense, dashboard, vaccination reminder, weight trend, create/update inputs, filters) |
| Pet CRUD | Functions | `createPet`, `getPetById`, `listPets`, `updatePet`, `deletePet` |
| Vet visit CRUD | Functions | `createVetVisit`, `listVetVisitsForPet` |
| Vaccination CRUD | Functions | `createVaccination`, `listVaccinationsForPet`, `listDueVaccinationReminders` |
| Medication CRUD | Functions | `createMedication`, `getMedicationById`, `listMedicationsForPet`, `listDueMedications`, `recordMedicationLog`, `listMedicationLogs` |
| Weight CRUD | Functions | `createWeightEntry`, `listWeightEntriesForPet` |
| Feeding CRUD | Functions | `createFeedingSchedule`, `listFeedingSchedulesForPet` |
| Expense CRUD | Functions | `createPetExpense`, `listExpensesForPet` |
| Dashboard | Functions | `getPetDashboard` |
| Weight engine | Functions | `calculatePetAgeYears`, `calculateWeightTrend`, `calculateOwnershipCost`, `calculateAverageMonthlyCost` |
| Reminders engine | Functions | `getReminderStatus`, `computeNextMedicationDueAt`, `collectVaccinationReminders`, `collectMedicationReminders` |
| Constants | Data | `CORE_VACCINE_SCHEDULES` (dog: Rabies/DHPP/Bordetella, cat: Rabies/FVRCP/FeLV) |

## Storage

- **Type:** sqlite
- **Table prefix:** `pt_`
- **Schema version:** 1
- **Key tables:** `pt_pets` (profiles with species, breed, sex, sterilization, microchip), `pt_vet_visits` (visit type, diagnosis, treatment, cost), `pt_vaccinations` (date given, next due date, lot number), `pt_medications` (frequency scheduling, active/inactive), `pt_medication_logs` (given/skipped status), `pt_weight_entries` (grams, body condition score 1-9), `pt_feeding_schedules` (label, food name, amount, feed time), `pt_expenses` (8 categories, amount in cents)
- **Indexes:** 10 indexes on pet archive status, visit date, vaccination due date, medication due date, medication logs, weight entries, feeding times, expenses

## Engines

- **engine/weight.ts** -- Pure functions: pet age calculation from birth date, weight trend detection (stable/gaining/losing with 2% threshold), total ownership cost summation, average monthly cost with adoption date normalization
- **engine/reminders.ts** -- Pure functions: reminder status classification (current/due_soon/overdue), next medication due-at computation for 6 frequency types (daily, twice daily, weekly, monthly, every N days, as needed), vaccination reminder collection with warning window filtering, medication reminder collection with active-only filtering

## Test Coverage

- **Test files:** 2
- **Tests:** 30+
- **Covered:** Pet CRUD (create, read, update, delete, list with archive filter), all species types, optional fields, vet visit CRUD and ordering, vaccination CRUD and reminders, medication CRUD (active/inactive filtering, dose logging, skipped dose handling, error on missing medication), weight entry CRUD (updates pet current weight), feeding schedule ordering, expense CRUD and isolation, dashboard per-pet isolation, dashboard null for non-existent pet, multi-pet data isolation, weight trend (gaining/losing/stable/empty/single/out-of-order), pet age (null birth, same day, fractional, old pet), ownership cost (empty, sum), monthly cost (null adoption, division, recent adoption), reminder status (overdue/due_soon/current/exact day/custom window), medication scheduling (all 6 frequencies), vaccination reminder collection (sorting, unknown pets, filtering), medication reminder collection (inactive/null/sorting)

## Key Files

- `src/definition.ts` -- Module definition (1 migration, 8 tables)
- `src/index.ts` -- Public API barrel export (40+ exports)
- `src/types.ts` -- All Zod schemas, TypeScript types, core vaccine schedules
- `src/db/crud.ts` -- All CRUD operations (23 functions), dashboard aggregation
- `src/db/schema.ts` -- CREATE TABLE statements (8 tables, 10 indexes)
- `src/engine/weight.ts` -- Weight trend, age, and cost calculators
- `src/engine/reminders.ts` -- Reminder status, medication scheduling, reminder collectors
