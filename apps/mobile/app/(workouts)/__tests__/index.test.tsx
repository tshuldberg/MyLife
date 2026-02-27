import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkoutsScreen from '../index';

const mockDb = { id: 'mock-db' };
const pushMock = vi.fn();

const seedWorkoutExerciseLibraryMock = vi.fn();
const getWorkoutDashboardMock = vi.fn();
const getWorkoutMetricsMock = vi.fn();
const getWorkoutsMock = vi.fn();

vi.mock('@mylife/workouts', () => ({
  seedWorkoutExerciseLibrary: (...args: unknown[]) => seedWorkoutExerciseLibraryMock(...args),
  getWorkoutDashboard: (...args: unknown[]) => getWorkoutDashboardMock(...args),
  getWorkoutMetrics: (...args: unknown[]) => getWorkoutMetricsMock(...args),
  getWorkouts: (...args: unknown[]) => getWorkoutsMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('WorkoutsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getWorkoutDashboardMock.mockReturnValue({
      workouts: 4,
      exercises: 50,
      sessions: 12,
      streakDays: 5,
      totalMinutes30d: 310,
    });

    getWorkoutMetricsMock.mockReturnValue({
      workouts: 9,
      totalMinutes: 420,
      totalCalories: 2650,
      averageRpe: 7.4,
    });

    getWorkoutsMock.mockReturnValue([
      {
        id: 'wk-1',
        title: 'Lower Body Power',
        description: 'Strength day',
        difficulty: 'intermediate',
        exercises: [{ exerciseId: 'ex-1' }],
        estimatedDuration: 1800,
      },
    ]);
  });

  it('shows dashboard metrics and routes to key feature screens', () => {
    render(<WorkoutsScreen />);

    expect(seedWorkoutExerciseLibraryMock).toHaveBeenCalledWith(mockDb);
    expect(screen.getByText('Lower Body Power')).toBeInTheDocument();
    expect(screen.getByText('Exercise Library')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    expect(pushMock).toHaveBeenCalledWith('/(workouts)/explore');

    fireEvent.click(screen.getByRole('button', { name: 'Builder' }));
    expect(pushMock).toHaveBeenCalledWith('/(workouts)/builder');

    fireEvent.click(screen.getByRole('button', { name: 'All Workouts' }));
    expect(pushMock).toHaveBeenCalledWith('/(workouts)/workouts');
  });
});
