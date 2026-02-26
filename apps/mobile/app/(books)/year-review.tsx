import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Text, BookCover, Button, colors, spacing } from '@mylife/ui';
import { useGoal } from '../../hooks/books/use-goals';
import { useSessions } from '../../hooks/books/use-sessions';
import { useReviews } from '../../hooks/books/use-reviews';
import { useBooks } from '../../hooks/books/use-books';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOOKS_ACCENT = colors.modules.books;

function parseAuthors(authors: string): string[] {
  try { return JSON.parse(authors); } catch { return [authors]; }
}

const SLIDES = [
  'intro',
  'top-rated',
  'numbers',
  'monthly',
  'favorites',
  'export',
] as const;

export default function YearReviewScreen() {
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = SLIDES[slideIndex];

  const currentYear = new Date().getFullYear();
  const { goal, progress } = useGoal(currentYear);
  const { sessions } = useSessions();
  const { reviews } = useReviews();
  const { books } = useBooks();

  const booksRead = progress?.booksRead ?? 0;
  const year = goal?.year ?? currentYear;

  const finishedBookIds = sessions
    .filter((s) => s.status === 'finished')
    .map((s) => s.book_id);
  const totalPages = finishedBookIds.reduce((sum, bookId) => {
    const book = books.find((b) => b.id === bookId);
    return sum + (book?.page_count ?? 0);
  }, 0);

  const topRated = reviews
    .filter((r) => r.rating != null && r.rating >= 4.5)
    .map((r) => ({ review: r, book: books.find((b) => b.id === r.book_id)! }))
    .filter((item) => item.book != null);

  const favoriteReviews = reviews.filter((r) => r.is_favorite);

  const goNext = () => setSlideIndex((i) => Math.min(i + 1, SLIDES.length - 1));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable style={styles.container} onPress={goNext}>
        {slide === 'intro' && (
          <View style={styles.slide}>
            <Text variant="label" color={BOOKS_ACCENT}>YOUR YEAR IN BOOKS</Text>
            <Text variant="stat" style={styles.yearTitle}>{year}</Text>
            <Text variant="heading" color={BOOKS_ACCENT}>{booksRead} books read</Text>
          </View>
        )}

        {slide === 'top-rated' && (
          <View style={styles.slide}>
            <Text variant="label" color={BOOKS_ACCENT}>TOP RATED</Text>
            {topRated.length === 0 ? (
              <Text variant="body" color={colors.textTertiary}>No top-rated books yet.</Text>
            ) : (
              <>
                <View style={styles.coverRow}>
                  {topRated.slice(0, 3).map(({ book }) => (
                    <BookCover key={book.id} coverUrl={book.cover_url} size="medium" title={book.title} />
                  ))}
                </View>
                {topRated.map(({ book, review }) => (
                  <Text key={book.id} variant="caption" color={colors.textSecondary}>
                    {book.title} - {review.rating} stars
                  </Text>
                ))}
              </>
            )}
          </View>
        )}

        {slide === 'numbers' && (
          <View style={styles.slide}>
            <Text variant="label" color={BOOKS_ACCENT}>THE NUMBERS</Text>
            <View style={styles.numberGrid}>
              <View style={styles.numberItem}>
                <Text variant="stat" color={BOOKS_ACCENT}>{booksRead}</Text>
                <Text variant="caption" color={colors.textSecondary}>Books</Text>
              </View>
              <View style={styles.numberItem}>
                <Text variant="stat" color={BOOKS_ACCENT}>{totalPages.toLocaleString()}</Text>
                <Text variant="caption" color={colors.textSecondary}>Pages</Text>
              </View>
              <View style={styles.numberItem}>
                <Text variant="stat" color={BOOKS_ACCENT}>{new Set(books.map((b) => b.authors)).size}</Text>
                <Text variant="caption" color={colors.textSecondary}>Authors</Text>
              </View>
            </View>
          </View>
        )}

        {slide === 'monthly' && (
          <View style={styles.slide}>
            <Text variant="label" color={BOOKS_ACCENT}>MONTH BY MONTH</Text>
            <View style={styles.monthBars}>
              {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => {
                const monthSessions = sessions.filter((s) => {
                  if (s.status !== 'finished' || !s.finished_at) return false;
                  const d = new Date(s.finished_at);
                  return d.getMonth() === i && d.getFullYear() === year;
                });
                return (
                  <View key={m + i} style={styles.monthCol}>
                    <View
                      style={[
                        styles.monthBar,
                        {
                          height: Math.max(monthSessions.length * 20, 8),
                          backgroundColor: monthSessions.length > 0 ? BOOKS_ACCENT : colors.surfaceElevated,
                        },
                      ]}
                    />
                    <Text variant="caption" color={colors.textTertiary} style={{ fontSize: 10 }}>{m}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {slide === 'favorites' && (
          <View style={styles.slide}>
            <Text variant="label" color={BOOKS_ACCENT}>YOUR FAVORITES</Text>
            {favoriteReviews.length === 0 ? (
              <Text variant="body" color={colors.textTertiary}>No favorites yet.</Text>
            ) : (
              favoriteReviews.map((r) => {
                const book = books.find((b) => b.id === r.book_id);
                return book ? (
                  <View key={r.id} style={styles.favoriteRow}>
                    <BookCover coverUrl={book.cover_url} size="small" title={book.title} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bookTitle" style={{ fontSize: 16 }}>{book.title}</Text>
                      <Text variant="bookAuthor">{parseAuthors(book.authors).join(', ')}</Text>
                    </View>
                  </View>
                ) : null;
              })
            )}
          </View>
        )}

        {slide === 'export' && (
          <View style={styles.slide}>
            <Text variant="label" color={BOOKS_ACCENT}>SHARE YOUR YEAR</Text>
            <Text variant="body" color={colors.textSecondary} style={{ textAlign: 'center' }}>
              Save a summary image or export your full reading data.
            </Text>
            <Button variant="primary" label="Save as Image" onPress={() => {}} />
            <Button variant="secondary" label="Export Data (CSV)" onPress={() => {}} />
            <Button variant="ghost" label="Done" onPress={() => router.back()} />
          </View>
        )}

        <View style={styles.indicators}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => setSlideIndex(i)}>
              <View
                style={[
                  styles.dot,
                  i === slideIndex && styles.dotActive,
                ]}
              />
            </Pressable>
          ))}
        </View>

        {slideIndex < SLIDES.length - 1 && (
          <Text variant="caption" color={colors.textTertiary} style={styles.tapHint}>
            Tap to continue
          </Text>
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  yearTitle: {
    fontSize: 64,
  },
  coverRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  numberGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  numberItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  monthBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 80,
    marginTop: spacing.lg,
  },
  monthCol: {
    alignItems: 'center',
    gap: 2,
    width: (SCREEN_WIDTH - spacing.lg * 2 - 44) / 12,
  },
  monthBar: {
    width: '100%',
    borderRadius: 2,
  },
  favoriteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
  },
  dotActive: {
    backgroundColor: BOOKS_ACCENT,
  },
  tapHint: {
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },
});
