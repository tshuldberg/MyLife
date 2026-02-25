import { useState, useEffect, useRef } from 'react';
import { searchBooks, type OLSearchDoc } from '@mylife/books';

export function useOpenLibrarySearch(query: string) {
  const [results, setResults] = useState<OLSearchDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    // Debounce 300ms
    timerRef.current = setTimeout(async () => {
      try {
        const response = await searchBooks(query, 20);
        setResults(response.docs);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  return { results, loading, error };
}
