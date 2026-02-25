import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addBookToLibrary } from '../actions';
import BooksSearchPage from '../search/page';

vi.mock('../actions', () => ({
  addBookToLibrary: vi.fn().mockResolvedValue('book-1'),
}));

describe('BooksSearchPage', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('searches Open Library and adds a selected result to the library', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        docs: [
          {
            key: '/works/OL1W',
            title: 'Dune',
            author_name: ['Frank Herbert'],
            cover_edition_key: 'OL123M',
            first_publish_year: 1965,
            isbn: ['0441172717', '9780441172719'],
            number_of_pages_median: 412,
          },
        ],
      }),
    });

    const user = userEvent.setup();
    render(<BooksSearchPage />);

    await user.type(
      screen.getByPlaceholderText('Search by title, author, or ISBN...'),
      'dune',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://openlibrary.org/search.json?q=dune&limit=20&fields=key,title,author_name,cover_edition_key,first_publish_year,isbn,number_of_pages_median',
      );
    });

    await user.click(screen.getByRole('button', { name: '+ Add' }));

    expect(addBookToLibrary).toHaveBeenCalledWith({
      title: 'Dune',
      authors: '["Frank Herbert"]',
      cover_url: 'https://covers.openlibrary.org/b/olid/OL123M-L.jpg',
      isbn_13: '9780441172719',
      isbn_10: '0441172717',
      publish_year: 1965,
      page_count: 412,
      open_library_id: '/works/OL1W',
      format: 'physical',
      language: 'en',
      added_source: 'search',
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Added' })).toBeDisabled();
    });
  });

  it('triggers search when Enter is pressed in the query input', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ docs: [] }),
    });

    const user = userEvent.setup();
    render(<BooksSearchPage />);
    const input = screen.getByPlaceholderText(
      'Search by title, author, or ISBN...',
    );

    await user.type(input, 'neuromancer');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://openlibrary.org/search.json?q=neuromancer&limit=20&fields=key,title,author_name,cover_edition_key,first_publish_year,isbn,number_of_pages_median',
      );
    });
  });
});
