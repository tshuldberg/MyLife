import { render, screen, waitFor } from '@testing-library/react';
import {
  fetchBook,
  fetchSessionsForBook,
  fetchReviewForBook,
  fetchTagsForBook,
  ensureActorIdentityAction,
  fetchFriendInvitesAction,
  fetchFriendsAction,
  fetchVisibleBookShareEventsAction,
} from '../actions';
import BookDetailPage from '../[id]/page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'book-1' }),
}));

vi.mock('../actions', () => ({
  fetchBook: vi.fn(),
  fetchSessionsForBook: vi.fn(),
  fetchReviewForBook: vi.fn(),
  fetchTagsForBook: vi.fn(),
  ensureActorIdentityAction: vi.fn(),
  createBookShareEventAction: vi.fn(),
  fetchVisibleBookShareEventsAction: vi.fn(),
  sendFriendInviteAction: vi.fn(),
  fetchFriendInvitesAction: vi.fn(),
  acceptFriendInviteAction: vi.fn(),
  declineFriendInviteAction: vi.fn(),
  revokeFriendInviteAction: vi.fn(),
  fetchFriendsAction: vi.fn(),
}));

describe('BookDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureActorIdentityAction).mockResolvedValue({
      userId: 'demo-alice',
      actorToken: 'actor-token-demo-alice',
    });
    vi.mocked(fetchFriendInvitesAction).mockResolvedValue({
      incoming: [],
      outgoing: [],
    });
    vi.mocked(fetchFriendsAction).mockResolvedValue([]);
    vi.mocked(fetchVisibleBookShareEventsAction).mockResolvedValue([]);
  });

  it('loads and renders book detail data', async () => {
    vi.mocked(fetchBook).mockResolvedValue({
      id: 'book-1',
      title: 'Dune',
      subtitle: 'Deluxe Edition',
      authors: '["Frank Herbert"]',
      cover_url: null,
      publisher: 'Ace',
      publish_year: 1965,
      page_count: 412,
      isbn_13: '9780441172719',
      description: 'A science fiction classic.',
      format: 'physical',
      language: 'en',
      subjects: '["Science Fiction","Politics"]',
    });
    vi.mocked(fetchSessionsForBook).mockResolvedValue([
      {
        id: 'session-1',
        status: 'reading_now',
        started_at: '2026-01-02T00:00:00.000Z',
        finished_at: null,
        current_page: 120,
      },
    ]);
    vi.mocked(fetchReviewForBook).mockResolvedValue({
      rating: 4.5,
      review_text: 'Still incredible on a reread.',
      favorite_quote: 'Fear is the mind-killer.',
      is_favorite: 1,
    });
    vi.mocked(fetchTagsForBook).mockResolvedValue([
      { id: 'tag-1', name: 'classic' },
    ]);

    render(<BookDetailPage />);

    await waitFor(() => {
      expect(fetchBook).toHaveBeenCalledWith('book-1');
      expect(fetchSessionsForBook).toHaveBeenCalledWith('book-1');
      expect(fetchReviewForBook).toHaveBeenCalledWith('book-1');
      expect(fetchTagsForBook).toHaveBeenCalledWith('book-1');
      expect(ensureActorIdentityAction).toHaveBeenCalledWith({ userId: 'demo-alice' });
      expect(fetchFriendInvitesAction).toHaveBeenCalledWith({
        actorToken: 'actor-token-demo-alice',
      });
      expect(fetchFriendsAction).toHaveBeenCalledWith('actor-token-demo-alice');
      expect(fetchVisibleBookShareEventsAction).toHaveBeenCalledWith({
        viewerToken: 'actor-token-demo-alice',
        objectId: 'book-1',
        limit: 20,
      });
    });

    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('by Frank Herbert')).toBeInTheDocument();
    expect(screen.getByText('reading now')).toBeInTheDocument();
    expect(screen.getByText('Page 120 of 412')).toBeInTheDocument();
    expect(screen.getByText('Still incredible on a reread.')).toBeInTheDocument();
    expect(screen.getByText('Fear is the mind-killer.')).toBeInTheDocument();
    expect(screen.getByText('classic')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share and Friends' })).toBeInTheDocument();
  });

  it('shows not found state when the book cannot be loaded', async () => {
    vi.mocked(fetchBook).mockResolvedValue(null);
    vi.mocked(fetchSessionsForBook).mockResolvedValue([]);
    vi.mocked(fetchReviewForBook).mockResolvedValue(null);
    vi.mocked(fetchTagsForBook).mockResolvedValue([]);

    render(<BookDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Book not found')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Back to Library' })).toHaveAttribute(
      'href',
      '/books',
    );
  });
});
