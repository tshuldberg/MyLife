import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubsSubscriptionsScreen from '../subscriptions';

const mockDb = { id: 'mock-db' };

const createSubscriptionMock = vi.fn();
const deleteSubscriptionMock = vi.fn();
const getSubscriptionsMock = vi.fn();
const getValidTransitionsMock = vi.fn();
const transitionSubscriptionMock = vi.fn();
const defaultNextRenewalMock = vi.fn();
const formatCentsMock = vi.fn();

vi.mock('@mylife/subs', () => ({
  createSubscription: (...args: unknown[]) => createSubscriptionMock(...args),
  deleteSubscription: (...args: unknown[]) => deleteSubscriptionMock(...args),
  getSubscriptions: (...args: unknown[]) => getSubscriptionsMock(...args),
  getValidTransitions: (...args: unknown[]) => getValidTransitionsMock(...args),
  transitionSubscription: (...args: unknown[]) => transitionSubscriptionMock(...args),
}));

vi.mock('../helpers', () => ({
  defaultNextRenewal: (...args: unknown[]) => defaultNextRenewalMock(...args),
  formatCents: (...args: unknown[]) => formatCentsMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('../../../lib/uuid', () => ({
  uuid: () => 'uuid-123',
}));

describe('SubsSubscriptionsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    defaultNextRenewalMock.mockReturnValue('2026-03-15');
    formatCentsMock.mockImplementation((cents: number) => `$${(cents / 100).toFixed(2)}`);

    getSubscriptionsMock.mockReturnValue([
      {
        id: 'sub-1',
        name: 'Spotify',
        price: 1099,
        billing_cycle: 'monthly',
        status: 'active',
        next_renewal: '2026-03-02',
      },
    ]);
    getValidTransitionsMock.mockReturnValue(['paused', 'cancelled']);
  });

  it('creates subscription and supports status transition and delete', () => {
    render(<SubsSubscriptionsScreen />);

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Dropbox' },
    });
    fireEvent.change(screen.getByPlaceholderText('Price'), {
      target: { value: '12.99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'custom' }));
    fireEvent.change(screen.getByPlaceholderText('Custom days'), {
      target: { value: '45' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(defaultNextRenewalMock).toHaveBeenCalledWith(
      expect.any(String),
      'custom',
      45,
    );
    expect(createSubscriptionMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      expect.objectContaining({
        name: 'Dropbox',
        price: 1299,
        billing_cycle: 'custom',
        custom_days: 45,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'paused' }));
    expect(transitionSubscriptionMock).toHaveBeenCalledWith(mockDb, 'sub-1', 'paused');

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteSubscriptionMock).toHaveBeenCalledWith(mockDb, 'sub-1');
  });
});
