import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../actions', () => ({
  fetchHabits: vi.fn(),
  fetchHabitById: vi.fn(),
  doCreateHabit: vi.fn(),
  doUpdateHabit: vi.fn(),
  doDeleteHabit: vi.fn(),
  fetchHabitCount: vi.fn(),
  doRecordCompletion: vi.fn(),
  fetchCompletionsForDate: vi.fn(),
  doDeleteCompletion: vi.fn(),
  fetchStreaks: vi.fn(),
}));

import HabitsPage from '../page';
import {
  fetchHabits,
  fetchHabitCount,
  fetchCompletionsForDate,
  fetchStreaks,
  doCreateHabit,
  doUpdateHabit,
  doDeleteHabit,
  doRecordCompletion,
  doDeleteCompletion,
} from '../actions';

const mockHabit = (overrides = {}) => ({
  id: 'h-1',
  name: 'Meditate',
  description: null,
  icon: null,
  color: null,
  frequency: 'daily',
  targetCount: 1,
  unit: null,
  isArchived: false,
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

function setupDefaultMocks(habits = [mockHabit()]) {
  vi.mocked(fetchHabits).mockResolvedValue(habits);
  vi.mocked(fetchHabitCount).mockResolvedValue(habits.length);
  vi.mocked(fetchCompletionsForDate).mockResolvedValue([]);
  vi.mocked(fetchStreaks).mockResolvedValue({ currentStreak: 5, longestStreak: 10 });
  vi.mocked(doCreateHabit).mockResolvedValue({ id: 'h-new', ...mockHabit({ id: 'h-new' }) });
  vi.mocked(doUpdateHabit).mockResolvedValue(mockHabit());
  vi.mocked(doDeleteHabit).mockResolvedValue(undefined);
  vi.mocked(doRecordCompletion).mockResolvedValue({ id: 'c-1', habitId: 'h-1', completedAt: new Date().toISOString(), value: 1, notes: null, createdAt: new Date().toISOString() });
  vi.mocked(doDeleteCompletion).mockResolvedValue(undefined);
}

describe('HabitsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('loads habits and today\'s completions on mount', async () => {
    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByText('Habits')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Meditate').length).toBeGreaterThan(0);
    expect(fetchHabits).toHaveBeenCalled();
    expect(fetchCompletionsForDate).toHaveBeenCalled();
    expect(fetchStreaks).toHaveBeenCalled();
  });

  it('creates a new habit via form', async () => {
    const user = userEvent.setup();
    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByText('Habits')).toBeInTheDocument();
    });

    // Name input has placeholder "e.g. Meditate, Read, Exercise"
    const nameInput = screen.getByPlaceholderText(/meditate, read/i);
    await user.type(nameInput, 'Exercise');

    const createButton = screen.getByRole('button', { name: /add habit/i });
    await user.click(createButton);

    await waitFor(() => {
      // doCreateHabit(id, { name, frequency, targetCount }) — two args
      expect(doCreateHabit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: 'Exercise',
        })
      );
    });
  });

  it('marks a habit as complete for today', async () => {
    const user = userEvent.setup();
    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByTitle('Mark complete')).toBeInTheDocument();
    });

    // Toggle button has title="Mark complete"
    const toggleButton = screen.getByTitle('Mark complete');
    await user.click(toggleButton);

    await waitFor(() => {
      // doRecordCompletion(id, habitId, date) — three args
      expect(doRecordCompletion).toHaveBeenCalledWith(
        expect.any(String),
        'h-1',
        expect.any(String)
      );
    });
  });

  it('uncompletes a habit (removes completion)', async () => {
    vi.mocked(fetchCompletionsForDate).mockResolvedValue([
      { id: 'c-1', habitId: 'h-1', completedAt: new Date().toISOString(), value: 1, notes: null, createdAt: new Date().toISOString() },
    ]);

    const user = userEvent.setup();
    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByTitle('Mark incomplete')).toBeInTheDocument();
    });

    // When complete, the toggle button has title="Mark incomplete"
    const toggleButton = screen.getByTitle('Mark incomplete');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(doDeleteCompletion).toHaveBeenCalledWith('c-1');
    });
  });

  it('edits a habit inline', async () => {
    const user = userEvent.setup();
    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
    });

    // Edit button has title="Edit"
    const editButton = screen.getByTitle('Edit');
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('Meditate');
    await user.clear(nameInput);
    await user.type(nameInput, 'Morning Meditation');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      // doUpdateHabit(id, { name, frequency, targetCount }) — two args
      expect(doUpdateHabit).toHaveBeenCalledWith(
        'h-1',
        expect.objectContaining({ name: 'Morning Meditation' })
      );
    });
  });

  it('deletes a habit with confirmation', async () => {
    const user = userEvent.setup();
    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    // Delete button has title="Delete"
    const deleteButton = screen.getByTitle('Delete');
    await user.click(deleteButton);

    // After clicking delete, a "Confirm" button appears with title="Confirm delete"
    const confirmButton = screen.getByTitle('Confirm delete');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(doDeleteHabit).toHaveBeenCalledWith('h-1');
    });
  });

  it('shows streak information in habit meta', async () => {
    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByText('Habits')).toBeInTheDocument();
    });

    // Streaks are shown per-habit in the meta text: "Streak: 5d (best: 10d)"
    await waitFor(() => {
      expect(screen.getByText(/Streak:\s*5d \(best: 10d\)/)).toBeInTheDocument();
    });
  });

  it('archives a habit', async () => {
    const user = userEvent.setup();
    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByTitle('Archive')).toBeInTheDocument();
    });

    // Archive button has title="Archive"
    const archiveButton = screen.getByTitle('Archive');
    await user.click(archiveButton);

    await waitFor(() => {
      // doUpdateHabit(id, { isArchived: true }) — two args
      expect(doUpdateHabit).toHaveBeenCalledWith(
        'h-1',
        expect.objectContaining({ isArchived: true })
      );
    });
  });

  it('shows empty state when no habits', async () => {
    setupDefaultMocks([]);

    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByText('Habits')).toBeInTheDocument();
    });

    expect(screen.getByText(/no active habits/i)).toBeInTheDocument();
  });
});
