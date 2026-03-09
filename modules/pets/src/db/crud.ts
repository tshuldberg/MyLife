import type { DatabaseAdapter } from '@mylife/db';
import {
  CreateEmergencyContactInputSchema,
  CreateExerciseLogInputSchema,
  CreateFeedingScheduleInputSchema,
  CreateGroomingRecordInputSchema,
  CreateMedicationInputSchema,
  CreatePetExpenseInputSchema,
  CreatePetInputSchema,
  CreatePetPhotoInputSchema,
  CreateTrainingLogInputSchema,
  CreateVaccinationInputSchema,
  CreateVetVisitInputSchema,
  CreateWeightEntryInputSchema,
  PetListFilterSchema,
  PetTimelineItemSchema,
  RecordMedicationLogInputSchema,
  UpdatePetInputSchema,
  type CreateEmergencyContactInput,
  type CreateExerciseLogInput,
  type CreateFeedingScheduleInput,
  type CreateGroomingRecordInput,
  type CreateMedicationInput,
  type CreatePetExpenseInput,
  type CreatePetInput,
  type CreatePetPhotoInput,
  type CreateTrainingLogInput,
  type CreateVaccinationInput,
  type CreateVetVisitInput,
  type CreateWeightEntryInput,
  type EmergencyContact,
  type ExerciseLog,
  type FeedingSchedule,
  type GroomingRecord,
  type Medication,
  type MedicationLog,
  type Pet,
  type PetDashboard,
  type PetExportBundle,
  type PetExpense,
  type PetListFilter,
  type PetPhoto,
  type PetSitterCard,
  type PetTimelineItem,
  type GroomingReminder,
  type TrainingLog,
  type Vaccination,
  type VaccinationReminder,
  type VetVisit,
  type WeightEntry,
} from '../types';
import {
  collectVaccinationReminders,
  computeNextMedicationDueAt,
  getReminderStatus,
} from '../engine/reminders';
import { getBreedHealthAlerts } from '../engine/alerts';

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (typeof c?.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function rowToPet(row: Record<string, unknown>): Pet {
  return {
    id: row.id as string,
    name: row.name as string,
    species: row.species as Pet['species'],
    breed: (row.breed as string) ?? null,
    birthDate: (row.birth_date as string) ?? null,
    adoptionDate: (row.adoption_date as string) ?? null,
    sex: row.sex as Pet['sex'],
    isSterilized: Number(row.is_sterilized ?? 0) === 1,
    microchipId: (row.microchip_id as string) ?? null,
    currentWeightGrams: (row.current_weight_grams as number) ?? null,
    imageUri: (row.image_uri as string) ?? null,
    notes: (row.notes as string) ?? null,
    isArchived: Number(row.is_archived ?? 0) === 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToVetVisit(row: Record<string, unknown>): VetVisit {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    visitDate: row.visit_date as string,
    visitType: row.visit_type as VetVisit['visitType'],
    reason: row.reason as string,
    clinicName: (row.clinic_name as string) ?? null,
    veterinarian: (row.veterinarian as string) ?? null,
    diagnosis: (row.diagnosis as string) ?? null,
    treatment: (row.treatment as string) ?? null,
    weightGrams: (row.weight_grams as number) ?? null,
    costCents: (row.cost_cents as number) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToVaccination(row: Record<string, unknown>): Vaccination {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    name: row.name as string,
    dateGiven: row.date_given as string,
    nextDueDate: (row.next_due_date as string) ?? null,
    veterinarian: (row.veterinarian as string) ?? null,
    lotNumber: (row.lot_number as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToMedication(row: Record<string, unknown>): Medication {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    name: row.name as string,
    dosage: (row.dosage as string) ?? null,
    frequency: row.frequency as Medication['frequency'],
    intervalDays: (row.interval_days as number) ?? null,
    startsOn: row.starts_on as string,
    endsOn: (row.ends_on as string) ?? null,
    nextDueAt: (row.next_due_at as string) ?? null,
    lastGivenAt: (row.last_given_at as string) ?? null,
    prescribedBy: (row.prescribed_by as string) ?? null,
    notes: (row.notes as string) ?? null,
    isActive: Number(row.is_active ?? 0) === 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMedicationLog(row: Record<string, unknown>): MedicationLog {
  return {
    id: row.id as string,
    medicationId: row.medication_id as string,
    status: row.status as MedicationLog['status'],
    loggedAt: row.logged_at as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToWeightEntry(row: Record<string, unknown>): WeightEntry {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    weightGrams: row.weight_grams as number,
    bodyConditionScore: (row.body_condition_score as number) ?? null,
    loggedAt: row.logged_at as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToFeedingSchedule(row: Record<string, unknown>): FeedingSchedule {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    label: row.label as string,
    foodName: (row.food_name as string) ?? null,
    amount: (row.amount as string) ?? null,
    feedAt: row.feed_at as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPetExpense(row: Record<string, unknown>): PetExpense {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    category: row.category as PetExpense['category'],
    label: row.label as string,
    amountCents: row.amount_cents as number,
    spentOn: row.spent_on as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToEmergencyContact(row: Record<string, unknown>): EmergencyContact {
  return {
    id: row.id as string,
    petId: (row.pet_id as string) ?? null,
    label: row.label as string,
    clinicName: row.clinic_name as string,
    phone: row.phone as string,
    address: (row.address as string) ?? null,
    hours: (row.hours as string) ?? null,
    notes: (row.notes as string) ?? null,
    isPrimary: Number(row.is_primary ?? 0) === 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToExerciseLog(row: Record<string, unknown>): ExerciseLog {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    activityType: row.activity_type as ExerciseLog['activityType'],
    durationMinutes: row.duration_minutes as number,
    distanceKm: typeof row.distance_km === 'number' ? row.distance_km : row.distance_km === null ? null : Number(row.distance_km),
    loggedAt: row.logged_at as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToGroomingRecord(row: Record<string, unknown>): GroomingRecord {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    groomingType: row.grooming_type as GroomingRecord['groomingType'],
    groomedAt: row.groomed_at as string,
    nextDueDate: (row.next_due_date as string) ?? null,
    provider: (row.provider as string) ?? null,
    costCents: (row.cost_cents as number) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToTrainingLog(row: Record<string, unknown>): TrainingLog {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    commandName: row.command_name as string,
    location: row.location as TrainingLog['location'],
    durationMinutes: (row.duration_minutes as number) ?? null,
    successRating: (row.success_rating as number) ?? null,
    loggedAt: row.logged_at as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToPetPhoto(row: Record<string, unknown>): PetPhoto {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    imageUri: row.image_uri as string,
    caption: (row.caption as string) ?? null,
    milestoneTag: (row.milestone_tag as string) ?? null,
    takenAt: (row.taken_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function createTimelineDate(value: string): string {
  return value.length === 10 ? `${value}T12:00:00.000Z` : value;
}

export function createPet(db: DatabaseAdapter, id: string, rawInput: CreatePetInput): Pet {
  const input = CreatePetInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO pt_pets (
      id, name, species, breed, birth_date, adoption_date, sex, is_sterilized, microchip_id,
      current_weight_grams, image_uri, notes, is_archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.species,
      input.breed,
      input.birthDate,
      input.adoptionDate,
      input.sex,
      input.isSterilized ? 1 : 0,
      input.microchipId,
      input.currentWeightGrams,
      input.imageUri,
      input.notes,
      input.isArchived ? 1 : 0,
      now,
      now,
    ],
  );

  return getPetById(db, id)!;
}

export function getPetById(db: DatabaseAdapter, id: string): Pet | null {
  const rows = db.query<Record<string, unknown>>(`SELECT * FROM pt_pets WHERE id = ?`, [id]);
  return rows[0] ? rowToPet(rows[0]) : null;
}

export function listPets(db: DatabaseAdapter, rawFilter?: PetListFilter): Pet[] {
  const filter = PetListFilterSchema.parse(rawFilter ?? {});
  const rows = filter.includeArchived
    ? db.query<Record<string, unknown>>(`SELECT * FROM pt_pets ORDER BY is_archived ASC, name ASC`)
    : db.query<Record<string, unknown>>(
      `SELECT * FROM pt_pets WHERE is_archived = 0 ORDER BY name ASC`,
    );

  return rows.map(rowToPet);
}

export function updatePet(db: DatabaseAdapter, id: string, rawInput: Partial<CreatePetInput>): Pet | null {
  const updates = UpdatePetInputSchema.parse(rawInput);
  const fields: string[] = [];
  const params: unknown[] = [];

  const mappings: Array<[keyof typeof updates, string, unknown]> = [
    ['name', 'name', updates.name],
    ['species', 'species', updates.species],
    ['breed', 'breed', updates.breed],
    ['birthDate', 'birth_date', updates.birthDate],
    ['adoptionDate', 'adoption_date', updates.adoptionDate],
    ['sex', 'sex', updates.sex],
    ['isSterilized', 'is_sterilized', updates.isSterilized === undefined ? undefined : updates.isSterilized ? 1 : 0],
    ['microchipId', 'microchip_id', updates.microchipId],
    ['currentWeightGrams', 'current_weight_grams', updates.currentWeightGrams],
    ['imageUri', 'image_uri', updates.imageUri],
    ['notes', 'notes', updates.notes],
    ['isArchived', 'is_archived', updates.isArchived === undefined ? undefined : updates.isArchived ? 1 : 0],
  ];

  for (const [key, column, value] of mappings) {
    if (updates[key] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(value);
    }
  }

  if (fields.length === 0) {
    return getPetById(db, id);
  }

  params.push(nowIso(), id);
  db.execute(`UPDATE pt_pets SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`, params);
  return getPetById(db, id);
}

export function deletePet(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM pt_pets WHERE id = ?`, [id]);
}

export function createVetVisit(db: DatabaseAdapter, id: string, rawInput: CreateVetVisitInput): VetVisit {
  const input = CreateVetVisitInputSchema.parse(rawInput);
  const now = nowIso();

  db.transaction(() => {
    db.execute(
      `INSERT INTO pt_vet_visits (
        id, pet_id, visit_date, visit_type, reason, clinic_name, veterinarian, diagnosis, treatment,
        weight_grams, cost_cents, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.petId,
        input.visitDate,
        input.visitType,
        input.reason,
        input.clinicName,
        input.veterinarian,
        input.diagnosis,
        input.treatment,
        input.weightGrams,
        input.costCents,
        input.notes,
        now,
      ],
    );

    if (input.costCents !== null) {
      db.execute(
        `INSERT INTO pt_expenses (id, pet_id, category, label, amount_cents, spent_on, notes, created_at)
         VALUES (?, ?, 'vet', ?, ?, ?, ?, ?)`,
        [
          createId('pt_expense'),
          input.petId,
          `Vet visit: ${input.reason}`,
          input.costCents,
          input.visitDate,
          input.notes,
          now,
        ],
      );
    }
  });

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_vet_visits WHERE id = ?`, [id])
    .map(rowToVetVisit)[0];
}

export function listVetVisitsForPet(db: DatabaseAdapter, petId: string): VetVisit[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_vet_visits WHERE pet_id = ? ORDER BY visit_date DESC, created_at DESC`,
      [petId],
    )
    .map(rowToVetVisit);
}

export function createVaccination(db: DatabaseAdapter, id: string, rawInput: CreateVaccinationInput): Vaccination {
  const input = CreateVaccinationInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO pt_vaccinations (
      id, pet_id, name, date_given, next_due_date, veterinarian, lot_number, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.petId,
      input.name,
      input.dateGiven,
      input.nextDueDate,
      input.veterinarian,
      input.lotNumber,
      input.notes,
      now,
    ],
  );

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_vaccinations WHERE id = ?`, [id])
    .map(rowToVaccination)[0];
}

export function listVaccinationsForPet(db: DatabaseAdapter, petId: string): Vaccination[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_vaccinations WHERE pet_id = ? ORDER BY COALESCE(next_due_date, date_given) ASC`,
      [petId],
    )
    .map(rowToVaccination);
}

export function listDueVaccinationReminders(
  db: DatabaseAdapter,
  referenceDate = new Date().toISOString().slice(0, 10),
  warningWindowDays = 30,
): VaccinationReminder[] {
  const pets = listPets(db, { includeArchived: true }).map((pet) => ({ id: pet.id, name: pet.name }));
  const vaccinations = db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_vaccinations
       WHERE next_due_date IS NOT NULL
         AND date(next_due_date) <= date(?, '+' || ? || ' days')`,
      [referenceDate, warningWindowDays],
    )
    .map(rowToVaccination);

  return collectVaccinationReminders(pets, vaccinations, referenceDate, warningWindowDays);
}

export function createMedication(db: DatabaseAdapter, id: string, rawInput: CreateMedicationInput): Medication {
  const input = CreateMedicationInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO pt_medications (
      id, pet_id, name, dosage, frequency, interval_days, starts_on, ends_on, next_due_at,
      last_given_at, prescribed_by, notes, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.petId,
      input.name,
      input.dosage,
      input.frequency,
      input.intervalDays,
      input.startsOn,
      input.endsOn,
      input.nextDueAt,
      input.lastGivenAt,
      input.prescribedBy,
      input.notes,
      input.isActive ? 1 : 0,
      now,
      now,
    ],
  );

  return getMedicationById(db, id)!;
}

export function getMedicationById(db: DatabaseAdapter, id: string): Medication | null {
  const rows = db.query<Record<string, unknown>>(`SELECT * FROM pt_medications WHERE id = ?`, [id]);
  return rows[0] ? rowToMedication(rows[0]) : null;
}

export function listMedicationsForPet(
  db: DatabaseAdapter,
  petId: string,
  includeInactive = false,
): Medication[] {
  const sql = includeInactive
    ? `SELECT * FROM pt_medications WHERE pet_id = ? ORDER BY is_active DESC, name ASC`
    : `SELECT * FROM pt_medications WHERE pet_id = ? AND is_active = 1 ORDER BY next_due_at ASC, name ASC`;

  return db.query<Record<string, unknown>>(sql, [petId]).map(rowToMedication);
}

export function listDueMedications(
  db: DatabaseAdapter,
  referenceIso = new Date().toISOString(),
  warningWindowHours = 24,
): Medication[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_medications
       WHERE is_active = 1
         AND next_due_at IS NOT NULL
         AND datetime(next_due_at) <= datetime(?, '+' || ? || ' hours')
       ORDER BY next_due_at ASC`,
      [referenceIso, warningWindowHours],
    )
    .map(rowToMedication);
}

export function recordMedicationLog(
  db: DatabaseAdapter,
  rawInput: { medicationId: string; status?: MedicationLog['status']; loggedAt?: string; notes?: string | null },
): MedicationLog {
  const input = RecordMedicationLogInputSchema.parse(rawInput);
  const now = input.loggedAt ?? nowIso();
  const id = createId('pt_medlog');
  const medication = getMedicationById(db, input.medicationId);

  if (!medication) {
    throw new Error(`Medication not found: ${input.medicationId}`);
  }

  db.transaction(() => {
    db.execute(
      `INSERT INTO pt_medication_logs (id, medication_id, status, logged_at, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.medicationId, input.status, now, input.notes, now],
    );

    const nextDueAt = input.status === 'given'
      ? computeNextMedicationDueAt(medication.frequency, now, medication.intervalDays)
      : medication.nextDueAt;

    db.execute(
      `UPDATE pt_medications
       SET last_given_at = ?, next_due_at = ?, updated_at = ?
       WHERE id = ?`,
      [input.status === 'given' ? now : medication.lastGivenAt, nextDueAt, nowIso(), medication.id],
    );
  });

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_medication_logs WHERE id = ?`, [id])
    .map(rowToMedicationLog)[0];
}

export function listMedicationLogs(db: DatabaseAdapter, medicationId: string): MedicationLog[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_medication_logs WHERE medication_id = ? ORDER BY logged_at DESC`,
      [medicationId],
    )
    .map(rowToMedicationLog);
}

export function createWeightEntry(db: DatabaseAdapter, id: string, rawInput: CreateWeightEntryInput): WeightEntry {
  const input = CreateWeightEntryInputSchema.parse(rawInput);
  const loggedAt = input.loggedAt ?? nowIso();
  const createdAt = nowIso();

  db.transaction(() => {
    db.execute(
      `INSERT INTO pt_weight_entries (
        id, pet_id, weight_grams, body_condition_score, logged_at, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, input.petId, input.weightGrams, input.bodyConditionScore, loggedAt, input.notes, createdAt],
    );

    db.execute(
      `UPDATE pt_pets SET current_weight_grams = ?, updated_at = ? WHERE id = ?`,
      [input.weightGrams, createdAt, input.petId],
    );
  });

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_weight_entries WHERE id = ?`, [id])
    .map(rowToWeightEntry)[0];
}

export function listWeightEntriesForPet(db: DatabaseAdapter, petId: string): WeightEntry[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_weight_entries WHERE pet_id = ? ORDER BY logged_at DESC`,
      [petId],
    )
    .map(rowToWeightEntry);
}

export function createFeedingSchedule(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateFeedingScheduleInput,
): FeedingSchedule {
  const input = CreateFeedingScheduleInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO pt_feeding_schedules (
      id, pet_id, label, food_name, amount, feed_at, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.petId, input.label, input.foodName, input.amount, input.feedAt, input.notes, now, now],
  );

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_feeding_schedules WHERE id = ?`, [id])
    .map(rowToFeedingSchedule)[0];
}

export function listFeedingSchedulesForPet(db: DatabaseAdapter, petId: string): FeedingSchedule[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_feeding_schedules WHERE pet_id = ? ORDER BY feed_at ASC`,
      [petId],
    )
    .map(rowToFeedingSchedule);
}

export function createPetExpense(db: DatabaseAdapter, id: string, rawInput: CreatePetExpenseInput): PetExpense {
  const input = CreatePetExpenseInputSchema.parse(rawInput);
  const now = nowIso();

  db.execute(
    `INSERT INTO pt_expenses (id, pet_id, category, label, amount_cents, spent_on, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.petId, input.category, input.label, input.amountCents, input.spentOn, input.notes, now],
  );

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_expenses WHERE id = ?`, [id])
    .map(rowToPetExpense)[0];
}

export function listExpensesForPet(db: DatabaseAdapter, petId: string): PetExpense[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_expenses WHERE pet_id = ? ORDER BY spent_on DESC, created_at DESC`,
      [petId],
    )
    .map(rowToPetExpense);
}

export function createEmergencyContact(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateEmergencyContactInput,
): EmergencyContact {
  const input = CreateEmergencyContactInputSchema.parse(rawInput);
  const now = nowIso();

  if (input.isPrimary) {
    db.execute(
      `UPDATE pt_emergency_contacts SET is_primary = 0, updated_at = ? WHERE COALESCE(pet_id, '') = COALESCE(?, '')`,
      [now, input.petId],
    );
  }

  db.execute(
    `INSERT INTO pt_emergency_contacts (
      id, pet_id, label, clinic_name, phone, address, hours, notes, is_primary, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.petId,
      input.label,
      input.clinicName,
      input.phone,
      input.address,
      input.hours,
      input.notes,
      input.isPrimary ? 1 : 0,
      now,
      now,
    ],
  );

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_emergency_contacts WHERE id = ?`, [id])
    .map(rowToEmergencyContact)[0];
}

export function listEmergencyContacts(
  db: DatabaseAdapter,
  petId?: string | null,
): EmergencyContact[] {
  const rows = petId === undefined
    ? db.query<Record<string, unknown>>(
      `SELECT * FROM pt_emergency_contacts
       ORDER BY is_primary DESC, clinic_name ASC`,
    )
    : db.query<Record<string, unknown>>(
      `SELECT * FROM pt_emergency_contacts
       WHERE pet_id = ? OR pet_id IS NULL
       ORDER BY CASE WHEN pet_id = ? THEN 0 ELSE 1 END ASC, is_primary DESC, clinic_name ASC`,
      [petId, petId],
    );

  return rows.map(rowToEmergencyContact);
}

export function createExerciseLog(db: DatabaseAdapter, id: string, rawInput: CreateExerciseLogInput): ExerciseLog {
  const input = CreateExerciseLogInputSchema.parse(rawInput);
  const loggedAt = input.loggedAt ?? nowIso();
  const createdAt = nowIso();

  db.execute(
    `INSERT INTO pt_exercise_logs (
      id, pet_id, activity_type, duration_minutes, distance_km, logged_at, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.petId,
      input.activityType,
      input.durationMinutes,
      input.distanceKm,
      loggedAt,
      input.notes,
      createdAt,
    ],
  );

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_exercise_logs WHERE id = ?`, [id])
    .map(rowToExerciseLog)[0];
}

export function listExerciseLogsForPet(db: DatabaseAdapter, petId: string): ExerciseLog[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_exercise_logs WHERE pet_id = ? ORDER BY logged_at DESC`,
      [petId],
    )
    .map(rowToExerciseLog);
}

export function createGroomingRecord(
  db: DatabaseAdapter,
  id: string,
  rawInput: CreateGroomingRecordInput,
): GroomingRecord {
  const input = CreateGroomingRecordInputSchema.parse(rawInput);
  const groomedAt = input.groomedAt ?? new Date().toISOString().slice(0, 10);
  const createdAt = nowIso();

  db.transaction(() => {
    db.execute(
      `INSERT INTO pt_grooming_records (
        id, pet_id, grooming_type, groomed_at, next_due_date, provider, cost_cents, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.petId,
        input.groomingType,
        groomedAt,
        input.nextDueDate,
        input.provider,
        input.costCents,
        input.notes,
        createdAt,
      ],
    );

    if (input.costCents !== null) {
      db.execute(
        `INSERT INTO pt_expenses (id, pet_id, category, label, amount_cents, spent_on, notes, created_at)
         VALUES (?, ?, 'grooming', ?, ?, ?, ?, ?)`,
        [
          createId('pt_expense'),
          input.petId,
          `Grooming: ${input.groomingType.replaceAll('_', ' ')}`,
          input.costCents,
          groomedAt.slice(0, 10),
          input.notes,
          createdAt,
        ],
      );
    }
  });

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_grooming_records WHERE id = ?`, [id])
    .map(rowToGroomingRecord)[0];
}

export function listGroomingRecordsForPet(db: DatabaseAdapter, petId: string): GroomingRecord[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_grooming_records WHERE pet_id = ? ORDER BY groomed_at DESC`,
      [petId],
    )
    .map(rowToGroomingRecord);
}

export function listDueGroomingReminders(
  db: DatabaseAdapter,
  referenceDate = new Date().toISOString().slice(0, 10),
  warningWindowDays = 14,
): GroomingReminder[] {
  const pets = new Map(listPets(db, { includeArchived: true }).map((pet) => [pet.id, pet.name]));

  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_grooming_records
       WHERE next_due_date IS NOT NULL
         AND date(next_due_date) <= date(?, '+' || ? || ' days')
       ORDER BY next_due_date ASC`,
      [referenceDate, warningWindowDays],
    )
    .map(rowToGroomingRecord)
    .map((record) => {
      const reminder = getReminderStatus(record.nextDueDate!, referenceDate, warningWindowDays);
      return {
        petId: record.petId,
        petName: pets.get(record.petId) ?? 'Unknown Pet',
        groomingRecordId: record.id,
        groomingType: record.groomingType,
        nextDueDate: record.nextDueDate!,
        status: reminder.status,
        daysUntilDue: reminder.daysUntilDue,
      };
    });
}

export function createTrainingLog(db: DatabaseAdapter, id: string, rawInput: CreateTrainingLogInput): TrainingLog {
  const input = CreateTrainingLogInputSchema.parse(rawInput);
  const loggedAt = input.loggedAt ?? nowIso();
  const createdAt = nowIso();

  db.execute(
    `INSERT INTO pt_training_logs (
      id, pet_id, command_name, location, duration_minutes, success_rating, logged_at, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.petId,
      input.commandName,
      input.location,
      input.durationMinutes,
      input.successRating,
      loggedAt,
      input.notes,
      createdAt,
    ],
  );

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_training_logs WHERE id = ?`, [id])
    .map(rowToTrainingLog)[0];
}

export function listTrainingLogsForPet(db: DatabaseAdapter, petId: string): TrainingLog[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_training_logs WHERE pet_id = ? ORDER BY logged_at DESC`,
      [petId],
    )
    .map(rowToTrainingLog);
}

export function createPetPhoto(db: DatabaseAdapter, id: string, rawInput: CreatePetPhotoInput): PetPhoto {
  const input = CreatePetPhotoInputSchema.parse(rawInput);
  const createdAt = nowIso();

  db.transaction(() => {
    db.execute(
      `INSERT INTO pt_pet_photos (id, pet_id, image_uri, caption, milestone_tag, taken_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, input.petId, input.imageUri, input.caption, input.milestoneTag, input.takenAt, createdAt],
    );

    const pet = getPetById(db, input.petId);
    if (pet && !pet.imageUri) {
      db.execute(`UPDATE pt_pets SET image_uri = ?, updated_at = ? WHERE id = ?`, [input.imageUri, createdAt, input.petId]);
    }
  });

  return db
    .query<Record<string, unknown>>(`SELECT * FROM pt_pet_photos WHERE id = ?`, [id])
    .map(rowToPetPhoto)[0];
}

export function listPetPhotosForPet(db: DatabaseAdapter, petId: string): PetPhoto[] {
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM pt_pet_photos
       WHERE pet_id = ?
       ORDER BY COALESCE(taken_at, created_at) DESC`,
      [petId],
    )
    .map(rowToPetPhoto);
}

export function getPetHealthTimeline(
  db: DatabaseAdapter,
  petId: string,
  limit = 50,
): PetTimelineItem[] {
  const medicationLogs = db
    .query<Record<string, unknown>>(
      `SELECT ml.id, m.pet_id, ml.logged_at, ml.status, m.name
       FROM pt_medication_logs ml
       INNER JOIN pt_medications m ON m.id = ml.medication_id
       WHERE m.pet_id = ?
       ORDER BY ml.logged_at DESC`,
      [petId],
    )
    .map((row) => ({
      id: row.id as string,
      petId: row.pet_id as string,
      occurredAt: row.logged_at as string,
      kind: 'medication' as const,
      title: `Medication ${row.status === 'given' ? 'given' : 'skipped'} · ${row.name as string}`,
      detail: null,
    }));

  const items = [
    ...listVetVisitsForPet(db, petId).map((visit) => ({
      id: visit.id,
      petId: visit.petId,
      occurredAt: createTimelineDate(visit.visitDate),
      kind: 'vet_visit' as const,
      title: `Vet visit · ${visit.reason}`,
      detail: visit.diagnosis ?? visit.clinicName,
    })),
    ...listVaccinationsForPet(db, petId).map((vaccination) => ({
      id: vaccination.id,
      petId: vaccination.petId,
      occurredAt: createTimelineDate(vaccination.dateGiven),
      kind: 'vaccination' as const,
      title: `Vaccination · ${vaccination.name}`,
      detail: vaccination.nextDueDate ? `Next due ${vaccination.nextDueDate}` : null,
    })),
    ...medicationLogs,
    ...listWeightEntriesForPet(db, petId).map((entry) => ({
      id: entry.id,
      petId: entry.petId,
      occurredAt: entry.loggedAt,
      kind: 'weight' as const,
      title: `Weight logged · ${(entry.weightGrams / 1000).toFixed(1)} kg`,
      detail: entry.notes,
    })),
    ...listExerciseLogsForPet(db, petId).map((log) => ({
      id: log.id,
      petId: log.petId,
      occurredAt: log.loggedAt,
      kind: 'exercise' as const,
      title: `${log.activityType.replaceAll('_', ' ')} · ${log.durationMinutes} min`,
      detail: log.distanceKm !== null ? `${log.distanceKm.toFixed(1)} km` : log.notes,
    })),
    ...listGroomingRecordsForPet(db, petId).map((record) => ({
      id: record.id,
      petId: record.petId,
      occurredAt: createTimelineDate(record.groomedAt),
      kind: 'grooming' as const,
      title: `Grooming · ${record.groomingType.replaceAll('_', ' ')}`,
      detail: record.nextDueDate ? `Next due ${record.nextDueDate}` : record.provider,
    })),
    ...listTrainingLogsForPet(db, petId).map((log) => ({
      id: log.id,
      petId: log.petId,
      occurredAt: log.loggedAt,
      kind: 'training' as const,
      title: `Training · ${log.commandName}`,
      detail: log.successRating !== null ? `Success ${log.successRating}/5` : log.notes,
    })),
    ...listPetPhotosForPet(db, petId).map((photo) => ({
      id: photo.id,
      petId: photo.petId,
      occurredAt: photo.takenAt ?? photo.createdAt,
      kind: 'photo' as const,
      title: 'Photo added',
      detail: photo.caption ?? photo.milestoneTag,
    })),
  ]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit)
    .map((item) => PetTimelineItemSchema.parse(item));

  return items;
}

export function buildPetSitterCard(db: DatabaseAdapter, petId: string): PetSitterCard | null {
  const pet = getPetById(db, petId);
  if (!pet) {
    return null;
  }

  return {
    pet,
    activeMedications: listMedicationsForPet(db, petId, false),
    feedingSchedules: listFeedingSchedulesForPet(db, petId),
    emergencyContacts: listEmergencyContacts(db, petId),
    breedAlerts: getBreedHealthAlerts(pet.species, pet.breed),
  };
}

export function exportPetData(db: DatabaseAdapter, petId?: string): PetExportBundle {
  const pets = petId
    ? (() => {
      const pet = getPetById(db, petId);
      return pet ? [pet] : [];
    })()
    : listPets(db, { includeArchived: true });

  const petIds = new Set(pets.map((pet) => pet.id));
  const medicationIds = new Set<string>();

  const vetVisits = pets.flatMap((pet) => listVetVisitsForPet(db, pet.id));
  const vaccinations = pets.flatMap((pet) => listVaccinationsForPet(db, pet.id));
  const medications = pets.flatMap((pet) => listMedicationsForPet(db, pet.id, true));
  medications.forEach((medication) => medicationIds.add(medication.id));
  const medicationLogs = Array.from(medicationIds).flatMap((medicationId) => listMedicationLogs(db, medicationId));
  const weightEntries = pets.flatMap((pet) => listWeightEntriesForPet(db, pet.id));
  const feedingSchedules = pets.flatMap((pet) => listFeedingSchedulesForPet(db, pet.id));
  const expenses = pets.flatMap((pet) => listExpensesForPet(db, pet.id));
  const exerciseLogs = pets.flatMap((pet) => listExerciseLogsForPet(db, pet.id));
  const groomingRecords = pets.flatMap((pet) => listGroomingRecordsForPet(db, pet.id));
  const trainingLogs = pets.flatMap((pet) => listTrainingLogsForPet(db, pet.id));
  const photos = pets.flatMap((pet) => listPetPhotosForPet(db, pet.id));
  const timeline = pets.flatMap((pet) => getPetHealthTimeline(db, pet.id, 200));
  const emergencyContacts = listEmergencyContacts(db).filter(
    (contact) => contact.petId === null || (contact.petId !== null && petIds.has(contact.petId)),
  );

  return {
    pets,
    vetVisits,
    vaccinations,
    medications,
    medicationLogs,
    weightEntries,
    feedingSchedules,
    expenses,
    emergencyContacts,
    exerciseLogs,
    groomingRecords,
    trainingLogs,
    photos,
    timeline,
  };
}

export function getPetDashboard(
  db: DatabaseAdapter,
  petId: string,
  referenceIso = new Date().toISOString(),
): PetDashboard | null {
  const pet = getPetById(db, petId);
  if (!pet) {
    return null;
  }

  const dateOnly = referenceIso.slice(0, 10);
  const dueVaccinations = db.query<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM pt_vaccinations
     WHERE pet_id = ?
       AND next_due_date IS NOT NULL
       AND date(next_due_date) <= date(?, '+30 days')`,
    [petId, dateOnly],
  )[0]?.count ?? 0;

  const dueMedications = db.query<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM pt_medications
     WHERE pet_id = ?
       AND is_active = 1
       AND next_due_at IS NOT NULL
       AND datetime(next_due_at) <= datetime(?, '+24 hours')`,
    [petId, referenceIso],
  )[0]?.count ?? 0;

  const nextFeedingAt = db.query<{ feed_at: string }>(
    `SELECT feed_at FROM pt_feeding_schedules WHERE pet_id = ? ORDER BY feed_at ASC LIMIT 1`,
    [petId],
  )[0]?.feed_at ?? null;

  const totalExpensesCents = db.query<{ total: number | null }>(
    `SELECT SUM(amount_cents) as total FROM pt_expenses WHERE pet_id = ?`,
    [petId],
  )[0]?.total ?? 0;

  const lastVetVisitDate = db.query<{ visit_date: string }>(
    `SELECT visit_date FROM pt_vet_visits WHERE pet_id = ? ORDER BY visit_date DESC LIMIT 1`,
    [petId],
  )[0]?.visit_date ?? null;

  const lastExerciseAt = db.query<{ logged_at: string }>(
    `SELECT logged_at FROM pt_exercise_logs WHERE pet_id = ? ORDER BY logged_at DESC LIMIT 1`,
    [petId],
  )[0]?.logged_at ?? null;

  const nextGroomingDueDate = db.query<{ next_due_date: string }>(
    `SELECT next_due_date
     FROM pt_grooming_records
     WHERE pet_id = ?
       AND next_due_date IS NOT NULL
       AND date(next_due_date) >= date(?)
     ORDER BY next_due_date ASC
     LIMIT 1`,
    [petId, dateOnly],
  )[0]?.next_due_date ?? null;

  const photoCount = db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM pt_pet_photos WHERE pet_id = ?`,
    [petId],
  )[0]?.count ?? 0;

  return {
    petId: pet.id,
    petName: pet.name,
    dueVaccinations,
    dueMedications,
    nextFeedingAt,
    totalExpensesCents,
    lastVetVisitDate,
    latestWeightGrams: pet.currentWeightGrams,
    lastExerciseAt,
    nextGroomingDueDate,
    photoCount,
  };
}
