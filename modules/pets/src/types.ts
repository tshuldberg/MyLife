import { z } from 'zod';

export const PetSpeciesSchema = z.enum([
  'dog',
  'cat',
  'bird',
  'fish',
  'reptile',
  'rabbit',
  'small_mammal',
  'horse',
  'other',
]);
export type PetSpecies = z.infer<typeof PetSpeciesSchema>;

export const PetSexSchema = z.enum(['female', 'male', 'unknown']);
export type PetSex = z.infer<typeof PetSexSchema>;

export const VetVisitTypeSchema = z.enum([
  'wellness',
  'sick',
  'emergency',
  'dental',
  'surgery',
  'other',
]);
export type VetVisitType = z.infer<typeof VetVisitTypeSchema>;

export const MedicationFrequencySchema = z.enum([
  'daily',
  'twice_daily',
  'weekly',
  'monthly',
  'every_n_days',
  'as_needed',
]);
export type MedicationFrequency = z.infer<typeof MedicationFrequencySchema>;

export const MedicationLogStatusSchema = z.enum(['given', 'skipped']);
export type MedicationLogStatus = z.infer<typeof MedicationLogStatusSchema>;

export const ExpenseCategorySchema = z.enum([
  'vet',
  'food',
  'grooming',
  'medication',
  'supplies',
  'boarding',
  'training',
  'other',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

export const ReminderStatusSchema = z.enum(['current', 'due_soon', 'overdue']);
export type ReminderStatus = z.infer<typeof ReminderStatusSchema>;

export const WeightTrendDirectionSchema = z.enum(['stable', 'gaining', 'losing']);
export type WeightTrendDirection = z.infer<typeof WeightTrendDirectionSchema>;

export const PetSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: PetSpeciesSchema,
  breed: z.string().nullable(),
  birthDate: z.string().nullable(),
  adoptionDate: z.string().nullable(),
  sex: PetSexSchema,
  isSterilized: z.boolean(),
  microchipId: z.string().nullable(),
  currentWeightGrams: z.number().int().nullable(),
  imageUri: z.string().nullable(),
  notes: z.string().nullable(),
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Pet = z.infer<typeof PetSchema>;

export const VetVisitSchema = z.object({
  id: z.string(),
  petId: z.string(),
  visitDate: z.string(),
  visitType: VetVisitTypeSchema,
  reason: z.string(),
  clinicName: z.string().nullable(),
  veterinarian: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment: z.string().nullable(),
  weightGrams: z.number().int().nullable(),
  costCents: z.number().int().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type VetVisit = z.infer<typeof VetVisitSchema>;

export const VaccinationSchema = z.object({
  id: z.string(),
  petId: z.string(),
  name: z.string(),
  dateGiven: z.string(),
  nextDueDate: z.string().nullable(),
  veterinarian: z.string().nullable(),
  lotNumber: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type Vaccination = z.infer<typeof VaccinationSchema>;

export const MedicationSchema = z.object({
  id: z.string(),
  petId: z.string(),
  name: z.string(),
  dosage: z.string().nullable(),
  frequency: MedicationFrequencySchema,
  intervalDays: z.number().int().nullable(),
  startsOn: z.string(),
  endsOn: z.string().nullable(),
  nextDueAt: z.string().nullable(),
  lastGivenAt: z.string().nullable(),
  prescribedBy: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Medication = z.infer<typeof MedicationSchema>;

export const MedicationLogSchema = z.object({
  id: z.string(),
  medicationId: z.string(),
  status: MedicationLogStatusSchema,
  loggedAt: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type MedicationLog = z.infer<typeof MedicationLogSchema>;

export const WeightEntrySchema = z.object({
  id: z.string(),
  petId: z.string(),
  weightGrams: z.number().int(),
  bodyConditionScore: z.number().int().min(1).max(9).nullable(),
  loggedAt: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type WeightEntry = z.infer<typeof WeightEntrySchema>;

export const FeedingScheduleSchema = z.object({
  id: z.string(),
  petId: z.string(),
  label: z.string(),
  foodName: z.string().nullable(),
  amount: z.string().nullable(),
  feedAt: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FeedingSchedule = z.infer<typeof FeedingScheduleSchema>;

export const PetExpenseSchema = z.object({
  id: z.string(),
  petId: z.string(),
  category: ExpenseCategorySchema,
  label: z.string(),
  amountCents: z.number().int(),
  spentOn: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type PetExpense = z.infer<typeof PetExpenseSchema>;

export const CreatePetInputSchema = z.object({
  name: z.string().min(1).max(80),
  species: PetSpeciesSchema,
  breed: z.string().nullable().default(null),
  birthDate: z.string().nullable().default(null),
  adoptionDate: z.string().nullable().default(null),
  sex: PetSexSchema.default('unknown'),
  isSterilized: z.boolean().default(false),
  microchipId: z.string().nullable().default(null),
  currentWeightGrams: z.number().int().positive().nullable().default(null),
  imageUri: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  isArchived: z.boolean().default(false),
});
export type CreatePetInput = z.input<typeof CreatePetInputSchema>;

export const UpdatePetInputSchema = CreatePetInputSchema.partial();
export type UpdatePetInput = z.input<typeof UpdatePetInputSchema>;

export const CreateVetVisitInputSchema = z.object({
  petId: z.string(),
  visitDate: z.string(),
  visitType: VetVisitTypeSchema.default('other'),
  reason: z.string().min(1).max(160),
  clinicName: z.string().nullable().default(null),
  veterinarian: z.string().nullable().default(null),
  diagnosis: z.string().nullable().default(null),
  treatment: z.string().nullable().default(null),
  weightGrams: z.number().int().positive().nullable().default(null),
  costCents: z.number().int().nonnegative().nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type CreateVetVisitInput = z.input<typeof CreateVetVisitInputSchema>;

export const CreateVaccinationInputSchema = z.object({
  petId: z.string(),
  name: z.string().min(1).max(120),
  dateGiven: z.string(),
  nextDueDate: z.string().nullable().default(null),
  veterinarian: z.string().nullable().default(null),
  lotNumber: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type CreateVaccinationInput = z.input<typeof CreateVaccinationInputSchema>;

export const CreateMedicationInputSchema = z.object({
  petId: z.string(),
  name: z.string().min(1).max(120),
  dosage: z.string().nullable().default(null),
  frequency: MedicationFrequencySchema,
  intervalDays: z.number().int().positive().nullable().default(null),
  startsOn: z.string(),
  endsOn: z.string().nullable().default(null),
  nextDueAt: z.string().nullable().default(null),
  lastGivenAt: z.string().nullable().default(null),
  prescribedBy: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
});
export type CreateMedicationInput = z.input<typeof CreateMedicationInputSchema>;

export const RecordMedicationLogInputSchema = z.object({
  medicationId: z.string(),
  status: MedicationLogStatusSchema.default('given'),
  loggedAt: z.string().optional(),
  notes: z.string().nullable().default(null),
});
export type RecordMedicationLogInput = z.input<typeof RecordMedicationLogInputSchema>;

export const CreateWeightEntryInputSchema = z.object({
  petId: z.string(),
  weightGrams: z.number().int().positive(),
  bodyConditionScore: z.number().int().min(1).max(9).nullable().default(null),
  loggedAt: z.string().optional(),
  notes: z.string().nullable().default(null),
});
export type CreateWeightEntryInput = z.input<typeof CreateWeightEntryInputSchema>;

export const CreateFeedingScheduleInputSchema = z.object({
  petId: z.string(),
  label: z.string().min(1).max(80),
  foodName: z.string().nullable().default(null),
  amount: z.string().nullable().default(null),
  feedAt: z.string(),
  notes: z.string().nullable().default(null),
});
export type CreateFeedingScheduleInput = z.input<typeof CreateFeedingScheduleInputSchema>;

export const CreatePetExpenseInputSchema = z.object({
  petId: z.string(),
  category: ExpenseCategorySchema,
  label: z.string().min(1).max(120),
  amountCents: z.number().int().nonnegative(),
  spentOn: z.string(),
  notes: z.string().nullable().default(null),
});
export type CreatePetExpenseInput = z.input<typeof CreatePetExpenseInputSchema>;

export const PetListFilterSchema = z.object({
  includeArchived: z.boolean().default(false),
});
export type PetListFilter = z.input<typeof PetListFilterSchema>;

export const VaccinationReminderSchema = z.object({
  petId: z.string(),
  petName: z.string(),
  vaccinationId: z.string(),
  vaccineName: z.string(),
  nextDueDate: z.string(),
  status: ReminderStatusSchema,
  daysUntilDue: z.number().int(),
});
export type VaccinationReminder = z.infer<typeof VaccinationReminderSchema>;

export const WeightTrendSchema = z.object({
  direction: WeightTrendDirectionSchema,
  deltaGrams: z.number().int(),
  deltaPercent: z.number(),
  latestWeightGrams: z.number().int().nullable(),
  previousWeightGrams: z.number().int().nullable(),
});
export type WeightTrend = z.infer<typeof WeightTrendSchema>;

export const PetDashboardSchema = z.object({
  petId: z.string(),
  petName: z.string(),
  dueVaccinations: z.number().int(),
  dueMedications: z.number().int(),
  nextFeedingAt: z.string().nullable(),
  totalExpensesCents: z.number().int(),
  lastVetVisitDate: z.string().nullable(),
  latestWeightGrams: z.number().int().nullable(),
});
export type PetDashboard = z.infer<typeof PetDashboardSchema>;

export const CORE_VACCINE_SCHEDULES: Partial<
  Record<PetSpecies, Array<{ name: string; intervalDays: number; kind: 'core' | 'non_core' }>>
> = {
  dog: [
    { name: 'Rabies', intervalDays: 365, kind: 'core' },
    { name: 'DHPP', intervalDays: 365, kind: 'core' },
    { name: 'Bordetella', intervalDays: 365, kind: 'non_core' },
  ],
  cat: [
    { name: 'Rabies', intervalDays: 365, kind: 'core' },
    { name: 'FVRCP', intervalDays: 365, kind: 'core' },
    { name: 'FeLV', intervalDays: 365, kind: 'non_core' },
  ],
};
