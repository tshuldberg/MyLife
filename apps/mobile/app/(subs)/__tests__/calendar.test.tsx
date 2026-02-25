import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubsCalendarScreen from '../calendar';

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

describe('SubsCalendarScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formatCentsMock.mockImplementation((cents: number) => `$${(cents / 100).toFixed(2)}`);
    loadSubsDashboardMock.mockReturnValue({
      upcoming: [
        { id: 'sub-1', name: 'Netflix', next_renewal: '2026-03-01', price: 1599 },
        { id: 'sub-2', name: 'Notion', next_renewal: '2026-04-10', price: 899 },
      ],
    });
  });

  it('groups renewals by month and renders subscription rows', () => {
    render(<SubsCalendarScreen />);

    expect(loadSubsDashboardMock).toHaveBeenCalledWith(mockDb, 90);
    expect(screen.getByText('Renewal Calendar')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Notion')).toBeInTheDocument();
  });
});
