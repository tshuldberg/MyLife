import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BudgetHomeScreen from '../index';

const pushMock = vi.fn();
const listEnvelopesMock = vi.fn();
const mockDb = { id: 'mock-db' };

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useLocalSearchParams: () => ({}),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('@mylife/budget', () => ({
  listEnvelopes: (...args: unknown[]) => listEnvelopesMock(...args),
}));

describe('BudgetHomeScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listEnvelopesMock.mockImplementation((_db, includeArchived: boolean) => {
      const base = [
        {
          id: 'env-groceries',
          name: 'Groceries',
          icon: '🛒',
          color: null,
          monthly_budget: 45000,
          rollover_enabled: 1,
          archived: 0,
          sort_order: 0,
          created_at: '2026-02-25T00:00:00.000Z',
          updated_at: '2026-02-25T00:00:00.000Z',
        },
      ];
      if (includeArchived) {
        base.push({
          id: 'env-archive',
          name: 'Archived Envelope',
          icon: '🧊',
          color: null,
          monthly_budget: 1000,
          rollover_enabled: 0,
          archived: 1,
          sort_order: 1,
          created_at: '2026-02-25T00:00:00.000Z',
          updated_at: '2026-02-25T00:00:00.000Z',
        });
      }
      return base;
    });
  });

  it('routes from all primary action buttons and envelope row press', async () => {
    render(<BudgetHomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'New Envelope' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accounts' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transactions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Goals' }));

    expect(pushMock).toHaveBeenNthCalledWith(1, '/(budget)/create');
    expect(pushMock).toHaveBeenNthCalledWith(2, '/(budget)/accounts');
    expect(pushMock).toHaveBeenNthCalledWith(3, '/(budget)/transactions');
    expect(pushMock).toHaveBeenNthCalledWith(4, '/(budget)/goals');

    fireEvent.click(screen.getByRole('button', { name: /Groceries/i }));
    expect(pushMock).toHaveBeenNthCalledWith(5, '/(budget)/env-groceries');
  });

  it('toggles archived visibility and reloads list data accordingly', async () => {
    render(<BudgetHomeScreen />);

    await waitFor(() => {
      expect(listEnvelopesMock).toHaveBeenCalledWith({ id: 'mock-db' }, false);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show Archived' }));

    await waitFor(() => {
      expect(listEnvelopesMock).toHaveBeenCalledWith({ id: 'mock-db' }, true);
      expect(screen.getByText('Archived Envelope')).toBeInTheDocument();
    });
  });
});
