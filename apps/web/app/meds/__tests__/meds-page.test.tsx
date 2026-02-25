import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../actions', () => ({
  fetchMedications: vi.fn(),
  fetchMedicationById: vi.fn(),
  doCreateMedication: vi.fn(),
  doUpdateMedication: vi.fn(),
  doDeleteMedication: vi.fn(),
  fetchMedicationCount: vi.fn(),
  doRecordDose: vi.fn(),
  fetchDosesForDate: vi.fn(),
  doDeleteDose: vi.fn(),
  fetchAdherenceRate: vi.fn(),
}));

import MedsPage from '../page';
import {
  fetchMedications,
  fetchMedicationCount,
  fetchDosesForDate,
  fetchAdherenceRate,
  doCreateMedication,
  doUpdateMedication,
  doDeleteMedication,
  doRecordDose,
  doDeleteDose,
} from '../actions';

const mockMed = (overrides = {}) => ({
  id: 'med-1',
  name: 'Vitamin D',
  dosage: '2000',
  unit: 'IU',
  frequency: 'daily',
  instructions: null,
  prescriber: null,
  pharmacy: null,
  refillDate: null,
  isActive: true,
  sortOrder: 0,
  notes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

function setupDefaultMocks(medications = [mockMed()]) {
  vi.mocked(fetchMedications).mockResolvedValue(medications);
  vi.mocked(fetchMedicationCount).mockResolvedValue(medications.length);
  vi.mocked(fetchDosesForDate).mockResolvedValue([]);
  vi.mocked(fetchAdherenceRate).mockResolvedValue(85);
  vi.mocked(doCreateMedication).mockResolvedValue({ id: 'med-new', ...mockMed({ id: 'med-new' }) });
  vi.mocked(doUpdateMedication).mockResolvedValue(mockMed());
  vi.mocked(doDeleteMedication).mockResolvedValue(undefined);
  vi.mocked(doRecordDose).mockResolvedValue({ id: 'd-1', medicationId: 'med-1', takenAt: new Date().toISOString(), skipped: false, notes: null, createdAt: new Date().toISOString() });
  vi.mocked(doDeleteDose).mockResolvedValue(undefined);
}

describe('MedsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('loads medications and today\'s doses on mount', async () => {
    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByText('Medications')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Vitamin D').length).toBeGreaterThan(0);
    expect(fetchMedications).toHaveBeenCalled();
    expect(fetchDosesForDate).toHaveBeenCalled();
    expect(fetchAdherenceRate).toHaveBeenCalled();
  });

  it('creates a new medication via form', async () => {
    const user = userEvent.setup();
    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByText('Medications')).toBeInTheDocument();
    });

    // Form inputs use placeholder text
    await user.type(screen.getByPlaceholderText(/medication name/i), 'Aspirin');
    await user.type(screen.getByPlaceholderText(/dosage/i), '81');
    await user.type(screen.getByPlaceholderText(/unit/i), 'mg');

    const createButton = screen.getByRole('button', { name: /add medication/i });
    await user.click(createButton);

    await waitFor(() => {
      // doCreateMedication(id, { name, dosage, unit, frequency }) — two args
      expect(doCreateMedication).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: 'Aspirin',
        })
      );
    });
  });

  it('records a taken dose', async () => {
    const user = userEvent.setup();
    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^take$/i })).toBeInTheDocument();
    });

    const takeButton = screen.getByRole('button', { name: /^take$/i });
    await user.click(takeButton);

    await waitFor(() => {
      // doRecordDose(id, medicationId, takenAt, skipped) — four args
      expect(doRecordDose).toHaveBeenCalledWith(
        expect.any(String),
        'med-1',
        expect.any(String),
        false
      );
    });
  });

  it('records a skipped dose', async () => {
    const user = userEvent.setup();
    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^skip$/i })).toBeInTheDocument();
    });

    const skipButton = screen.getByRole('button', { name: /^skip$/i });
    await user.click(skipButton);

    await waitFor(() => {
      // doRecordDose(id, medicationId, takenAt, skipped) — four args
      expect(doRecordDose).toHaveBeenCalledWith(
        expect.any(String),
        'med-1',
        expect.any(String),
        true
      );
    });
  });

  it('undoes a recorded dose', async () => {
    vi.mocked(fetchDosesForDate).mockResolvedValue([
      { id: 'd-1', medicationId: 'med-1', takenAt: new Date().toISOString(), skipped: false, notes: null, createdAt: new Date().toISOString() },
    ]);

    const user = userEvent.setup();
    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Medications' })).toBeInTheDocument();
    });

    // When a dose is recorded, "Undo" button appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /undo/i }));

    await waitFor(() => {
      expect(doDeleteDose).toHaveBeenCalledWith('d-1');
    });
  });

  it('edits medication inline', async () => {
    const user = userEvent.setup();
    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /^edit$/i });
    await user.click(editButton);

    const dosageInput = screen.getByDisplayValue('2000');
    await user.clear(dosageInput);
    await user.type(dosageInput, '4000');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      // doUpdateMedication(id, { name, dosage, unit, frequency }) — two args
      expect(doUpdateMedication).toHaveBeenCalledWith(
        'med-1',
        expect.objectContaining({ dosage: '4000' })
      );
    });
  });

  it('deactivates a medication', async () => {
    const user = userEvent.setup();
    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deactivate/i })).toBeInTheDocument();
    });

    const deactivateButton = screen.getByRole('button', { name: /deactivate/i });
    await user.click(deactivateButton);

    await waitFor(() => {
      // doUpdateMedication(id, { isActive: false }) — two args
      expect(doUpdateMedication).toHaveBeenCalledWith(
        'med-1',
        expect.objectContaining({ isActive: false })
      );
    });
  });

  it('deletes a medication', async () => {
    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(doDeleteMedication).toHaveBeenCalledWith('med-1');
    });

    confirmSpy.mockRestore();
  });

  it('displays adherence rate', async () => {
    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByText('Medications')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no medications', async () => {
    setupDefaultMocks([]);

    render(<MedsPage />);

    await waitFor(() => {
      expect(screen.getByText('Medications')).toBeInTheDocument();
    });

    expect(screen.getByText(/no medications yet/i)).toBeInTheDocument();
  });
});
