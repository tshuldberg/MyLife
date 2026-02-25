import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchBooks, fetchShelves } from '../actions';
import BooksLibraryPage from '../page';

vi.mock('../actions', () => ({
  fetchBooks: vi.fn(),
  fetchShelves: vi.fn(),
}));

describe('BooksLibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads books and shelves on first render', async () => {
    vi.mocked(fetchShelves).mockResolvedValue([
      { id: 'shelf-reading', slug: 'reading' },
      { id: 'shelf-wtr', slug: 'want-to-read' },
    ]);
    vi.mocked(fetchBooks).mockResolvedValue([
      {
        id: 'book-1',
        title: 'Dune',
        authors: '["Frank Herbert"]',
        cover_url: null,
        rating: 4.5,
      },
    ]);

    render(<BooksLibraryPage />);

    await waitFor(() => {
      expect(fetchShelves).toHaveBeenCalledTimes(1);
      expect(fetchBooks).toHaveBeenCalledWith();
    });

    expect(screen.getByText('1 books in your collection')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+ Add Book' })).toHaveAttribute(
      'href',
      '/books/search',
    );
  });

  it('filters by selected shelf and toggles list/grid view', async () => {
    vi.mocked(fetchShelves).mockResolvedValue([
      { id: 'shelf-reading', slug: 'reading' },
      { id: 'shelf-wtr', slug: 'want-to-read' },
    ]);
    vi.mocked(fetchBooks)
      .mockResolvedValueOnce([
        {
          id: 'book-1',
          title: 'Dune',
          authors: '["Frank Herbert"]',
          cover_url: null,
          rating: 4,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'book-2',
          title: 'The Pragmatic Programmer',
          authors: '["Andy Hunt", "Dave Thomas"]',
          cover_url: null,
          rating: 5,
        },
      ]);

    const user = userEvent.setup();
    render(<BooksLibraryPage />);

    await waitFor(() => {
      expect(fetchBooks).toHaveBeenCalledTimes(1);
    });

    await user.click(
      screen.getByRole('button', { name: 'Currently Reading' }),
    );

    await waitFor(() => {
      expect(fetchBooks).toHaveBeenNthCalledWith(2, {
        shelf_id: 'shelf-reading',
      });
    });

    const toggleView = screen.getByRole('button', { name: 'List' });
    await user.click(toggleView);
    expect(screen.getByRole('button', { name: 'Grid' })).toBeInTheDocument();
    expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
  });

  it('shows empty state links when no books are returned', async () => {
    vi.mocked(fetchShelves).mockResolvedValue([]);
    vi.mocked(fetchBooks).mockResolvedValue([]);

    render(<BooksLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('No books yet')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Search Books' })).toHaveAttribute(
      'href',
      '/books/search',
    );
    expect(
      screen.getByRole('link', { name: 'Import Library' }),
    ).toHaveAttribute('href', '/books/import');
  });
});
