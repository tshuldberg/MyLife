import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { importFromCSV } from '../actions';
import BooksImportPage from '../import/page';

vi.mock('../actions', () => ({
  importFromCSV: vi.fn(),
}));

describe('BooksImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('imports the selected source CSV and shows results', async () => {
    vi.mocked(importFromCSV).mockResolvedValue({
      imported: 2,
      skipped: 1,
      errors: ['Skipped duplicate: Dune'],
    });

    const user = userEvent.setup();
    const { container } = render(<BooksImportPage />);

    await user.click(screen.getByRole('button', { name: /StoryGraph/i }));

    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const file = new File(['Title,Author\nDune,Frank Herbert'], 'books.csv', {
      type: 'text/csv',
    });
    Object.defineProperty(file, 'text', {
      value: async () => 'Title,Author\nDune,Frank Herbert',
    });

    await user.upload(input as HTMLInputElement, file);
    expect(screen.getByText('books.csv')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Import from StoryGraph' }),
    );

    await waitFor(() => {
      expect(importFromCSV).toHaveBeenCalledWith(
        'storygraph',
        'Title,Author\nDune,Frank Herbert',
      );
    });

    expect(screen.getByText('Books imported')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Books skipped')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Skipped duplicate: Dune')).toBeInTheDocument();
  });

  it('keeps import disabled until a file is selected', () => {
    render(<BooksImportPage />);
    expect(
      screen.getByRole('button', { name: 'Import from Goodreads' }),
    ).toBeDisabled();
  });
});
