'use client';

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchBooks, fetchShelves } from './actions';
import { formatShelfLabel, parseStoredList } from './ui';

interface Shelf {
  id: string;
  slug: string;
}

interface BookSummary {
  id: string;
  title: string;
  authors: string | null;
  cover_url?: string | null;
  rating?: number | null;
}

type ViewMode = 'grid' | 'list';

function cardStyle(viewMode: ViewMode): CSSProperties {
  return {
    display: 'flex',
    flexDirection: viewMode === 'grid' ? 'column' : 'row',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    border: '1px solid rgba(123, 83, 36, 0.12)',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 16px 32px rgba(80, 54, 25, 0.08)',
    textDecoration: 'none',
    color: 'inherit',
    minHeight: viewMode === 'grid' ? 220 : undefined,
  };
}

export default function BooksLibraryPage() {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    let cancelled = false;
    void fetchShelves().then((result) => {
      if (!cancelled) {
        setShelves(result as Shelf[]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const request = selectedShelfId ? fetchBooks({ shelf_id: selectedShelfId }) : fetchBooks();
    void request.then((result) => {
      if (!cancelled) {
        setBooks(result as BookSummary[]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedShelfId]);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section
        style={{
          padding: 24,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #FFF6EA 0%, #F6E4CC 100%)',
          border: '1px solid rgba(123, 83, 36, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>Your Library</h1>
          <p style={{ margin: '10px 0 0', color: '#6B5845', fontSize: 15 }}>
            {books.length} books in your collection
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setViewMode((current) => (current === 'grid' ? 'list' : 'grid'))}
            style={{
              borderRadius: 999,
              border: '1px solid rgba(123, 83, 36, 0.18)',
              backgroundColor: '#FFFFFF',
              color: '#5D4733',
              padding: '10px 14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </button>
          <Link
            href="/books/search"
            style={{
              borderRadius: 999,
              backgroundColor: '#8C5A2B',
              color: '#FFFFFF',
              padding: '10px 16px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            + Add Book
          </Link>
        </div>
      </section>

      <section style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setSelectedShelfId(null)}
          style={{
            borderRadius: 999,
            border: selectedShelfId === null ? '1px solid #8C5A2B' : '1px solid rgba(123, 83, 36, 0.14)',
            backgroundColor: selectedShelfId === null ? '#8C5A2B' : '#FFFFFF',
            color: selectedShelfId === null ? '#FFFFFF' : '#5D4733',
            padding: '8px 14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          All Books
        </button>
        {shelves.map((shelf) => (
          <button
            key={shelf.id}
            type="button"
            onClick={() => setSelectedShelfId(shelf.id)}
            style={{
              borderRadius: 999,
              border: selectedShelfId === shelf.id ? '1px solid #8C5A2B' : '1px solid rgba(123, 83, 36, 0.14)',
              backgroundColor: selectedShelfId === shelf.id ? '#8C5A2B' : '#FFFFFF',
              color: selectedShelfId === shelf.id ? '#FFFFFF' : '#5D4733',
              padding: '8px 14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {formatShelfLabel(shelf.slug)}
          </button>
        ))}
      </section>

      {books.length === 0 ? (
        <section
          style={{
            padding: 32,
            borderRadius: 24,
            border: '1px dashed rgba(123, 83, 36, 0.22)',
            backgroundColor: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24 }}>No books yet</h2>
          <p style={{ margin: '12px auto 0', maxWidth: 480, color: '#6B5845' }}>
            Start a library by searching Open Library or importing from Goodreads or StoryGraph.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <Link href="/books/search" style={{ color: '#8C5A2B', fontWeight: 700, textDecoration: 'none' }}>
              Search Books
            </Link>
            <Link href="/books/import" style={{ color: '#8C5A2B', fontWeight: 700, textDecoration: 'none' }}>
              Import Library
            </Link>
          </div>
        </section>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr',
            gap: 16,
          }}
        >
          {books.map((book) => {
            const authors = parseStoredList(book.authors).join(', ') || 'Unknown author';
            return (
              <Link key={book.id} href={`/books/${book.id}`} style={cardStyle(viewMode)}>
                <div
                  style={{
                    width: viewMode === 'grid' ? '100%' : 84,
                    minWidth: viewMode === 'grid' ? undefined : 84,
                    aspectRatio: '2 / 3',
                    borderRadius: 16,
                    background: book.cover_url
                      ? `center / cover no-repeat url(${book.cover_url})`
                      : 'linear-gradient(135deg, #EAD2B4 0%, #C79258 100%)',
                  }}
                />
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{book.title}</h3>
                    <p style={{ margin: '6px 0 0', color: '#6B5845' }}>{authors}</p>
                  </div>
                  {typeof book.rating === 'number' ? (
                    <span style={{ color: '#8C5A2B', fontWeight: 700 }}>
                      {book.rating.toFixed(1)} / 5
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
