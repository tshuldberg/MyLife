import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Alert } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SearchScreen from '../search';

const pushMock = vi.fn();
const createMock = vi.fn(() => ({ id: 'book-1', title: 'Dune' }));
const olSearchDocToBookMock = vi.fn(() => ({
  title: 'Dune',
  authors: '["Frank Herbert"]',
}));
const addBookToShelfMock = vi.fn();
const useOpenLibrarySearchMock = vi.fn((query: string) => {
  if (query === 'dune') {
    return {
      loading: false,
      error: null,
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
    };
  }
  return { loading: false, error: null, results: [] };
});

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => ({ id: 'mock-db' }),
}));

vi.mock('../../../hooks/books/use-search', () => ({
  useOpenLibrarySearch: (query: string) => useOpenLibrarySearchMock(query),
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

describe('Books SearchScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to scan screen from empty-state Scan Barcode button', () => {
    render(<SearchScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Scan Barcode' }));

    expect(pushMock).toHaveBeenCalledWith('/(books)/scan');
  });

  it('adds a searched book to library and links it to Want to Read shelf', async () => {
    render(<SearchScreen />);

    fireEvent.change(
      screen.getByPlaceholderText('Search by title, author, or ISBN'),
      {
        target: { value: 'dune' },
      },
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
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
    expect(Alert.alert).toHaveBeenCalledWith(
      'Added',
      '"Dune" added to your library.',
    );
  });
});
