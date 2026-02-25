'use client';

import { useState, useEffect } from 'react';
import {
  fetchReadingStats,
  fetchGoalProgress,
  fetchBookCount,
  fetchBookStatusCounts,
} from '../actions';

interface ReadingStatsUI {
  totalBooks: number;
  booksFinished: number;
  booksReading: number;
  booksWantToRead: number;
  booksDnf: number;
  totalPagesRead: number;
  averageRating: number | null;
  averagePageCount: number | null;
  booksThisYear: number;
  yearlyGoalTarget: number | null;
  favoriteGenres: { name: string; count: number }[];
  monthlyFinished: { month: string; count: number }[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function BooksStatsPage() {
  const [stats, setStats] = useState<ReadingStatsUI>({
    totalBooks: 0,
    booksFinished: 0,
    booksReading: 0,
    booksWantToRead: 0,
    booksDnf: 0,
    totalPagesRead: 0,
    averageRating: null,
    averagePageCount: null,
    booksThisYear: 0,
    yearlyGoalTarget: null,
    favoriteGenres: [],
    monthlyFinished: [],
  });
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [readingStats, goalProgress, totalBookCount, statusCounts] = await Promise.all([
          fetchReadingStats(),
          fetchGoalProgress(currentYear),
          fetchBookCount(),
          fetchBookStatusCounts(),
        ]);

        // Convert booksPerMonth to monthlyFinished array
        const monthlyFinished: { month: string; count: number }[] = [];
        if (readingStats.booksPerMonth) {
          // Get all months from the data, sorted
          const months = Object.keys(readingStats.booksPerMonth).sort();
          for (const monthKey of months) {
            // monthKey is "YYYY-MM" format
            const monthIdx = parseInt(monthKey.split('-')[1], 10) - 1;
            const label = MONTH_LABELS[monthIdx] ?? monthKey;
            monthlyFinished.push({ month: label, count: readingStats.booksPerMonth[monthKey] });
          }
        }

        // Convert topAuthors to favoriteGenres format for display
        const favoriteGenres = readingStats.topAuthors.map((a) => ({
          name: a.author,
          count: a.count,
        }));

        setStats({
          totalBooks: totalBookCount,
          booksFinished: statusCounts.finished || readingStats.totalBooks,
          booksReading: statusCounts.reading,
          booksWantToRead: statusCounts.wantToRead,
          booksDnf: statusCounts.dnf,
          totalPagesRead: readingStats.totalPages,
          averageRating: readingStats.averageRating,
          averagePageCount: readingStats.averagePagesPerBook,
          booksThisYear: goalProgress?.booksRead ?? 0,
          yearlyGoalTarget: goalProgress?.goal.target_books ?? null,
          favoriteGenres,
          monthlyFinished,
        });
      } catch (err) {
        console.error('Failed to load reading stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [currentYear]);

  const goalProgress = stats.yearlyGoalTarget
    ? Math.min(
        100,
        Math.round((stats.booksThisYear / stats.yearlyGoalTarget) * 100),
      )
    : null;

  if (loading) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>Reading Stats</h1>
          <p style={styles.subtitle}>Loading your reading journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Reading Stats</h1>
        <p style={styles.subtitle}>Your reading journey at a glance</p>
      </div>

      {/* Reading goal */}
      {stats.yearlyGoalTarget && (
        <div style={styles.goalCard}>
          <div style={styles.goalHeader}>
            <h3 style={styles.goalTitle}>{currentYear} Reading Goal</h3>
            <span style={styles.goalCount}>
              {stats.booksThisYear} / {stats.yearlyGoalTarget} books
            </span>
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${goalProgress}%`,
              }}
            />
          </div>
          <p style={styles.goalPercent}>{goalProgress}% complete</p>
        </div>
      )}

      {/* Summary cards */}
      <div style={styles.statGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.totalBooks}</span>
          <span style={styles.statLabel}>Total Books</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.booksFinished}</span>
          <span style={styles.statLabel}>Finished</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.booksReading}</span>
          <span style={styles.statLabel}>Reading</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.booksWantToRead}</span>
          <span style={styles.statLabel}>Want to Read</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.booksDnf}</span>
          <span style={styles.statLabel}>DNF</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>
            {stats.totalPagesRead.toLocaleString()}
          </span>
          <span style={styles.statLabel}>Pages Read</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>
            {stats.averageRating ? stats.averageRating.toFixed(1) : '--'}
          </span>
          <span style={styles.statLabel}>Avg Rating</span>
        </div>
      </div>

      {/* Monthly chart (text-based placeholder) */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Books Finished by Month</h3>
        {stats.monthlyFinished.length > 0 ? (
          <div style={styles.chartContainer}>
            {stats.monthlyFinished.map((m) => (
              <div key={m.month} style={styles.chartRow}>
                <span style={styles.chartLabel}>{m.month}</span>
                <div style={styles.chartBarBg}>
                  <div
                    style={{
                      ...styles.chartBarFill,
                      width: `${Math.max(4, (m.count / Math.max(...stats.monthlyFinished.map((x) => x.count))) * 100)}%`,
                    }}
                  />
                </div>
                <span style={styles.chartValue}>{m.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>
            Finish some books to see your reading trends.
          </p>
        )}
      </div>

      {/* Favorite genres */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Top Genres</h3>
        {stats.favoriteGenres.length > 0 ? (
          <div style={styles.genreList}>
            {stats.favoriteGenres.map((g, i) => (
              <div key={g.name} style={styles.genreRow}>
                <span style={styles.genreRank}>#{i + 1}</span>
                <span style={styles.genreName}>{g.name}</span>
                <span style={styles.genreCount}>
                  {g.count} book{g.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>
            Add books with subjects to see genre breakdowns.
          </p>
        )}
      </div>
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
  goalCard: {
    padding: '20px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    marginBottom: '24px',
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  goalTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  goalCount: {
    fontSize: '14px',
    color: 'var(--accent-books)',
    fontWeight: 600,
  },
  progressBar: {
    height: '8px',
    backgroundColor: 'var(--surface-elevated)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--accent-books)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  goalPercent: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    marginTop: '8px',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '32px',
  },
  statCard: {
    padding: '16px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--accent-books)',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 16px 0',
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  chartRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  chartLabel: {
    width: '40px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'right' as const,
    flexShrink: 0,
  },
  chartBarBg: {
    flex: 1,
    height: '20px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    backgroundColor: 'var(--accent-books)',
    borderRadius: 'var(--radius-sm)',
    transition: 'width 0.3s ease',
  },
  chartValue: {
    width: '24px',
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    flexShrink: 0,
  },
  genreList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  genreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--surface)',
  },
  genreRank: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--accent-books)',
    width: '28px',
    flexShrink: 0,
  },
  genreName: {
    flex: 1,
    fontSize: '14px',
    color: 'var(--text)',
  },
  genreCount: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    flexShrink: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
    padding: '24px',
    textAlign: 'center' as const,
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
};
