'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchBooks, fetchShelves } from './actions';

type ShelfFilter = 'all' | 'want_to_read' | 'reading' | 'finished' | 'dnf';

const SHELF_TABS: { key: ShelfFilter; label: string }[] = [
  { key: 'all', label: 'All Books' },
  { key: 'want_to_read', label: 'Want to Read' },
  { key: 'reading', label: 'Currently Reading' },
  { key: 'finished', label: 'Finished' },
  { key: 'dnf', label: 'DNF' },
];

interface BookEntry {
  id: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  rating: number | null;
}

export default function BooksLibraryPage() {
  const [activeShelf, setActiveShelf] = useState<ShelfFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [books, setBooks] = useState<BookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shelves, setShelves] = useState<{ id: string; slug: string }[]>([]);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const allShelves = await fetchShelves();
      const mappedShelves = allShelves.map((s: { id: string; slug: string }) => ({
        id: s.id,
        slug: s.slug,
      }));
      setShelves(mappedShelves);

      const activeShelfId =
        activeShelf === 'all'
          ? undefined
          : mappedShelves.find((s) => s.slug === activeShelf.replace(/_/g, '-'))?.id;

      const rawBooks = activeShelfId
        ? await fetchBooks({ shelf_id: activeShelfId })
        : await fetchBooks();

      setBooks(
        rawBooks.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          title: b.title as string,
          authors: (() => {
            try { return JSON.parse(b.authors as string).join(', '); } catch { return b.authors as string; }
          })(),
          coverUrl: (b.cover_url as string) || null,
          rating: (b.rating as number) ?? null,
        })),
      );
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [activeShelf]);

  useEffect(() => { void loadBooks(); }, [loadBooks]);

  const filtered = books;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Library</h1>
          <p style={styles.subtitle}>{books.length} books in your collection</p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.viewToggle}
          >
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </button>
          <Link href="/books/search" style={styles.addButton}>
            + Add Book
          </Link>
        </div>
      </div>

      {/* Shelf filter tabs */}
      <div style={styles.tabs}>
        {SHELF_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveShelf(tab.key)}
            style={{
              ...styles.tab,
              ...(activeShelf === tab.key ? styles.tabActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Book grid/list */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>📚</p>
          <p style={styles.emptyTitle}>No books yet</p>
          <p style={styles.emptyText}>
            Search for books to add to your library, or import from Goodreads /
            StoryGraph.
          </p>
          <div style={styles.emptyActions}>
            <Link href="/books/search" style={styles.emptyLink}>
              Search Books
            </Link>
            <Link href="/books/import" style={styles.emptyLinkSecondary}>
              Import Library
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={styles.grid}>
          {filtered.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              style={styles.bookCard}
            >
              <div style={styles.coverWrapper}>
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    style={styles.coverImage}
                  />
                ) : (
                  <div style={styles.coverPlaceholder}>
                    <span style={styles.coverPlaceholderText}>
                      {book.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <p style={styles.bookTitle}>{book.title}</p>
              <p style={styles.bookAuthor}>{book.authors}</p>
              {book.rating && (
                <p style={styles.bookRating}>
                  {'★'.repeat(Math.floor(book.rating))}
                  {book.rating % 1 ? '½' : ''}{' '}
                  <span style={styles.ratingValue}>{book.rating}</span>
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              style={styles.listRow}
            >
              <div style={styles.listCover}>
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    style={styles.listCoverImage}
                  />
                ) : (
                  <div style={styles.listCoverPlaceholder}>
                    {book.title.charAt(0)}
                  </div>
                )}
              </div>
              <div style={styles.listInfo}>
                <p style={styles.listTitle}>{book.title}</p>
                <p style={styles.listAuthor}>{book.authors}</p>
              </div>
              {book.rating && (
                <span style={styles.listRating}>{book.rating} ★</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  viewToggle: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  addButton: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-books)',
    color: '#0E0C09',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    overflowX: 'auto',
  },
  tab: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-tertiary)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  tabActive: {
    backgroundColor: 'var(--surface-elevated)',
    color: 'var(--accent-books)',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '64px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyIcon: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  emptyActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '24px',
  },
  emptyLink: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-books)',
    color: '#0E0C09',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  emptyLinkSecondary: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '20px',
  },
  bookCard: {
    display: 'flex',
    flexDirection: 'column',
    textDecoration: 'none',
    transition: 'transform 0.15s',
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: '2/3',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--surface-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
  },
  coverPlaceholderText: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--accent-books)',
  },
  bookTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bookAuthor: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    margin: '2px 0 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bookRating: {
    fontSize: '12px',
    color: 'var(--accent-books)',
    margin: '4px 0 0 0',
  },
  ratingValue: {
    color: 'var(--text-tertiary)',
    fontSize: '11px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  listRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    transition: 'background-color 0.15s',
  },
  listCover: {
    width: '40px',
    height: '60px',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  listCoverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  listCoverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--accent-books)',
  },
  listInfo: {
    flex: 1,
    minWidth: 0,
  },
  listTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listAuthor: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: '2px 0 0 0',
  },
  listRating: {
    fontSize: '13px',
    color: 'var(--accent-books)',
    fontWeight: 600,
    flexShrink: 0,
  },
};
