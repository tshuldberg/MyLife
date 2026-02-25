import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FastTimerScreen from '../index';

const mockDb = { id: 'mock-db' };

const computeTimerStateMock = vi.fn();
const formatDurationMock = vi.fn();
const getActiveFastMock = vi.fn();
const getProtocolsMock = vi.fn();
const getStreaksMock = vi.fn();
const refreshStreakCacheMock = vi.fn();
const startFastMock = vi.fn();
const endFastMock = vi.fn();

vi.mock('@mylife/fast', () => ({
  computeTimerState: (...args: unknown[]) => computeTimerStateMock(...args),
  formatDuration: (...args: unknown[]) => formatDurationMock(...args),
  getActiveFast: (...args: unknown[]) => getActiveFastMock(...args),
  getProtocols: (...args: unknown[]) => getProtocolsMock(...args),
  getStreaks: (...args: unknown[]) => getStreaksMock(...args),
  refreshStreakCache: (...args: unknown[]) => refreshStreakCacheMock(...args),
  startFast: (...args: unknown[]) => startFastMock(...args),
  endFast: (...args: unknown[]) => endFastMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('../../../lib/uuid', () => ({
  uuid: () => 'uuid-123',
}));

describe('FastTimerScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    formatDurationMock.mockReturnValue('01:00:00');
    getActiveFastMock.mockReturnValue(null);
    getProtocolsMock.mockReturnValue([
      {
        id: '16:8',
        name: '16:8',
        fasting_hours: 16,
        eating_hours: 8,
      },
      {
        id: '18:6',
        name: '18:6',
        fasting_hours: 18,
        eating_hours: 6,
      },
    ]);
    getStreaksMock.mockReturnValue({ currentStreak: 4, longestStreak: 10, totalFasts: 28 });
    computeTimerStateMock.mockReturnValue({
      state: 'idle',
      elapsed: 0,
      remaining: 0,
      progress: 0,
      targetReached: false,
    });
  });

  it('starts a fast with selected protocol', () => {
    render(<FastTimerScreen />);

    fireEvent.click(screen.getByRole('button', { name: '18:6' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start Fast' }));

    expect(startFastMock).toHaveBeenCalledWith(mockDb, 'uuid-123', '18:6', 18);
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('Total Fasts')).toBeInTheDocument();
  });

  it('ends an active fast and refreshes streak cache', () => {
    computeTimerStateMock.mockReturnValue({
      state: 'fasting',
      elapsed: 3600,
      remaining: 1800,
      progress: 0.67,
      targetReached: false,
    });

    render(<FastTimerScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'End Fast' }));

    expect(endFastMock).toHaveBeenCalledWith(mockDb, expect.any(Date));
    expect(refreshStreakCacheMock).toHaveBeenCalledWith(mockDb);
  });
});
