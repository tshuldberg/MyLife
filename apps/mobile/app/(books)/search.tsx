import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, SearchBar, BookCover, Button, colors, spacing } from '@mylife/ui';
import { useOpenLibrarySearch } from '../../hooks/books/use-search';
import { useBooks } from '../../hooks/books/use-books';
import { useShelves } from '../../hooks/books/use-shelves';
import { olSearchDocToBook, addBookToShelf, type OLSearchDoc } from '@mylife/books';
import { useDatabase } from '../../components/DatabaseProvider';
import { getBooksSettings, resolvePreferredShelf } from '../../lib/books/settings';

const BOOKS_ACCENT = colors.modules.books;

function parseAuthors(authors: string[] | undefined): string {
  return (authors ?? []).join(', ') || 'Unknown Author';
}

export default function SearchScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [query, setQuery] = useState('');
  const [addingKeys, setAddingKeys] = useState<Record<string, boolean>>({});
  const { results, loading, error } = useOpenLibrarySearch(query);
  const { create } = useBooks();
  const { shelves } = useShelves();
  const coverSizeSuffix = useMemo(() => {
    const quality = getBooksSettings(db).coverImageQuality;
    if (quality === 'small') return 'S';
    if (quality === 'large') return 'L';
    return 'M';
  }, [db]);

  const handleAdd = useCallback(
    (doc: OLSearchDoc) => {
      if (addingKeys[doc.key]) {
        return;
      }
      setAddingKeys((current) => ({ ...current, [doc.key]: true }));
      try {
        const bookInsert = olSearchDocToBook(doc);
        const book = create(bookInsert);
        const settings = getBooksSettings(db);
        const preferredShelf = resolvePreferredShelf(shelves, settings.defaultShelfSlug);
        if (preferredShelf) {
          addBookToShelf(db, book.id, preferredShelf.id);
        }
        Alert.alert(
          'Added',
          `"${book.title}" added to ${preferredShelf?.name ?? 'your library'}.`,
        );
      } finally {
        setAddingKeys((current) => {
          const next = { ...current };
          delete next[doc.key];
          return next;
        });
      }
    },
    [addingKeys, create, shelves, db],
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title, author, or ISBN"
          onScanPress={() => router.push('/(books)/scan')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {query.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" color={colors.textTertiary} style={styles.emptyText}>
              Search Open Library's 30M+ titles by title, author, or ISBN.
            </Text>
            <Button
              variant="secondary"
              label="Scan Barcode"
              onPress={() => router.push('/(books)/scan')}
            />
          </View>
        ) : loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={BOOKS_ACCENT} />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Text variant="body" color={colors.danger}>
              Search failed. Please try again.
            </Text>
          </View>
        ) : results.length === 0 && query.length >= 2 ? (
          <View style={styles.empty}>
            <Text variant="body" color={colors.textTertiary}>
              No results for "{query}"
            </Text>
          </View>
        ) : (
          <View style={styles.results}>
            {results.map((doc) => (
              <View key={doc.key} style={styles.resultRow}>
                <BookCover
                  coverUrl={
                    doc.cover_edition_key
                      ? `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-${coverSizeSuffix}.jpg`
                      : doc.isbn?.[0]
                        ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-${coverSizeSuffix}.jpg`
                        : null
                  }
                  size="small"
                  title={doc.title}
                />
                <View style={styles.resultInfo}>
                  <Text variant="bookTitle" numberOfLines={2} style={{ fontSize: 16 }}>
                    {doc.title}
                  </Text>
                  <Text variant="bookAuthor" numberOfLines={1}>
                    {parseAuthors(doc.author_name)}
                  </Text>
                  {doc.first_publish_year && (
                    <Text variant="caption" color={colors.textTertiary}>
                      {doc.first_publish_year}
                    </Text>
                  )}
                </View>
                <Button
                  variant="primary"
                  label={addingKeys[doc.key] ? 'Adding...' : 'Add'}
                  onPress={() => handleAdd(doc)}
                  disabled={addingKeys[doc.key]}
                  style={styles.addButton}
                />
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={() => router.push('/(books)/book/add')} style={styles.manualLink}>
          <Text variant="caption" color={BOOKS_ACCENT}>
            Can't find your book? Add it manually.
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  results: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  addButton: {
    minWidth: 60,
  },
  manualLink: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
});
