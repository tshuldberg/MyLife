import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MedsScreen from '../index';

const mockDb = { id: 'mock-db' };

const countMedicationsMock = vi.fn();
const getActiveMedicationsMock = vi.fn();
const getDoseLogsForDateMock = vi.fn();
const logDoseMock = vi.fn();
const undoDoseLogMock = vi.fn();
const getLowSupplyAlertsMock = vi.fn();
const getAdherenceRateV2Mock = vi.fn();

vi.mock('@mylife/meds', () => ({
  countMedications: (...args: unknown[]) => countMedicationsMock(...args),
  getActiveMedications: (...args: unknown[]) => getActiveMedicationsMock(...args),
  getDoseLogsForDate: (...args: unknown[]) => getDoseLogsForDateMock(...args),
  logDose: (...args: unknown[]) => logDoseMock(...args),
  undoDoseLog: (...args: unknown[]) => undoDoseLogMock(...args),
  getLowSupplyAlerts: (...args: unknown[]) => getLowSupplyAlertsMock(...args),
  getAdherenceRateV2: (...args: unknown[]) => getAdherenceRateV2Mock(...args),
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
    getActiveMedicationsMock.mockReturnValue([
      {
        id: 'med-1',
        name: 'Ibuprofen',
        dosage: '200mg',
        frequency: 'daily',
        supplyPills: 12,
        lowSupplyThreshold: 5,
      },
    ]);
    getLowSupplyAlertsMock.mockReturnValue([]);
    getAdherenceRateV2Mock.mockReturnValue(88);
  });

  it('records take and skip actions for today', () => {
    getDoseLogsForDateMock.mockReturnValue([]);

    render(<MedsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Take' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(logDoseMock).toHaveBeenNthCalledWith(
      1,
      mockDb,
      'uuid-123',
      expect.objectContaining({
        medicationId: 'med-1',
        status: 'taken',
      }),
    );
    expect(logDoseMock).toHaveBeenNthCalledWith(
      2,
      mockDb,
      'uuid-123',
      expect.objectContaining({
        medicationId: 'med-1',
        status: 'skipped',
      }),
    );
  });

  it('undoes an existing skipped dose from today', () => {
    getDoseLogsForDateMock.mockReturnValue([
      {
        id: 'dose-1',
        medicationId: 'med-1',
        scheduledTime: '2026-01-01T10:00:00.000Z',
        actualTime: null,
        status: 'skipped',
      },
    ]);

    render(<MedsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(undoDoseLogMock).toHaveBeenCalledWith(mockDb, 'dose-1');
  });
});
