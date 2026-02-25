import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../actions', () => ({
  fetchSummary: vi.fn().mockResolvedValue(null),
  fetchUpcomingRenewals: vi.fn().mockResolvedValue([]),
}));

import SubsPage from '../page';
import { fetchSummary, fetchUpcomingRenewals } from '../actions';

const mockSummary = {
  monthlyTotal: 4999,
  annualTotal: 59988,
  dailyCost: 164,
  byCategory: [
    {
      category: 'entertainment',
      monthlyCost: 1999,
      count: 2,
    },
  ],
  activeCount: 5,
  totalCount: 7,
};

const mockUpcomingRenewals = [
  {
    id: '1',
    name: 'Netflix',
    price: 1599,
    next_renewal: '2026-03-01',
    billing_cycle: 'monthly',
    icon: null,
  },
  {
    id: '2',
    name: 'Spotify',
    price: 999,
    next_renewal: '2026-03-05',
    billing_cycle: 'monthly',
    icon: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SubsPage', () => {
  it('shows loading state initially', () => {
    vi.mocked(fetchSummary).mockReturnValue(new Promise(() => {})); // never resolves
    vi.mocked(fetchUpcomingRenewals).mockReturnValue(new Promise(() => {}));

    render(<SubsPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders cost cards with summary data', async () => {
    vi.mocked(fetchSummary).mockResolvedValue(mockSummary);
    vi.mocked(fetchUpcomingRenewals).mockResolvedValue([]);

    render(<SubsPage />);

    await waitFor(() => {
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    expect(screen.getByText('$599.88')).toBeInTheDocument();
    expect(screen.getByText('$1.64')).toBeInTheDocument();
    expect(screen.getByText(/5 active/i)).toBeInTheDocument();
    expect(screen.getByText(/7 total/i)).toBeInTheDocument();
  });

  it('renders category breakdown with progress bars', async () => {
    vi.mocked(fetchSummary).mockResolvedValue(mockSummary);
    vi.mocked(fetchUpcomingRenewals).mockResolvedValue([]);

    render(<SubsPage />);

    await waitFor(() => {
      expect(screen.getByText(/entertainment/i)).toBeInTheDocument();
    });

    // Category cost display (rendered as "$19.99/mo")
    expect(screen.getByText(/\$19\.99\/mo/)).toBeInTheDocument();

    // Subscription count in category
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('renders upcoming renewals list', async () => {
    vi.mocked(fetchSummary).mockResolvedValue(mockSummary);
    vi.mocked(fetchUpcomingRenewals).mockResolvedValue(mockUpcomingRenewals);

    render(<SubsPage />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    expect(screen.getByText('Spotify')).toBeInTheDocument();
    expect(screen.getByText('$15.99')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();

    // Renewal dates should be visible (rendered as raw date strings)
    expect(screen.getByText(/2026-03-01/)).toBeInTheDocument();
    expect(screen.getByText(/2026-03-05/)).toBeInTheDocument();
  });

  it('shows empty state for no subscriptions', async () => {
    vi.mocked(fetchSummary).mockResolvedValue({
      ...mockSummary,
      byCategory: [],
      activeCount: 0,
      totalCount: 0,
      monthlyTotal: 0,
      annualTotal: 0,
      dailyCost: 0,
    });
    vi.mocked(fetchUpcomingRenewals).mockResolvedValue([]);

    render(<SubsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no subscriptions yet/i)).toBeInTheDocument();
    });
  });

  it('shows empty state for no upcoming renewals', async () => {
    vi.mocked(fetchSummary).mockResolvedValue(mockSummary);
    vi.mocked(fetchUpcomingRenewals).mockResolvedValue([]);

    render(<SubsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no upcoming renewals/i)).toBeInTheDocument();
    });
  });

  it('has link to manage subscriptions', async () => {
    vi.mocked(fetchSummary).mockResolvedValue(mockSummary);
    vi.mocked(fetchUpcomingRenewals).mockResolvedValue([]);

    render(<SubsPage />);

    await waitFor(() => {
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    const manageLink = screen.getByRole('link', { name: /manage|subscriptions/i });
    expect(manageLink).toHaveAttribute('href', '/subs/subscriptions');
  });

  it('shows No data when summary fails', async () => {
    vi.mocked(fetchSummary).mockResolvedValue(null);
    vi.mocked(fetchUpcomingRenewals).mockResolvedValue([]);

    render(<SubsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });
  });
});
