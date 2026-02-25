import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BudgetGoalsScreen from '../goals';

const pushMock = vi.fn();
const getGoalsMock = vi.fn();
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
  getGoals: (...args: unknown[]) => getGoalsMock(...args),
  listEnvelopes: (...args: unknown[]) => listEnvelopesMock(...args),
}));

describe('BudgetGoalsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getGoalsMock.mockReturnValue([
      {
        id: 'goal-emergency',
        envelope_id: 'env-emergency',
        name: 'Emergency Fund',
        target_amount: 100000,
        target_date: null,
        completed_amount: 100000,
        is_completed: 1,
        created_at: '2026-02-20T00:00:00.000Z',
        updated_at: '2026-02-20T00:00:00.000Z',
      },
      {
        id: 'goal-vacation',
        envelope_id: 'env-travel',
        name: 'Vacation Fund',
        target_amount: 200000,
        target_date: '2026-09-01',
        completed_amount: 50000,
        is_completed: 0,
        created_at: '2026-02-24T00:00:00.000Z',
        updated_at: '2026-02-24T00:00:00.000Z',
      },
      {
        id: 'goal-car',
        envelope_id: 'env-emergency',
        name: 'Car Fund',
        target_amount: 80000,
        target_date: '2026-05-01',
        completed_amount: 10000,
        is_completed: 0,
        created_at: '2026-02-23T00:00:00.000Z',
        updated_at: '2026-02-23T00:00:00.000Z',
      },
    ]);

    listEnvelopesMock.mockReturnValue([
      {
        id: 'env-travel',
        name: 'Travel',
      },
      {
        id: 'env-emergency',
        name: 'Emergency',
      },
    ]);
  });

  it('shows goal summary and routes from New Goal + goal row actions', async () => {
    render(<BudgetGoalsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      expect(screen.getByText('Car Fund')).toBeInTheDocument();
    });

    expect(screen.getByText(/1\/3 completed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New Goal' }));
    expect(pushMock).toHaveBeenCalledWith('/(budget)/goal/create');

    fireEvent.click(screen.getByRole('button', { name: /Vacation Fund/i }));
    expect(pushMock).toHaveBeenCalledWith('/(budget)/goal/goal-vacation');
  });

  it('applies status/envelope filters and due-soon sorting from filter chips', async () => {
    render(<BudgetGoalsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      expect(screen.getByText('Car Fund')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    await waitFor(() => {
      expect(screen.queryByText('Vacation Fund')).not.toBeInTheDocument();
      expect(screen.queryByText('Car Fund')).not.toBeInTheDocument();
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'All Statuses' }));
    fireEvent.click(screen.getByRole('button', { name: 'Travel' }));
    await waitFor(() => {
      expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
      expect(screen.queryByText('Emergency Fund')).not.toBeInTheDocument();
      expect(screen.queryByText('Car Fund')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'All Envelopes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sort: Due Soon' }));

    await waitFor(() => {
      const ordered = screen
        .getAllByText(/Car Fund|Vacation Fund|Emergency Fund/)
        .map((entry) => entry.textContent);
      expect(ordered[0]).toBe('Car Fund');
      expect(ordered[1]).toBe('Vacation Fund');
      expect(ordered[2]).toBe('Emergency Fund');
    });
  });
});
