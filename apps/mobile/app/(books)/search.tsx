import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, SearchBar, BookCover, Button, colors, spacing } from '@mylife/ui';
import { useOpenLibrarySearch } from '../../hooks/books/use-search';
import { useBooks } from '../../hooks/books/use-books';
import { useShelves } from '../../hooks/books/use-shelves';
import { olSearchDocToBook, addBookToShelf, type OLSearchDoc } from '@mylife/books';
import { useDatabase } from '../../components/DatabaseProvider';

const BOOKS_ACCENT = colors.modules.books;

function parseAuthors(authors: string[] | undefined): string {
  return (authors ?? []).join(', ') || 'Unknown Author';
}

export default function SearchScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [query, setQuery] = useState('');
  const { results, loading, error } = useOpenLibrarySearch(query);
  const { create } = useBooks();
  const { shelves } = useShelves();

  const handleAdd = useCallback(
    (doc: OLSearchDoc) => {
      const bookInsert = olSearchDocToBook(doc);
      const book = create(bookInsert);
      const tbrShelf = shelves.find((s) => s.slug === 'want-to-read');
      if (tbrShelf) {
        addBookToShelf(db, book.id, tbrShelf.id);
      }
      Alert.alert('Added', `"${book.title}" added to your library.`);
    },
    [create, shelves, db],
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
              <Pressable
                key={doc.key}
                style={styles.resultRow}
                onPress={() => handleAdd(doc)}
              >
                <BookCover
                  coverUrl={
                    doc.cover_edition_key
                      ? `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`
                      : doc.isbn?.[0]
                        ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`
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
                  label="Add"
                  onPress={() => handleAdd(doc)}
                  style={styles.addButton}
                />
              </Pressable>
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
