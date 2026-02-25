import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubsDashboardScreen from '../index';

const mockDb = { id: 'mock-db' };

const loadSubsDashboardMock = vi.fn();
const formatCentsMock = vi.fn();

vi.mock('../helpers', () => ({
  loadSubsDashboard: (...args: unknown[]) => loadSubsDashboardMock(...args),
  formatCents: (...args: unknown[]) => formatCentsMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

describe('SubsDashboardScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formatCentsMock.mockImplementation((cents: number) => `$${(cents / 100).toFixed(2)}`);
    loadSubsDashboardMock.mockReturnValue({
      summary: {
        monthlyTotal: 2199,
        annualTotal: 26388,
        dailyCost: 73,
        activeCount: 3,
        totalCount: 4,
        byCategory: [{ category: 'entertainment', monthlyCost: 1299, count: 2 }],
      },
      upcoming: [
        { id: 'sub-1', name: 'Netflix', next_renewal: '2026-03-01', price: 1599 },
      ],
    });
  });

  it('renders dashboard summary, category spend, and upcoming renewals', () => {
    render(<SubsDashboardScreen />);

    expect(loadSubsDashboardMock).toHaveBeenCalledWith(mockDb, 14);
    expect(screen.getByText('3 active of 4 total subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Entertainment')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText(/Renews 2026-03-01/)).toBeInTheDocument();
  });
});
