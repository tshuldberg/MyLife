'use client';

import { useState } from 'react';
import { addBookToLibrary } from '../actions';

interface SearchResult {
  key: string;
  title: string;
  authors: string[];
  coverEditionKey: string | null;
  firstPublishYear: number | null;
  isbn: string[];
  pageCount: number | null;
  added?: boolean;
}

export default function BooksSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);

    try {
      const encoded = encodeURIComponent(trimmed);
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encoded}&limit=20&fields=key,title,author_name,cover_edition_key,first_publish_year,isbn,number_of_pages_median`,
      );
      const data = await res.json();

      const mapped: SearchResult[] = (data.docs ?? []).map(
        (doc: Record<string, unknown>) => ({
          key: doc.key as string,
          title: doc.title as string,
          authors: (doc.author_name as string[]) ?? [],
          coverEditionKey: (doc.cover_edition_key as string) ?? null,
          firstPublishYear: (doc.first_publish_year as number) ?? null,
          isbn: ((doc.isbn as string[]) ?? []).slice(0, 3),
          pageCount: (doc.number_of_pages_median as number) ?? null,
        }),
      );

      setResults(mapped);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (result: SearchResult) => {
    try {
      const coverUrl = result.coverEditionKey
        ? `https://covers.openlibrary.org/b/olid/${result.coverEditionKey}-L.jpg`
        : null;

      await addBookToLibrary({
        title: result.title,
        authors: JSON.stringify(result.authors),
        cover_url: coverUrl,
        isbn_13: result.isbn.find((i) => i.length === 13) ?? null,
        isbn_10: result.isbn.find((i) => i.length === 10) ?? null,
        publish_year: result.firstPublishYear,
        page_count: result.pageCount,
        open_library_id: result.key,
        format: 'physical',
        language: 'en',
        added_source: 'search',
      });

      setResults((prev) =>
        prev.map((r) => (r.key === result.key ? { ...r, added: true } : r)),
      );
    } catch {
      // Silently handle — likely a duplicate
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getCoverUrl = (editionKey: string | null): string | null => {
    if (!editionKey) return null;
    return `https://covers.openlibrary.org/b/olid/${editionKey}-M.jpg`;
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Search</h1>
        <p style={styles.subtitle}>
          Find books via Open Library (Internet Archive)
        </p>
      </div>

      <div style={styles.searchBar}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by title, author, or ISBN..."
          style={styles.searchInput}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={styles.searchButton}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && (
        <div style={styles.loadingWrapper}>
          <p style={styles.loadingText}>Searching Open Library...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={styles.noResults}>
          <p style={styles.noResultsTitle}>No results found</p>
          <p style={styles.noResultsText}>
            Try a different search term, or check the spelling.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={styles.resultsList}>
          <p style={styles.resultsCount}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((result) => (
            <div key={result.key} style={styles.resultCard}>
              <div style={styles.resultCover}>
                {result.coverEditionKey ? (
                  <img
                    src={getCoverUrl(result.coverEditionKey)!}
                    alt={result.title}
                    style={styles.resultCoverImage}
                  />
                ) : (
                  <div style={styles.resultCoverPlaceholder}>
                    {result.title.charAt(0)}
                  </div>
                )}
              </div>
              <div style={styles.resultInfo}>
                <h3 style={styles.resultTitle}>{result.title}</h3>
                {result.authors.length > 0 && (
                  <p style={styles.resultAuthors}>
                    {result.authors.join(', ')}
                  </p>
                )}
                <div style={styles.resultMeta}>
                  {result.firstPublishYear && (
                    <span style={styles.resultMetaItem}>
                      {result.firstPublishYear}
                    </span>
                  )}
                  {result.pageCount && (
                    <span style={styles.resultMetaItem}>
                      {result.pageCount} pages
                    </span>
                  )}
                  {result.isbn.length > 0 && (
                    <span style={styles.resultMetaItem}>
                      ISBN: {result.isbn[0]}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => void handleAdd(result)}
                disabled={result.added}
                style={{
                  ...styles.addToLibrary,
                  ...(result.added ? { opacity: 0.5, cursor: 'default' } : {}),
                }}
              >
                {result.added ? 'Added' : '+ Add'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!searched && (
        <div style={styles.initial}>
          <p style={styles.initialIcon}>🔍</p>
          <p style={styles.initialTitle}>Search Open Library</p>
          <p style={styles.initialText}>
            Search millions of books from the Internet Archive. All metadata is
            free and open.
          </p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
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
  searchBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  searchInput: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
  },
  searchButton: {
    padding: '10px 24px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: 'var(--accent-books)',
    color: '#0E0C09',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  loadingWrapper: {
    textAlign: 'center' as const,
    padding: '48px 24px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  noResultsTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  noResultsText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  resultsCount: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
  },
  resultCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  resultCover: {
    width: '48px',
    height: '72px',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  resultCoverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  resultCoverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--accent-books)',
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  resultAuthors: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: '2px 0 0 0',
  },
  resultMeta: {
    display: 'flex',
    gap: '12px',
    marginTop: '4px',
  },
  resultMetaItem: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  addToLibrary: {
    padding: '6px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--accent-books)',
    backgroundColor: 'transparent',
    color: 'var(--accent-books)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  initial: {
    textAlign: 'center' as const,
    padding: '64px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  initialIcon: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  initialTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  initialText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};
