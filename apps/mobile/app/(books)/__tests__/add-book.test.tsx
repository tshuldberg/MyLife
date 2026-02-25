import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddBookScreen from '../book/add';

const pushMock = vi.fn();
const createMock = vi.fn();
const useOpenLibrarySearchMock = vi.fn();
const olSearchDocToBookMock = vi.fn();
const addBookToShelfMock = vi.fn();

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  Stack: {
    Screen: () => null,
  },
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => ({ id: 'mock-db' }),
}));

vi.mock('../../../hooks/books/use-search', () => ({
  useOpenLibrarySearch: (...args: unknown[]) => useOpenLibrarySearchMock(...args),
}));

vi.mock('../../../hooks/books/use-books', () => ({
  useBooks: () => ({
    create: createMock,
  }),
}));

vi.mock('../../../hooks/books/use-shelves', () => ({
  useShelves: () => ({
    shelves: [{ id: 'shelf-wtr', slug: 'want-to-read' }],
  }),
}));

vi.mock('@mylife/books', () => ({
  olSearchDocToBook: (...args: unknown[]) => olSearchDocToBookMock(...args),
  addBookToShelf: (...args: unknown[]) => addBookToShelfMock(...args),
}));

describe('AddBookScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockReturnValue({ id: 'book-1' });
    olSearchDocToBookMock.mockReturnValue({
      title: 'Dune',
      authors: '["Frank Herbert"]',
    });
    useOpenLibrarySearchMock.mockImplementation((query: string) => {
      if (query === 'dune') {
        return {
          results: [
            {
              key: '/works/OL123W',
              title: 'Dune',
              author_name: ['Frank Herbert'],
              cover_edition_key: 'OL123M',
              isbn: ['0441172717'],
              first_publish_year: 1965,
            },
          ],
          loading: false,
        };
      }
      return { results: [], loading: false };
    });
  });

  it('supports search add flow and sends user to created book page', () => {
    render(<AddBookScreen />);

    fireEvent.change(screen.getByPlaceholderText('Search Open Library...'), {
      target: { value: 'dune' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(olSearchDocToBookMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      title: 'Dune',
      authors: '["Frank Herbert"]',
    });
    expect(addBookToShelfMock).toHaveBeenCalledWith(
      { id: 'mock-db' },
      'book-1',
      'shelf-wtr',
    );
    expect(pushMock).toHaveBeenCalledWith('/(books)/book/book-1');
  });

  it('supports manual add flow and scan navigation button', () => {
    render(<AddBookScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Manual' }));
    fireEvent.change(screen.getByPlaceholderText('Title *'), {
      target: { value: 'Manual Book' },
    });
    fireEvent.change(screen.getByPlaceholderText('Author *'), {
      target: { value: 'Manual Author' },
    });
    fireEvent.change(screen.getByPlaceholderText('Page count'), {
      target: { value: '280' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to Library' }));

    expect(createMock).toHaveBeenCalledWith({
      title: 'Manual Book',
      authors: '["Manual Author"]',
      page_count: 280,
      added_source: 'manual',
    });
    expect(pushMock).toHaveBeenCalledWith('/(books)/book/book-1');

    fireEvent.click(screen.getByRole('button', { name: 'Scan' }));
    expect(pushMock).toHaveBeenCalledWith('/(books)/scan');
  });
});
