import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, ReadingGoalRing, Button, colors, spacing } from '@mylife/ui';
import { useGoal } from '../../hooks/books/use-goals';
import { useSessions } from '../../hooks/books/use-sessions';
import { useReviews } from '../../hooks/books/use-reviews';
import { useBooks } from '../../hooks/books/use-books';

const BOOKS_ACCENT = colors.modules.books;

export default function StatsScreen() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const { goal, progress, loading: goalLoading } = useGoal(currentYear);
  const { sessions, loading: sessionsLoading } = useSessions();
  const { reviews, loading: reviewsLoading } = useReviews();
  const { books, loading: booksLoading } = useBooks();

  const isLoading = goalLoading || sessionsLoading || reviewsLoading || booksLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BOOKS_ACCENT} />
      </View>
    );
  }

  const booksRead = progress?.booksRead ?? 0;
  const targetBooks = goal?.target_books ?? 24;

  const finishedBookIds = sessions
    .filter((s) => s.status === 'finished')
    .map((s) => s.book_id);
  const totalPages = finishedBookIds.reduce((sum, bookId) => {
    const book = books.find((b) => b.id === bookId);
    return sum + (book?.page_count ?? 0);
  }, 0);

  const ratedReviews = reviews.filter((r) => r.rating != null && r.rating > 0);
  const avgRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedReviews.length
      : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.yearSection}>
        <Text variant="heading">{currentYear}</Text>
        <ReadingGoalRing
          current={booksRead}
          target={targetBooks}
          size={160}
        />
      </View>

      <View style={styles.statGrid}>
        <Card style={styles.statCard}>
          <Text variant="stat" color={BOOKS_ACCENT}>{booksRead}</Text>
          <Text variant="label" color={colors.textSecondary}>Books Read</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text variant="stat" color={BOOKS_ACCENT}>{totalPages.toLocaleString()}</Text>
          <Text variant="label" color={colors.textSecondary}>Pages Read</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text variant="stat" color={BOOKS_ACCENT}>{avgRating.toFixed(1)}</Text>
          <Text variant="label" color={colors.textSecondary}>Avg Rating</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text variant="stat" color={BOOKS_ACCENT}>
            {booksRead > 0 ? Math.round(totalPages / booksRead) : 0}
          </Text>
          <Text variant="label" color={colors.textSecondary}>Avg Pages/Book</Text>
        </Card>
      </View>

      <Card style={styles.chartCard}>
        <Text variant="subheading">Monthly Breakdown</Text>
        <View style={styles.chartPlaceholder}>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
            const monthSessions = sessions.filter((s) => {
              if (s.status !== 'finished' || !s.finished_at) return false;
              const d = new Date(s.finished_at);
              return d.getMonth() === i && d.getFullYear() === currentYear;
            });
            const height = Math.max(monthSessions.length * 20, 8);
            return (
              <View key={month} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: monthSessions.length > 0 ? BOOKS_ACCENT : colors.surfaceElevated,
                    },
                  ]}
                />
                <Text variant="caption" color={colors.textTertiary}>{month}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={styles.chartCard}>
        <Text variant="subheading">Rating Distribution</Text>
        <View style={styles.ratingDistribution}>
          {[5, 4.5, 4, 3.5, 3].map((r) => {
            const count = ratedReviews.filter((rev) => rev.rating === r).length;
            return (
              <View key={r} style={styles.ratingRow}>
                <Text variant="caption" color={colors.textSecondary} style={styles.ratingLabel}>
                  {r}
                </Text>
                <View style={styles.ratingBarTrack}>
                  <View
                    style={[
                      styles.ratingBarFill,
                      { width: count > 0 ? `${Math.max(count * 50, 10)}%` : '0%' },
                    ]}
                  />
                </View>
                <Text variant="caption" color={colors.textTertiary}>{count}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.reviewCTA}>
        <Button
          variant="primary"
          label="View Year in Review"
          onPress={() => router.push('/(books)/year-review')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%' as unknown as number,
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  chartCard: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 60,
    paddingTop: spacing.sm,
  },
  barColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  bar: {
    width: 24,
    borderRadius: 4,
  },
  ratingDistribution: {
    gap: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingLabel: {
    width: 28,
    textAlign: 'right',
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
  },
  ratingBarFill: {
    height: 8,
    backgroundColor: colors.star,
    borderRadius: 4,
  },
  reviewCTA: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
