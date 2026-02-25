import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LibraryScreen from '../library';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const useBooksMock = vi.fn();

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('../../../hooks/books/use-shelves', () => ({
  useShelves: () => ({
    shelves: [
      {
        id: 'shelf-reading',
        name: 'Reading',
        icon: null,
      },
    ],
  }),
}));

vi.mock('../../../hooks/books/use-books', () => ({
  useBooks: (filters?: unknown) => useBooksMock(filters),
}));

vi.mock('../../../components/books/BookGrid', () => ({
  BookGrid: ({ books }: { books: Array<{ title: string }> }) => (
    <div data-testid="book-grid">{books.map((book) => book.title).join('|')}</div>
  ),
}));

vi.mock('../../../components/books/BookList', () => ({
  BookList: ({ books }: { books: Array<{ title: string }> }) => (
    <div data-testid="book-list">{books.map((book) => book.title).join('|')}</div>
  ),
}));

describe('Books mobile LibraryScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBooksMock.mockImplementation(() => ({
      books: [
        {
          id: 'book-z',
          title: 'Zulu',
          authors: '["Author Z"]',
          created_at: '2026-02-10T00:00:00.000Z',
        },
        {
          id: 'book-a',
          title: 'Alpha',
          authors: '["Author A"]',
          created_at: '2026-01-10T00:00:00.000Z',
        },
      ],
      loading: false,
      refresh: refreshMock,
    }));
  });

  it('sorts books when Sort is tapped and toggles view mode', async () => {
    render(<LibraryScreen />);

    expect(screen.getByTestId('book-grid')).toHaveTextContent('Zulu|Alpha');

    fireEvent.click(screen.getByRole('button', { name: 'Sort: added' }));

    await waitFor(() => {
      expect(screen.getByTestId('book-grid')).toHaveTextContent('Alpha|Zulu');
      expect(screen.getByRole('button', { name: 'Sort: title' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByTestId('book-list')).toHaveTextContent('Alpha|Zulu');
    expect(screen.getByRole('button', { name: 'Grid' })).toBeInTheDocument();
  });

  it('reloads useBooks with selected shelf filter', async () => {
    render(<LibraryScreen />);
    expect(useBooksMock).toHaveBeenCalledWith(undefined);

    fireEvent.click(screen.getByRole('button', { name: 'Reading' }));

    await waitFor(() => {
      expect(useBooksMock).toHaveBeenLastCalledWith({
        shelf_id: 'shelf-reading',
      });
    });
  });
});
