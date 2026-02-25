import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HabitsScreen from '../index';

const mockDb = { id: 'mock-db' };

const countHabitsMock = vi.fn();
const createHabitMock = vi.fn();
const deleteCompletionMock = vi.fn();
const deleteHabitMock = vi.fn();
const getCompletionsForDateMock = vi.fn();
const getHabitsMock = vi.fn();
const getStreaksMock = vi.fn();
const recordCompletionMock = vi.fn();

vi.mock('@mylife/habits', () => ({
  countHabits: (...args: unknown[]) => countHabitsMock(...args),
  createHabit: (...args: unknown[]) => createHabitMock(...args),
  deleteCompletion: (...args: unknown[]) => deleteCompletionMock(...args),
  deleteHabit: (...args: unknown[]) => deleteHabitMock(...args),
  getCompletionsForDate: (...args: unknown[]) => getCompletionsForDateMock(...args),
  getHabits: (...args: unknown[]) => getHabitsMock(...args),
  getStreaks: (...args: unknown[]) => getStreaksMock(...args),
  recordCompletion: (...args: unknown[]) => recordCompletionMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('../../../lib/uuid', () => ({
  uuid: () => 'uuid-123',
}));

describe('HabitsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    countHabitsMock.mockReturnValue(1);
    getHabitsMock.mockReturnValue([
      {
        id: 'habit-1',
        name: 'Read 20 pages',
        frequency: 'daily',
      },
    ]);
    getStreaksMock.mockReturnValue({ currentStreak: 3, longestStreak: 7 });
  });

  it('creates a habit and records completion for today', () => {
    getCompletionsForDateMock.mockReturnValue([]);

    render(<HabitsScreen />);

    fireEvent.change(screen.getByPlaceholderText('Habit name'), {
      target: { value: 'Hydrate' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'weekly' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Habit' }));

    expect(createHabitMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      expect.objectContaining({
        name: 'Hydrate',
        frequency: 'weekly',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: /Read 20 pages/i }));

    expect(recordCompletionMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      'habit-1',
      expect.any(String),
      1,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteHabitMock).toHaveBeenCalledWith(mockDb, 'habit-1');
  });

  it('removes an existing completion when toggled', () => {
    getCompletionsForDateMock.mockReturnValue([
      {
        id: 'completion-1',
        habitId: 'habit-1',
        completedAt: '2026-01-01T10:00:00.000Z',
      },
    ]);

    render(<HabitsScreen />);

    fireEvent.click(screen.getByRole('button', { name: /Read 20 pages/i }));

    expect(deleteCompletionMock).toHaveBeenCalledWith(mockDb, 'completion-1');
  });
});
