import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, SearchBar, colors, spacing } from '@mylife/ui';
import { ShelfTabs } from '../../components/books/ShelfTabs';
import { BookGrid } from '../../components/books/BookGrid';
import { BookList } from '../../components/books/BookList';
import { useShelves } from '../../hooks/books/use-shelves';
import { useBooks } from '../../hooks/books/use-books';
import type { BookFilters } from '@mylife/books';
import { useDatabase } from '../../components/DatabaseProvider';
import { getBooksSettings, setBooksDefaultSort } from '../../lib/books/settings';

const BOOKS_ACCENT = colors.modules.books;

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'added' | 'author' | 'rating';

function firstAuthor(authors: string): string {
  try {
    const parsed = JSON.parse(authors) as string[];
    return parsed[0] ?? '';
  } catch {
    return authors;
  }
}

function ratingValue(book: unknown): number {
  if (typeof book === 'object' && book !== null && 'rating' in book) {
    const rating = (book as { rating?: number | null }).rating;
    return rating ?? 0;
  }
  return 0;
}

export default function LibraryScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [activeShelf, setActiveShelf] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortField>('added');
  const [filterText, setFilterText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { shelves } = useShelves();

  const filters: BookFilters | undefined = useMemo(() => {
    if (!activeShelf) return undefined;
    return { shelf_id: activeShelf };
  }, [activeShelf]);

  const { books, loading, refresh } = useBooks(filters);
  const { books: allBooks } = useBooks();

  useEffect(() => {
    const settings = getBooksSettings(db);
    setSortBy(settings.defaultSort);
  }, [db]);

  const filteredBooks = useMemo(() => {
    if (filterText.length === 0) return books;
    const q = filterText.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.authors.toLowerCase().includes(q),
    );
  }, [books, filterText]);

  const sortedBooks = useMemo(() => {
    const next = [...filteredBooks];
    if (sortBy === 'title') {
      next.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      next.sort((a, b) => firstAuthor(a.authors).localeCompare(firstAuthor(b.authors)));
    } else if (sortBy === 'rating') {
      next.sort((a, b) => ratingValue(b) - ratingValue(a));
    } else {
      next.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
    }
    return next;
  }, [filteredBooks, sortBy]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.resolve(refresh());
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const cycleSort = useCallback(() => {
    const order: SortField[] = ['added', 'title', 'author', 'rating'];
    const index = order.indexOf(sortBy);
    const next = order[(index + 1) % order.length];
    setSortBy(next);
    setBooksDefaultSort(db, next);
  }, [db, sortBy]);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <SearchBar
          value={filterText}
          onChangeText={setFilterText}
          placeholder="Filter library..."
        />
      </View>

      <ShelfTabs
        shelves={shelves}
        activeShelfId={activeShelf}
        onSelect={setActiveShelf}
      />

      <View style={styles.controlsRow}>
        <Text variant="caption" color={colors.textSecondary}>
          {sortedBooks.length} books
        </Text>
        <View style={styles.controlsRight}>
          <Pressable onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <Text variant="caption" color={BOOKS_ACCENT}>
              {viewMode === 'grid' ? 'List' : 'Grid'}
            </Text>
          </Pressable>
          <Pressable onPress={cycleSort}>
            <Text variant="caption" color={BOOKS_ACCENT}>
              Sort: {sortBy}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BOOKS_ACCENT} />
        </View>
      ) : (
        <ScrollView
          style={styles.bookScroll}
          contentContainerStyle={styles.bookContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BOOKS_ACCENT}
              colors={[BOOKS_ACCENT]}
            />
          }
        >
          {sortedBooks.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="body" color={colors.textTertiary}>
                {activeShelf
                  ? (allBooks.length > 0
                    ? `No books on this shelf yet. ${allBooks.length} books are in other shelves.`
                    : 'No books on this shelf yet.')
                  : 'No books in your library yet.'}
              </Text>
              {activeShelf && allBooks.length > 0 && (
                <Pressable onPress={() => setActiveShelf(null)} style={styles.emptyAction}>
                  <Text variant="caption" color={BOOKS_ACCENT}>Show all books</Text>
                </Pressable>
              )}
            </View>
          ) : viewMode === 'grid' ? (
            <BookGrid
              books={sortedBooks}
              onPress={(id) => router.push(`/(books)/book/${id}`)}
            />
          ) : (
            <BookList
              books={sortedBooks}
              onPress={(id) => router.push(`/(books)/book/${id}`)}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  controlsRight: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookScroll: {
    flex: 1,
  },
  bookContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyAction: {
    marginTop: spacing.sm,
  },
});
