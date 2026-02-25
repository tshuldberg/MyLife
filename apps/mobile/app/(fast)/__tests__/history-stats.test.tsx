import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FastHistoryScreen from '../history';
import FastStatsScreen from '../stats';

const mockDb = { id: 'mock-db' };

const listFastsMock = vi.fn();
const getStreaksMock = vi.fn();
const adherenceRateMock = vi.fn();
const averageDurationMock = vi.fn();
const durationTrendMock = vi.fn();
const weeklyRollupMock = vi.fn();

vi.mock('@mylife/fast', () => ({
  listFasts: (...args: unknown[]) => listFastsMock(...args),
  getStreaks: (...args: unknown[]) => getStreaksMock(...args),
  adherenceRate: (...args: unknown[]) => adherenceRateMock(...args),
  averageDuration: (...args: unknown[]) => averageDurationMock(...args),
  durationTrend: (...args: unknown[]) => durationTrendMock(...args),
  weeklyRollup: (...args: unknown[]) => weeklyRollupMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

describe('Fast history and stats screens (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getStreaksMock.mockReturnValue({ currentStreak: 3, longestStreak: 9, totalFasts: 14 });

    listFastsMock.mockReturnValue([
      {
        id: 'fast-1',
        protocol: '16:8',
        startedAt: '2026-02-10T08:00:00.000Z',
        hitTarget: true,
        durationSeconds: 57600,
      },
    ]);

    averageDurationMock.mockReturnValue(43200);
    adherenceRateMock.mockReturnValue(82.5);
    weeklyRollupMock.mockReturnValue([
      { date: '2026-02-20', totalHours: 16 },
      { date: '2026-02-21', totalHours: 18 },
    ]);
    durationTrendMock.mockReturnValue([
      { date: '2026-02-20', durationHours: 16, movingAverage: 15.5 },
      { date: '2026-02-21', durationHours: 18, movingAverage: 16.0 },
    ]);
  });

  it('renders grouped fast history with summary and empty state handling', () => {
    render(<FastHistoryScreen />);

    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('16:8')).toBeInTheDocument();
    expect(screen.getByText('Hit Target')).toBeInTheDocument();
    expect(screen.getByText('16h')).toBeInTheDocument();
  });

  it('renders stats rollups and trend values', () => {
    render(<FastStatsScreen />);

    expect(screen.getByText('Avg Duration')).toBeInTheDocument();
    expect(screen.getByText('12.0h')).toBeInTheDocument();
    expect(screen.getByText('82.5%')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('14-Day Trend')).toBeInTheDocument();
  });
});
