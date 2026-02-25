import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StatsScreen from '../stats';

const pushMock = vi.fn();
const useGoalMock = vi.fn();
const useSessionsMock = vi.fn();
const useReviewsMock = vi.fn();
const useBooksMock = vi.fn();

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('../../../hooks/books/use-goals', () => ({
  useGoal: (...args: unknown[]) => useGoalMock(...args),
}));

vi.mock('../../../hooks/books/use-sessions', () => ({
  useSessions: (...args: unknown[]) => useSessionsMock(...args),
}));

vi.mock('../../../hooks/books/use-reviews', () => ({
  useReviews: (...args: unknown[]) => useReviewsMock(...args),
}));

vi.mock('../../../hooks/books/use-books', () => ({
  useBooks: (...args: unknown[]) => useBooksMock(...args),
}));

describe('Books StatsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGoalMock.mockReturnValue({
      goal: { target_books: 12 },
      progress: { booksRead: 2 },
      loading: false,
    });
    useSessionsMock.mockReturnValue({
      sessions: [
        { id: 's1', status: 'finished', book_id: 'b1', finished_at: '2026-01-10T00:00:00.000Z' },
        { id: 's2', status: 'finished', book_id: 'b2', finished_at: '2026-02-10T00:00:00.000Z' },
      ],
      loading: false,
    });
    useReviewsMock.mockReturnValue({
      reviews: [{ rating: 4 }, { rating: 5 }],
      loading: false,
    });
    useBooksMock.mockReturnValue({
      books: [
        { id: 'b1', page_count: 300 },
        { id: 'b2', page_count: 200 },
      ],
      loading: false,
    });
  });

  it('shows computed stats and routes to year review from CTA button', () => {
    render(<StatsScreen />);

    expect(screen.getByText('Books Read')).toBeInTheDocument();
    expect(screen.getByText('Pages Read')).toBeInTheDocument();
    expect(screen.getByText('Avg Rating')).toBeInTheDocument();
    expect(screen.getByText('Avg Pages/Book')).toBeInTheDocument();
    expect(screen.getByText('Monthly Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Rating Distribution')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View Year in Review' }));
    expect(pushMock).toHaveBeenCalledWith('/(books)/year-review');
  });
});
