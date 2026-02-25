import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Text, Button, Card, SearchBar, BookCover, colors, spacing } from '@mylife/ui';
import { useOpenLibrarySearch } from '../../../hooks/books/use-search';
import { useBooks } from '../../../hooks/books/use-books';
import { useShelves } from '../../../hooks/books/use-shelves';
import { olSearchDocToBook, addBookToShelf, type OLSearchDoc } from '@mylife/books';
import { useDatabase } from '../../../components/DatabaseProvider';

const BOOKS_ACCENT = colors.modules.books;

type AddMode = 'search' | 'manual';

export default function AddBookScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [mode, setMode] = useState<AddMode>('search');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');

  const { results, loading } = useOpenLibrarySearch(query);
  const { create } = useBooks();
  const { shelves } = useShelves();

  const handleAddFromSearch = useCallback(
    (doc: OLSearchDoc) => {
      const bookInsert = olSearchDocToBook(doc);
      const book = create(bookInsert);
      const tbrShelf = shelves.find((s) => s.slug === 'want-to-read');
      if (tbrShelf) {
        addBookToShelf(db, book.id, tbrShelf.id);
      }
      router.push(`/(books)/book/${book.id}`);
    },
    [create, shelves, db, router],
  );

  const handleAddManual = useCallback(() => {
    if (!title.trim() || !author.trim()) return;
    const book = create({
      title: title.trim(),
      authors: JSON.stringify([author.trim()]),
      page_count: pages ? parseInt(pages, 10) : undefined,
      added_source: 'manual',
    });
    const tbrShelf = shelves.find((s) => s.slug === 'want-to-read');
    if (tbrShelf) {
      addBookToShelf(db, book.id, tbrShelf.id);
    }
    router.push(`/(books)/book/${book.id}`);
  }, [title, author, pages, create, shelves, db, router]);

  return (
    <>
      <Stack.Screen options={{ title: 'Add Book' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.modeRow}>
          <Button
            variant={mode === 'search' ? 'primary' : 'ghost'}
            label="Search"
            onPress={() => setMode('search')}
          />
          <Button
            variant={mode === 'manual' ? 'primary' : 'ghost'}
            label="Manual"
            onPress={() => setMode('manual')}
          />
          <Button
            variant="secondary"
            label="Scan"
            onPress={() => router.push('/(books)/scan')}
          />
        </View>

        {mode === 'search' ? (
          <>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search Open Library..."
              onScanPress={() => router.push('/(books)/scan')}
            />
            {loading ? (
              <View style={styles.placeholder}>
                <ActivityIndicator size="large" color={BOOKS_ACCENT} />
              </View>
            ) : results.length === 0 && query.length < 2 ? (
              <View style={styles.placeholder}>
                <Text variant="body" color={colors.textTertiary} style={styles.placeholderText}>
                  Search results will appear here. Enter a title, author, or ISBN to search Open Library.
                </Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.placeholder}>
                <Text variant="body" color={colors.textTertiary}>
                  No results for "{query}"
                </Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                {results.map((doc) => (
                  <Pressable
                    key={doc.key}
                    style={styles.resultRow}
                    onPress={() => handleAddFromSearch(doc)}
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
                        {(doc.author_name ?? []).join(', ') || 'Unknown Author'}
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
                      onPress={() => handleAddFromSearch(doc)}
                      style={styles.addButton}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <Card style={styles.formCard}>
            <Text variant="label" color={colors.textTertiary}>Book Details</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title *"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
            <TextInput
              value={author}
              onChangeText={setAuthor}
              placeholder="Author *"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
            <TextInput
              value={pages}
              onChangeText={setPages}
              placeholder="Page count"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Button
              variant="primary"
              label="Add to Library"
              onPress={handleAddManual}
              disabled={!title.trim() || !author.trim()}
            />
          </Card>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  placeholder: {
    alignItems: 'center',
    paddingTop: 60,
  },
  placeholderText: {
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  resultsList: {
    gap: spacing.md,
    marginTop: spacing.sm,
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
  formCard: {
    gap: spacing.sm,
  },
  input: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
});
