import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomesScreen from '../index';

const mockDb = { id: 'mock-db' };

const createListingMock = vi.fn();
const deleteListingMock = vi.fn();
const getHomeMarketMetricsMock = vi.fn();
const getListingsMock = vi.fn();
const toggleListingSavedMock = vi.fn();

vi.mock('@mylife/homes', () => ({
  createListing: (...args: unknown[]) => createListingMock(...args),
  deleteListing: (...args: unknown[]) => deleteListingMock(...args),
  getHomeMarketMetrics: (...args: unknown[]) => getHomeMarketMetricsMock(...args),
  getListings: (...args: unknown[]) => getListingsMock(...args),
  toggleListingSaved: (...args: unknown[]) => toggleListingSavedMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('../../../lib/uuid', () => ({
  uuid: () => 'uuid-123',
}));

describe('HomesScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getHomeMarketMetricsMock.mockReturnValue({
      listings: 1,
      savedListings: 1,
      averagePriceCents: 45000000,
      averagePricePerSqft: 425,
    });
    getListingsMock.mockReturnValue([
      {
        id: 'listing-1',
        address: '12 Ocean Ave',
        city: 'Santa Cruz',
        state: 'CA',
        priceCents: 95000000,
        isSaved: 1,
      },
    ]);
  });

  it('creates listing and handles save/delete actions', () => {
    render(<HomesScreen />);

    expect(screen.getByText('12 Ocean Ave')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Address'), {
      target: { value: '44 Pine St' },
    });
    fireEvent.change(screen.getByPlaceholderText('City'), {
      target: { value: 'Portland' },
    });
    fireEvent.change(screen.getByPlaceholderText('State'), {
      target: { value: 'or' },
    });
    fireEvent.change(screen.getByPlaceholderText('Price'), {
      target: { value: '775000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(createListingMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      expect.objectContaining({
        address: '44 Pine St',
        city: 'Portland',
        state: 'OR',
        priceCents: 77500000,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Saved' }));
    expect(toggleListingSavedMock).toHaveBeenCalledWith(mockDb, 'listing-1');

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteListingMock).toHaveBeenCalledWith(mockDb, 'listing-1');
  });
});
