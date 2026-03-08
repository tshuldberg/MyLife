import type { DatabaseAdapter } from '@mylife/db';
import {
  CreateFeedingScheduleInputSchema,
  CreateMedicationInputSchema,
  CreatePetExpenseInputSchema,
  CreatePetInputSchema,
  CreateVaccinationInputSchema,
  CreateVetVisitInputSchema,
  CreateWeightEntryInputSchema,
  PetListFilterSchema,
  RecordMedicationLogInputSchema,
  UpdatePetInputSchema,
  type CreateFeedingScheduleInput,
  type CreateMedicationInput,
  type CreatePetExpenseInput,
  type CreatePetInput,
  type CreateVaccinationInput,
  type CreateVetVisitInput,
  type CreateWeightEntryInput,
  type FeedingSchedule,
  type Medication,
  type MedicationLog,
  type Pet,
  type PetDashboard,
  type PetExpense,
  type PetListFilter,
  type Vaccination,
  type VaccinationReminder,
  type VetVisit,
  type WeightEntry,
} from '../types';
import { collectVaccinationReminders, computeNextMedicationDueAt } from '../engine/reminders';

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

  return {
    petId: pet.id,
    petName: pet.name,
    dueVaccinations,
    dueMedications,
    nextFeedingAt,
    totalExpensesCents,
    lastVetVisitDate,
    latestWeightGrams: pet.currentWeightGrams,
  };
}
