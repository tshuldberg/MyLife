'use client';

import { useState } from 'react';
import { addBookToLibrary } from '../actions';

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_edition_key?: string;
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
}

export default function BooksSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=20&fields=key,title,author_name,cover_edition_key,first_publish_year,isbn,number_of_pages_median`,
      );
      const body = await response.json() as { docs?: OpenLibraryDoc[] };
      setResults(body.docs ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdd(result: OpenLibraryDoc) {
    const isbn13 = result.isbn?.find((item) => item.length === 13);
    const isbn10 = result.isbn?.find((item) => item.length === 10);

    await addBookToLibrary({
      title: result.title,
      authors: JSON.stringify(result.author_name ?? []),
      cover_url: result.cover_edition_key
        ? `https://covers.openlibrary.org/b/olid/${result.cover_edition_key}-L.jpg`
        : null,
      isbn_13: isbn13,
      isbn_10: isbn10,
      publish_year: result.first_publish_year,
      page_count: result.number_of_pages_median,
      open_library_id: result.key,
      format: 'physical',
      language: 'en',
      added_source: 'search',
    });

    setAddedIds((current) => [...new Set([...current, result.key])]);
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section
        style={{
          padding: 24,
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(123, 83, 36, 0.12)',
          boxShadow: '0 16px 32px rgba(80, 54, 25, 0.08)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 32 }}>Search Books</h1>
        <p style={{ margin: '10px 0 0', color: '#6B5845' }}>
          Find titles from Open Library and add them directly to MyBooks.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSearch();
              }
            }}
            placeholder="Search by title, author, or ISBN..."
            style={{
              flex: '1 1 340px',
              minWidth: 260,
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(123, 83, 36, 0.18)',
              fontSize: 15,
            }}
          />
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={isLoading || query.trim().length === 0}
            style={{
              borderRadius: 14,
              border: 'none',
              backgroundColor: isLoading ? '#C9B29A' : '#8C5A2B',
              color: '#FFFFFF',
              padding: '12px 18px',
              fontWeight: 700,
              cursor: isLoading ? 'default' : 'pointer',
            }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 14 }}>
        {results.map((result) => {
          const alreadyAdded = addedIds.includes(result.key);
          return (
            <article
              key={result.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                padding: 18,
                borderRadius: 20,
                border: '1px solid rgba(123, 83, 36, 0.12)',
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 0, flex: '1 1 280px' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{result.title}</h2>
                <p style={{ margin: '6px 0 0', color: '#6B5845' }}>
                  {(result.author_name ?? []).join(', ') || 'Unknown author'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleAdd(result)}
                disabled={alreadyAdded}
                style={{
                  borderRadius: 999,
                  border: alreadyAdded ? '1px solid #D4C0AA' : 'none',
                  backgroundColor: alreadyAdded ? '#F5EEE6' : '#8C5A2B',
                  color: alreadyAdded ? '#8C5A2B' : '#FFFFFF',
                  padding: '10px 16px',
                  fontWeight: 700,
                  cursor: alreadyAdded ? 'default' : 'pointer',
                }}
              >
                {alreadyAdded ? 'Added' : '+ Add'}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
