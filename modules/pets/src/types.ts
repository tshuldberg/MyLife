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

export const ExerciseActivityTypeSchema = z.enum([
  'walk',
  'run',
  'hike',
  'swim',
  'fetch',
  'play',
  'training',
  'other',
]);
export type ExerciseActivityType = z.infer<typeof ExerciseActivityTypeSchema>;

export const GroomingTypeSchema = z.enum([
  'bath',
  'nail_trim',
  'haircut',
  'ear_cleaning',
  'teeth_brushing',
  'flea_treatment',
  'deshedding',
  'other',
]);
export type GroomingType = z.infer<typeof GroomingTypeSchema>;

export const TrainingLocationSchema = z.enum(['home', 'park', 'class', 'other']);
export type TrainingLocation = z.infer<typeof TrainingLocationSchema>;

export const PetTimelineKindSchema = z.enum([
  'vet_visit',
  'vaccination',
  'medication',
  'weight',
  'exercise',
  'grooming',
  'training',
  'photo',
]);
export type PetTimelineKind = z.infer<typeof PetTimelineKindSchema>;

export const BreedAlertSeveritySchema = z.enum(['informational', 'moderate', 'serious']);
export type BreedAlertSeverity = z.infer<typeof BreedAlertSeveritySchema>;

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

export const EmergencyContactSchema = z.object({
  id: z.string(),
  petId: z.string().nullable(),
  label: z.string(),
  clinicName: z.string(),
  phone: z.string(),
  address: z.string().nullable(),
  hours: z.string().nullable(),
  notes: z.string().nullable(),
  isPrimary: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

export const ExerciseLogSchema = z.object({
  id: z.string(),
  petId: z.string(),
  activityType: ExerciseActivityTypeSchema,
  durationMinutes: z.number().int(),
  distanceKm: z.number().nullable(),
  loggedAt: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type ExerciseLog = z.infer<typeof ExerciseLogSchema>;

export const GroomingRecordSchema = z.object({
  id: z.string(),
  petId: z.string(),
  groomingType: GroomingTypeSchema,
  groomedAt: z.string(),
  nextDueDate: z.string().nullable(),
  provider: z.string().nullable(),
  costCents: z.number().int().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type GroomingRecord = z.infer<typeof GroomingRecordSchema>;

export const TrainingLogSchema = z.object({
  id: z.string(),
  petId: z.string(),
  commandName: z.string(),
  location: TrainingLocationSchema,
  durationMinutes: z.number().int().nullable(),
  successRating: z.number().int().min(1).max(5).nullable(),
  loggedAt: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type TrainingLog = z.infer<typeof TrainingLogSchema>;

export const PetPhotoSchema = z.object({
  id: z.string(),
  petId: z.string(),
  imageUri: z.string(),
  caption: z.string().nullable(),
  milestoneTag: z.string().nullable(),
  takenAt: z.string().nullable(),
  createdAt: z.string(),
});
export type PetPhoto = z.infer<typeof PetPhotoSchema>;

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

export const CreateEmergencyContactInputSchema = z.object({
  petId: z.string().nullable().default(null),
  label: z.string().min(1).max(80),
  clinicName: z.string().min(1).max(120),
  phone: z.string().min(1).max(40),
  address: z.string().nullable().default(null),
  hours: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  isPrimary: z.boolean().default(false),
});
export type CreateEmergencyContactInput = z.input<typeof CreateEmergencyContactInputSchema>;

export const CreateExerciseLogInputSchema = z.object({
  petId: z.string(),
  activityType: ExerciseActivityTypeSchema.default('walk'),
  durationMinutes: z.number().int().positive(),
  distanceKm: z.number().nonnegative().nullable().default(null),
  loggedAt: z.string().optional(),
  notes: z.string().nullable().default(null),
});
export type CreateExerciseLogInput = z.input<typeof CreateExerciseLogInputSchema>;

export const CreateGroomingRecordInputSchema = z.object({
  petId: z.string(),
  groomingType: GroomingTypeSchema.default('bath'),
  groomedAt: z.string().optional(),
  nextDueDate: z.string().nullable().default(null),
  provider: z.string().nullable().default(null),
  costCents: z.number().int().nonnegative().nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type CreateGroomingRecordInput = z.input<typeof CreateGroomingRecordInputSchema>;

export const CreateTrainingLogInputSchema = z.object({
  petId: z.string(),
  commandName: z.string().min(1).max(120),
  location: TrainingLocationSchema.default('home'),
  durationMinutes: z.number().int().positive().nullable().default(null),
  successRating: z.number().int().min(1).max(5).nullable().default(null),
  loggedAt: z.string().optional(),
  notes: z.string().nullable().default(null),
});
export type CreateTrainingLogInput = z.input<typeof CreateTrainingLogInputSchema>;

export const CreatePetPhotoInputSchema = z.object({
  petId: z.string(),
  imageUri: z.string().min(1),
  caption: z.string().nullable().default(null),
  milestoneTag: z.string().nullable().default(null),
  takenAt: z.string().nullable().default(null),
});
export type CreatePetPhotoInput = z.input<typeof CreatePetPhotoInputSchema>;

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

export const GroomingReminderSchema = z.object({
  petId: z.string(),
  petName: z.string(),
  groomingRecordId: z.string(),
  groomingType: GroomingTypeSchema,
  nextDueDate: z.string(),
  status: ReminderStatusSchema,
  daysUntilDue: z.number().int(),
});
export type GroomingReminder = z.infer<typeof GroomingReminderSchema>;

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
  lastExerciseAt: z.string().nullable(),
  nextGroomingDueDate: z.string().nullable(),
  photoCount: z.number().int(),
});
export type PetDashboard = z.infer<typeof PetDashboardSchema>;

export const PetTimelineItemSchema = z.object({
  id: z.string(),
  petId: z.string(),
  occurredAt: z.string(),
  kind: PetTimelineKindSchema,
  title: z.string(),
  detail: z.string().nullable(),
});
export type PetTimelineItem = z.infer<typeof PetTimelineItemSchema>;

export const BreedHealthAlertSchema = z.object({
  id: z.string(),
  species: PetSpeciesSchema,
  breedKey: z.string(),
  condition: z.string(),
  description: z.string(),
  screeningAge: z.string().nullable(),
  screeningFrequency: z.string().nullable(),
  severity: BreedAlertSeveritySchema,
});
export type BreedHealthAlert = z.infer<typeof BreedHealthAlertSchema>;

export interface PetSitterCard {
  pet: Pet;
  activeMedications: Medication[];
  feedingSchedules: FeedingSchedule[];
  emergencyContacts: EmergencyContact[];
  breedAlerts: BreedHealthAlert[];
}

export interface PetExportBundle {
  pets: Pet[];
  vetVisits: VetVisit[];
  vaccinations: Vaccination[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  weightEntries: WeightEntry[];
  feedingSchedules: FeedingSchedule[];
  expenses: PetExpense[];
  emergencyContacts: EmergencyContact[];
  exerciseLogs: ExerciseLog[];
  groomingRecords: GroomingRecord[];
  trainingLogs: TrainingLog[];
  photos: PetPhoto[];
  timeline: PetTimelineItem[];
}

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
