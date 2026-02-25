import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkoutsScreen from '../index';

const mockDb = { id: 'mock-db' };

const createWorkoutLogMock = vi.fn();
const createWorkoutProgramMock = vi.fn();
const deleteWorkoutLogMock = vi.fn();
const deleteWorkoutProgramMock = vi.fn();
const getWorkoutLogsMock = vi.fn();
const getWorkoutMetricsMock = vi.fn();
const getWorkoutProgramsMock = vi.fn();
const setActiveWorkoutProgramMock = vi.fn();

vi.mock('@mylife/workouts', () => ({
  createWorkoutLog: (...args: unknown[]) => createWorkoutLogMock(...args),
  createWorkoutProgram: (...args: unknown[]) => createWorkoutProgramMock(...args),
  deleteWorkoutLog: (...args: unknown[]) => deleteWorkoutLogMock(...args),
  deleteWorkoutProgram: (...args: unknown[]) => deleteWorkoutProgramMock(...args),
  getWorkoutLogs: (...args: unknown[]) => getWorkoutLogsMock(...args),
  getWorkoutMetrics: (...args: unknown[]) => getWorkoutMetricsMock(...args),
  getWorkoutPrograms: (...args: unknown[]) => getWorkoutProgramsMock(...args),
  setActiveWorkoutProgram: (...args: unknown[]) => setActiveWorkoutProgramMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('../../../lib/uuid', () => ({
  uuid: () => 'uuid-123',
}));

describe('WorkoutsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getWorkoutMetricsMock.mockReturnValue({
      workouts: 7,
      totalMinutes: 315,
      totalCalories: 2200,
      averageRpe: 7.2,
    });
    getWorkoutProgramsMock.mockReturnValue([
      {
        id: 'prog-1',
        name: 'Strength Block',
        goal: 'Build strength',
        weeks: 8,
        sessionsPerWeek: 4,
        isActive: 0,
      },
    ]);
    getWorkoutLogsMock.mockReturnValue([
      {
        id: 'log-1',
        name: 'Upper Push',
        focus: 'push',
        durationMin: 50,
        calories: 350,
        rpe: 8,
      },
    ]);
  });

  it('creates program and log, and handles program/log actions', () => {
    render(<WorkoutsScreen />);

    expect(screen.getByText('Strength Block')).toBeInTheDocument();
    expect(screen.getByText('Upper Push')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Program name'), {
      target: { value: 'Hypertrophy Cycle' },
    });
    fireEvent.change(screen.getByPlaceholderText('Goal'), {
      target: { value: 'Muscle gain' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(createWorkoutProgramMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      expect.objectContaining({
        name: 'Hypertrophy Cycle',
        goal: 'Muscle gain',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Set' }));
    expect(setActiveWorkoutProgramMock).toHaveBeenCalledWith(mockDb, 'prog-1');

    fireEvent.change(screen.getByPlaceholderText('Workout name'), {
      target: { value: 'Intervals' },
    });
    fireEvent.change(screen.getByPlaceholderText('Duration'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'cardio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Log' }));

    expect(createWorkoutLogMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      expect.objectContaining({
        name: 'Intervals',
        focus: 'cardio',
        durationMin: 30,
      }),
    );

    for (const button of screen.getAllByRole('button', { name: 'Delete' })) {
      fireEvent.click(button);
    }

    expect(deleteWorkoutProgramMock).toHaveBeenCalledWith(mockDb, 'prog-1');
    expect(deleteWorkoutLogMock).toHaveBeenCalledWith(mockDb, 'log-1');
  });
});
