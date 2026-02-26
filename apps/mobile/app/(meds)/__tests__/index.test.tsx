import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MedsScreen from '../index';

const mockDb = { id: 'mock-db' };

const countMedicationsMock = vi.fn();
const createMedicationMock = vi.fn();
const deleteDoseMock = vi.fn();
const deleteMedicationMock = vi.fn();
const getAdherenceRateMock = vi.fn();
const getDosesForDateMock = vi.fn();
const getMedicationsMock = vi.fn();
const recordDoseMock = vi.fn();

vi.mock('@mylife/meds', () => ({
  countMedications: (...args: unknown[]) => countMedicationsMock(...args),
  createMedication: (...args: unknown[]) => createMedicationMock(...args),
  deleteDose: (...args: unknown[]) => deleteDoseMock(...args),
  deleteMedication: (...args: unknown[]) => deleteMedicationMock(...args),
  getAdherenceRate: (...args: unknown[]) => getAdherenceRateMock(...args),
  getDosesForDate: (...args: unknown[]) => getDosesForDateMock(...args),
  getMedications: (...args: unknown[]) => getMedicationsMock(...args),
  recordDose: (...args: unknown[]) => recordDoseMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('../../../lib/uuid', () => ({
  uuid: () => 'uuid-123',
}));

describe('MedsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    countMedicationsMock.mockReturnValue(1);
    getMedicationsMock.mockReturnValue([
      {
        id: 'med-1',
        name: 'Ibuprofen',
        dosage: '200mg',
        frequency: 'daily',
      },
    ]);
    getAdherenceRateMock.mockReturnValue(88);
  });

  it('creates medication and records take/skip actions', () => {
    getDosesForDateMock.mockReturnValue([]);

    render(<MedsScreen />);

    fireEvent.change(screen.getByPlaceholderText('Medication name'), {
      target: { value: 'Vitamin D' },
    });
    fireEvent.change(screen.getByPlaceholderText('Dosage (e.g. 10mg)'), {
      target: { value: '500 IU' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'weekly' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(createMedicationMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      expect.objectContaining({
        name: 'Vitamin D',
        dosage: '500 IU',
        frequency: 'weekly',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Take' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(recordDoseMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      'med-1',
      expect.any(String),
      false,
    );
    expect(recordDoseMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      'med-1',
      expect.any(String),
      true,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteMedicationMock).toHaveBeenCalledWith(mockDb, 'med-1');
  });

  it('deletes a logged dose from the daily chips', () => {
    getDosesForDateMock.mockReturnValue([
      {
        id: 'dose-1',
        medicationId: 'med-1',
        takenAt: '2026-01-01T10:00:00.000Z',
        skipped: true,
      },
    ]);

    render(<MedsScreen />);

    fireEvent.click(screen.getByRole('button', { name: /Skipped/i }));

    expect(deleteDoseMock).toHaveBeenCalledWith(mockDb, 'dose-1');
  });
});
