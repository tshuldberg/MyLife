import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createModuleTestDatabase, type InMemoryTestDatabase } from '@mylife/db';
import { PETS_MODULE } from '../definition';
import {
  createFeedingSchedule,
  createMedication,
  createPet,
  createPetExpense,
  createVaccination,
  createVetVisit,
  createWeightEntry,
  deletePet,
  getMedicationById,
  getPetById,
  getPetDashboard,
  listDueMedications,
  listDueVaccinationReminders,
  listExpensesForPet,
  listFeedingSchedulesForPet,
  listMedicationLogs,
  listMedicationsForPet,
  listPets,
  listVaccinationsForPet,
  listVetVisitsForPet,
  listWeightEntriesForPet,
  recordMedicationLog,
  updatePet,
} from '../db';
import {
  calculateAverageMonthlyCost,
  calculatePetAgeYears,
  calculateWeightTrend,
  collectMedicationReminders,
  getReminderStatus,
} from '..';

let testDb: InMemoryTestDatabase;

beforeEach(() => {
  testDb = createModuleTestDatabase('pets', PETS_MODULE.migrations!);
});

afterEach(() => {
  testDb.close();
});

describe('Pet profiles', () => {
  it('creates and retrieves a pet', () => {
    createPet(testDb.adapter, 'pet-1', {
      name: 'Milo',
      species: 'dog',
      breed: 'Lab',
      birthDate: '2022-01-10',
      currentWeightGrams: 24000,
    });

    const pet = getPetById(testDb.adapter, 'pet-1');
    expect(pet?.name).toBe('Milo');
    expect(pet?.species).toBe('dog');
    expect(pet?.isArchived).toBe(false);
  });

  it('filters archived pets by default', () => {
    createPet(testDb.adapter, 'pet-1', {
      name: 'Milo',
      species: 'dog',
    });
    createPet(testDb.adapter, 'pet-2', {
      name: 'Otis',
      species: 'cat',
      isArchived: true,
    });

    expect(listPets(testDb.adapter)).toHaveLength(1);
    expect(listPets(testDb.adapter, { includeArchived: true })).toHaveLength(2);
  });

  it('updates and deletes pets', () => {
    createPet(testDb.adapter, 'pet-1', {
      name: 'Milo',
      species: 'dog',
    });

    const updated = updatePet(testDb.adapter, 'pet-1', {
      name: 'Miles',
      microchipId: '12345',
      isArchived: true,
    });
    expect(updated?.name).toBe('Miles');
    expect(updated?.microchipId).toBe('12345');
    expect(updated?.isArchived).toBe(true);

    deletePet(testDb.adapter, 'pet-1');
    expect(getPetById(testDb.adapter, 'pet-1')).toBeNull();
  });
});

describe('Care records', () => {
  beforeEach(() => {
    createPet(testDb.adapter, 'pet-1', {
      name: 'Milo',
      species: 'dog',
      adoptionDate: '2024-01-01',
    });
  });

  it('stores vet visits and vaccinations', () => {
    createVetVisit(testDb.adapter, 'visit-1', {
      petId: 'pet-1',
      visitDate: '2026-03-01',
      visitType: 'wellness',
      reason: 'Annual exam',
      costCents: 18000,
    });
    createVaccination(testDb.adapter, 'vax-1', {
      petId: 'pet-1',
      name: 'Rabies',
      dateGiven: '2025-04-01',
      nextDueDate: '2026-03-20',
    });

    expect(listVetVisitsForPet(testDb.adapter, 'pet-1')).toHaveLength(1);
    expect(listVaccinationsForPet(testDb.adapter, 'pet-1')).toHaveLength(1);

    const reminders = listDueVaccinationReminders(testDb.adapter, '2026-03-08', 30);
    expect(reminders).toHaveLength(1);
    expect(reminders[0].status).toBe('due_soon');
  });

  it('stores medications and logs doses', () => {
    createMedication(testDb.adapter, 'med-1', {
      petId: 'pet-1',
      name: 'Heartworm',
      frequency: 'monthly',
      startsOn: '2026-03-01',
      nextDueAt: '2026-03-10T09:00:00.000Z',
    });

    const dueBefore = listDueMedications(testDb.adapter, '2026-03-09T12:00:00.000Z', 24);
    expect(dueBefore).toHaveLength(1);

    const log = recordMedicationLog(testDb.adapter, {
      medicationId: 'med-1',
      status: 'given',
      loggedAt: '2026-03-10T09:15:00.000Z',
    });
    expect(log.status).toBe('given');
    expect(listMedicationLogs(testDb.adapter, 'med-1')).toHaveLength(1);

    const medication = getMedicationById(testDb.adapter, 'med-1');
    expect(medication?.lastGivenAt).toBe('2026-03-10T09:15:00.000Z');
    expect(medication?.nextDueAt).toBe('2026-04-09T09:15:00.000Z');
  });

  it('stores weights, feeding schedules, and expenses in the dashboard', () => {
    createWeightEntry(testDb.adapter, 'weight-1', {
      petId: 'pet-1',
      weightGrams: 10000,
      loggedAt: '2026-02-01T10:00:00.000Z',
    });
    createWeightEntry(testDb.adapter, 'weight-2', {
      petId: 'pet-1',
      weightGrams: 10700,
      loggedAt: '2026-03-01T10:00:00.000Z',
    });
    createFeedingSchedule(testDb.adapter, 'feed-1', {
      petId: 'pet-1',
      label: 'Breakfast',
      feedAt: '07:30',
      foodName: 'Salmon kibble',
    });
    createPetExpense(testDb.adapter, 'expense-1', {
      petId: 'pet-1',
      category: 'food',
      label: 'Monthly kibble',
      amountCents: 4200,
      spentOn: '2026-03-02',
    });

    expect(listWeightEntriesForPet(testDb.adapter, 'pet-1')).toHaveLength(2);
    expect(listFeedingSchedulesForPet(testDb.adapter, 'pet-1')).toHaveLength(1);
    expect(listExpensesForPet(testDb.adapter, 'pet-1')).toHaveLength(1);

    const dashboard = getPetDashboard(testDb.adapter, 'pet-1', '2026-03-08T09:00:00.000Z');
    expect(dashboard?.latestWeightGrams).toBe(10700);
    expect(dashboard?.nextFeedingAt).toBe('07:30');
    expect(dashboard?.totalExpensesCents).toBe(4200);
  });
});

describe('Pet profiles -- edge cases', () => {
  it('returns null for a non-existent pet ID', () => {
    expect(getPetById(testDb.adapter, 'no-such-pet')).toBeNull();
  });

  it('returns empty list when no pets exist', () => {
    expect(listPets(testDb.adapter)).toHaveLength(0);
  });

  it('updatePet returns existing pet when no fields are provided', () => {
    createPet(testDb.adapter, 'pet-1', { name: 'Milo', species: 'dog' });
    const result = updatePet(testDb.adapter, 'pet-1', {});
    expect(result?.name).toBe('Milo');
  });

  it('supports all species types', () => {
    const species = ['dog', 'cat', 'bird', 'fish', 'reptile', 'rabbit', 'small_mammal', 'horse', 'other'] as const;
    species.forEach((sp, i) => {
      createPet(testDb.adapter, `pet-${i}`, { name: `Pet ${i}`, species: sp });
      const pet = getPetById(testDb.adapter, `pet-${i}`);
      expect(pet?.species).toBe(sp);
    });
  });

  it('creates a pet with all optional fields set', () => {
    createPet(testDb.adapter, 'pet-full', {
      name: 'Max',
      species: 'dog',
      breed: 'Golden Retriever',
      birthDate: '2020-06-15',
      adoptionDate: '2020-08-01',
      sex: 'male',
      isSterilized: true,
      microchipId: 'ABC-123-XYZ',
      currentWeightGrams: 30000,
      imageUri: 'file:///photos/max.jpg',
      notes: 'Very friendly',
    });

    const pet = getPetById(testDb.adapter, 'pet-full');
    expect(pet?.breed).toBe('Golden Retriever');
    expect(pet?.sex).toBe('male');
    expect(pet?.isSterilized).toBe(true);
    expect(pet?.microchipId).toBe('ABC-123-XYZ');
    expect(pet?.imageUri).toBe('file:///photos/max.jpg');
    expect(pet?.notes).toBe('Very friendly');
  });
});

describe('Multiple pets -- isolation', () => {
  beforeEach(() => {
    createPet(testDb.adapter, 'pet-1', { name: 'Milo', species: 'dog' });
    createPet(testDb.adapter, 'pet-2', { name: 'Luna', species: 'cat' });
  });

  it('vet visits are isolated per pet', () => {
    createVetVisit(testDb.adapter, 'v1', { petId: 'pet-1', visitDate: '2026-01-01', reason: 'Checkup' });
    createVetVisit(testDb.adapter, 'v2', { petId: 'pet-2', visitDate: '2026-02-01', reason: 'Vaccines' });

    expect(listVetVisitsForPet(testDb.adapter, 'pet-1')).toHaveLength(1);
    expect(listVetVisitsForPet(testDb.adapter, 'pet-2')).toHaveLength(1);
  });

  it('weight entries are isolated per pet', () => {
    createWeightEntry(testDb.adapter, 'w1', { petId: 'pet-1', weightGrams: 20000 });
    createWeightEntry(testDb.adapter, 'w2', { petId: 'pet-2', weightGrams: 4500 });

    expect(listWeightEntriesForPet(testDb.adapter, 'pet-1')).toHaveLength(1);
    expect(listWeightEntriesForPet(testDb.adapter, 'pet-2')).toHaveLength(1);
  });

  it('expenses are isolated per pet', () => {
    createPetExpense(testDb.adapter, 'e1', { petId: 'pet-1', category: 'food', label: 'Kibble', amountCents: 3000, spentOn: '2026-01-01' });
    createPetExpense(testDb.adapter, 'e2', { petId: 'pet-2', category: 'vet', label: 'Exam', amountCents: 8000, spentOn: '2026-01-15' });

    expect(listExpensesForPet(testDb.adapter, 'pet-1')).toHaveLength(1);
    expect(listExpensesForPet(testDb.adapter, 'pet-2')).toHaveLength(1);
  });

  it('dashboard returns null for non-existent pet', () => {
    expect(getPetDashboard(testDb.adapter, 'no-pet')).toBeNull();
  });

  it('dashboards show separate data per pet', () => {
    createPetExpense(testDb.adapter, 'e1', { petId: 'pet-1', category: 'food', label: 'Kibble', amountCents: 5000, spentOn: '2026-01-01' });
    createPetExpense(testDb.adapter, 'e2', { petId: 'pet-2', category: 'food', label: 'Cat food', amountCents: 3000, spentOn: '2026-01-01' });

    const d1 = getPetDashboard(testDb.adapter, 'pet-1');
    const d2 = getPetDashboard(testDb.adapter, 'pet-2');
    expect(d1?.totalExpensesCents).toBe(5000);
    expect(d2?.totalExpensesCents).toBe(3000);
  });
});

describe('Medication -- advanced', () => {
  beforeEach(() => {
    createPet(testDb.adapter, 'pet-1', { name: 'Milo', species: 'dog' });
  });

  it('skipped dose does not advance nextDueAt', () => {
    createMedication(testDb.adapter, 'med-1', {
      petId: 'pet-1',
      name: 'Antibiotic',
      frequency: 'daily',
      startsOn: '2026-03-01',
      nextDueAt: '2026-03-08T09:00:00.000Z',
    });

    recordMedicationLog(testDb.adapter, {
      medicationId: 'med-1',
      status: 'skipped',
      loggedAt: '2026-03-08T09:15:00.000Z',
    });

    const med = getMedicationById(testDb.adapter, 'med-1');
    // skipped: nextDueAt should remain unchanged
    expect(med?.nextDueAt).toBe('2026-03-08T09:00:00.000Z');
  });

  it('lists both active and inactive medications', () => {
    createMedication(testDb.adapter, 'med-1', { petId: 'pet-1', name: 'Active Med', frequency: 'daily', startsOn: '2026-01-01', isActive: true });
    createMedication(testDb.adapter, 'med-2', { petId: 'pet-1', name: 'Inactive Med', frequency: 'daily', startsOn: '2026-01-01', isActive: false });

    expect(listMedicationsForPet(testDb.adapter, 'pet-1', false)).toHaveLength(1);
    expect(listMedicationsForPet(testDb.adapter, 'pet-1', true)).toHaveLength(2);
  });

  it('throws error when logging for non-existent medication', () => {
    expect(() =>
      recordMedicationLog(testDb.adapter, { medicationId: 'no-such-med' }),
    ).toThrow('Medication not found: no-such-med');
  });
});

describe('Weight -- updates pet current weight', () => {
  it('creating a weight entry updates the pet currentWeightGrams', () => {
    createPet(testDb.adapter, 'pet-1', { name: 'Milo', species: 'dog', currentWeightGrams: 10000 });
    createWeightEntry(testDb.adapter, 'w1', { petId: 'pet-1', weightGrams: 11000 });

    const pet = getPetById(testDb.adapter, 'pet-1');
    expect(pet?.currentWeightGrams).toBe(11000);
  });
});

describe('Feeding schedules', () => {
  it('orders schedules by feedAt ascending', () => {
    createPet(testDb.adapter, 'pet-1', { name: 'Milo', species: 'dog' });
    createFeedingSchedule(testDb.adapter, 'f1', { petId: 'pet-1', label: 'Dinner', feedAt: '18:00' });
    createFeedingSchedule(testDb.adapter, 'f2', { petId: 'pet-1', label: 'Breakfast', feedAt: '07:30' });

    const schedules = listFeedingSchedulesForPet(testDb.adapter, 'pet-1');
    expect(schedules[0].label).toBe('Breakfast');
    expect(schedules[1].label).toBe('Dinner');
  });
});

describe('Vet visits -- ordering', () => {
  it('lists visits in reverse chronological order', () => {
    createPet(testDb.adapter, 'pet-1', { name: 'Milo', species: 'dog' });
    createVetVisit(testDb.adapter, 'v1', { petId: 'pet-1', visitDate: '2026-01-01', reason: 'First visit' });
    createVetVisit(testDb.adapter, 'v2', { petId: 'pet-1', visitDate: '2026-03-01', reason: 'Follow up' });

    const visits = listVetVisitsForPet(testDb.adapter, 'pet-1');
    expect(visits[0].reason).toBe('Follow up');
    expect(visits[1].reason).toBe('First visit');
  });
});
