import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, ReadingGoalRing, BookCover, StarRating, colors, spacing } from '@mylife/ui';
import { CurrentlyReading } from '../../components/books/CurrentlyReading';
import { useGoal } from '../../hooks/books/use-goals';
import { useSessions } from '../../hooks/books/use-sessions';
import { useReviews } from '../../hooks/books/use-reviews';
import { useBooks } from '../../hooks/books/use-books';

const BOOKS_ACCENT = colors.modules.books;

function parseAuthors(authors: string): string[] {
  try { return JSON.parse(authors); } catch { return [authors]; }
}

export default function BooksHomeScreen() {
  const router = useRouter();
  const { goal, progress, loading: goalLoading, refresh: refreshGoal } = useGoal(new Date().getFullYear());
  const { sessions, loading: sessionsLoading, refresh: refreshSessions } = useSessions();
  const { books, loading: booksLoading, refresh: refreshBooks } = useBooks();
  const [refreshing, setRefreshing] = useState(false);

  const isLoading = goalLoading || sessionsLoading || booksLoading;

  const booksRead = progress?.booksRead ?? 0;
  const targetBooks = goal?.target_books ?? 24;
  const year = goal?.year ?? new Date().getFullYear();

  const finishedSessions = sessions
    .filter((s) => s.status === 'finished')
    .sort((a, b) => (b.finished_at ?? '').localeCompare(a.finished_at ?? ''));

  const recentlyFinished = finishedSessions.map((s) => ({
    book: books.find((b) => b.id === s.book_id),
    session: s,
  })).filter((item) => item.book != null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshGoal();
    refreshSessions();
    refreshBooks();
    setRefreshing(false);
  }, [refreshGoal, refreshSessions, refreshBooks]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BOOKS_ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={BOOKS_ACCENT}
          colors={[BOOKS_ACCENT]}
        />
      }
    >
      {/* Reading Goal */}
      <View style={styles.goalSection}>
        <ReadingGoalRing
          current={booksRead}
          target={targetBooks}
          size={140}
          label={`of ${targetBooks} books`}
        />
        <Text variant="subheading" style={styles.goalLabel}>
          {year} Reading Goal
        </Text>
      </View>

      {/* Currently Reading */}
      <View style={styles.section}>
        <Text variant="subheading">Currently Reading</Text>
        <CurrentlyReading />
      </View>

      {/* Recently Finished */}
      <View style={styles.section}>
        <Text variant="subheading">Recently Finished</Text>
        {recentlyFinished.length === 0 ? (
          <Text variant="body" color={colors.textTertiary}>
            No finished books yet. Start reading!
          </Text>
        ) : (
          recentlyFinished.slice(0, 5).map(({ book, session }) => (
            <RecentBookRow key={session.id} book={book!} bookId={book!.id} onPress={() => router.push(`/(books)/book/${book!.id}`)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function RecentBookRow({ book, bookId, onPress }: { book: { title: string; authors: string; cover_url: string | null }; bookId: string; onPress: () => void }) {
  const { review } = useReviewForBookInline(bookId);
  return (
    <Pressable style={styles.finishedRow} onPress={onPress}>
      <BookCover coverUrl={book.cover_url} size="small" title={book.title} />
      <View style={styles.finishedInfo}>
        <Text variant="bookTitle" numberOfLines={1} style={{ fontSize: 16 }}>
          {book.title}
        </Text>
        <Text variant="bookAuthor" numberOfLines={1}>
          {parseAuthors(book.authors).join(', ')}
        </Text>
        {review?.rating != null && (
          <StarRating rating={review.rating} size={14} readonly />
        )}
      </View>
    </Pressable>
  );
}

function useReviewForBookInline(bookId: string) {
  const { reviews } = useReviews(bookId);
  return { review: reviews.length > 0 ? reviews[0] : null };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  goalLabel: {
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  finishedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  finishedInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
});
