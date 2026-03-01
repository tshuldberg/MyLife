import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HabitsScreen from '../index';

const mockDb = { id: 'mock-db' };
const pushMock = vi.fn();

const deleteCompletionMock = vi.fn();
const getCompletionsForDateMock = vi.fn();
const getHabitsMock = vi.fn();
const getStreaksMock = vi.fn();
const getStreaksWithGraceMock = vi.fn();
const getNegativeStreaksMock = vi.fn();
const getMeasurableStreaksMock = vi.fn();
const getMeasurementsForDateMock = vi.fn();
const getSessionsForDateMock = vi.fn();
const recordCompletionMock = vi.fn();
const recordMeasurementMock = vi.fn();
const startSessionMock = vi.fn();
const endSessionMock = vi.fn();

vi.mock('@mylife/habits', () => ({
  deleteCompletion: (...args: unknown[]) => deleteCompletionMock(...args),
  getCompletionsForDate: (...args: unknown[]) => getCompletionsForDateMock(...args),
  getHabits: (...args: unknown[]) => getHabitsMock(...args),
  getStreaks: (...args: unknown[]) => getStreaksMock(...args),
  getStreaksWithGrace: (...args: unknown[]) => getStreaksWithGraceMock(...args),
  getNegativeStreaks: (...args: unknown[]) => getNegativeStreaksMock(...args),
  getMeasurableStreaks: (...args: unknown[]) => getMeasurableStreaksMock(...args),
  getMeasurementsForDate: (...args: unknown[]) => getMeasurementsForDateMock(...args),
  getSessionsForDate: (...args: unknown[]) => getSessionsForDateMock(...args),
  recordCompletion: (...args: unknown[]) => recordCompletionMock(...args),
  recordMeasurement: (...args: unknown[]) => recordMeasurementMock(...args),
  startSession: (...args: unknown[]) => startSessionMock(...args),
  endSession: (...args: unknown[]) => endSessionMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('../../../lib/uuid', () => ({
  uuid: () => 'uuid-123',
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => pushMock(...args),
  }),
}));

describe('HabitsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushMock.mockReset();

    getHabitsMock.mockReturnValue([
      {
        id: 'habit-1',
        name: 'Read 20 pages',
        description: null,
        icon: null,
        color: null,
        frequency: 'daily',
        targetCount: 3,
        unit: null,
        habitType: 'measurable',
        timeOfDay: 'anytime',
        specificDays: null,
        gracePeriod: 0,
        reminderTime: null,
        isArchived: false,
        sortOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    getStreaksMock.mockReturnValue({ currentStreak: 3, longestStreak: 7 });
    getStreaksWithGraceMock.mockReturnValue({ currentStreak: 0, longestStreak: 0 });
    getNegativeStreaksMock.mockReturnValue({ daysSinceLastSlip: 0, longestCleanStreak: 0 });
    getMeasurableStreaksMock.mockReturnValue({ currentStreak: 2, longestStreak: 5 });
    getCompletionsForDateMock.mockReturnValue([]);
    getMeasurementsForDateMock.mockReturnValue([]);
    getSessionsForDateMock.mockReturnValue([]);
  });

  it('records measurable progress for a due habit', () => {
    render(<HabitsScreen />);

    fireEvent.click(screen.getByRole('button', { name: '0/3' }));
    expect(recordMeasurementMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      'habit-1',
      expect.any(String),
      1,
      3,
    );
  });

  it('navigates to stats from the quick nav row', () => {
    render(<HabitsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Stats' }));

    expect(pushMock).toHaveBeenCalledWith('/(habits)/stats');
  });

  it('records completion for an unchecked standard habit', () => {
    getHabitsMock.mockReturnValue([
      {
        id: 'habit-2',
        name: 'Drink Water',
        description: null,
        icon: null,
        color: null,
        frequency: 'daily',
        targetCount: 1,
        unit: null,
        habitType: 'standard',
        timeOfDay: 'anytime',
        specificDays: null,
        gracePeriod: 0,
        reminderTime: null,
        isArchived: false,
        sortOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    render(<HabitsScreen />);

    const checkButtons = screen
      .getAllByRole('button')
      .filter((button) => button.textContent === '');

    fireEvent.click(checkButtons[0]);
    expect(recordCompletionMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      'habit-2',
      expect.any(String),
      1,
    );
  });

  it('deletes completion for a checked standard habit', () => {
    getHabitsMock.mockReturnValue([
      {
        id: 'habit-2',
        name: 'Drink Water',
        description: null,
        icon: null,
        color: null,
        frequency: 'daily',
        targetCount: 1,
        unit: null,
        habitType: 'standard',
        timeOfDay: 'anytime',
        specificDays: null,
        gracePeriod: 0,
        reminderTime: null,
        isArchived: false,
        sortOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    getCompletionsForDateMock.mockReturnValue([
      {
        id: 'completion-1',
        habitId: 'habit-2',
        completedAt: '2026-01-01T10:00:00.000Z',
        value: 1,
        notes: null,
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ]);

    render(<HabitsScreen />);
    const doneButtons = screen
      .getAllByRole('button')
      .filter((button) => button.textContent?.trim() === '✓');
    fireEvent.click(doneButtons[0]);

    expect(deleteCompletionMock).toHaveBeenCalledWith(mockDb, 'completion-1');
  });
});
