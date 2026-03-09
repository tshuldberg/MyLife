'use client';

import { useState } from 'react';
import type { LeaderboardEntry } from '@/components/social/types';

const MODULE_OPTIONS = [
  { id: 'all', label: 'Overall', icon: '\u{1F30D}' },
  { id: 'books', label: 'Books', icon: '\u{1F4DA}' },
  { id: 'workouts', label: 'Workouts', icon: '\u{1F3CB}\uFE0F' },
  { id: 'habits', label: 'Habits', icon: '\u{1F31F}' },
] as const;

// TODO: Replace with useLeaderboard() from @mylife/social
function useLeaderboard(_moduleId: string): {
  entries: LeaderboardEntry[];
  loading: boolean;
} {
  return { entries: MOCK_LEADERBOARD, loading: false };
}

export default function LeaderboardPage() {
  const [selectedModule, setSelectedModule] = useState('all');
  const { entries, loading } = useLeaderboard(selectedModule);

  return (
    <div style={styles.container}>
      {/* Module filter */}
      <div style={styles.filters}>
        {MODULE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelectedModule(opt.id)}
            style={{
              ...styles.filterButton,
              backgroundColor:
                selectedModule === opt.id
                  ? 'var(--accent-social)'
                  : 'var(--surface)',
              color:
                selectedModule === opt.id ? '#FFFFFF' : 'var(--text-secondary)',
              borderColor:
                selectedModule === opt.id
                  ? 'var(--accent-social)'
                  : 'var(--border)',
            }}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p style={styles.loadingText}>Loading leaderboard...</p>
      ) : entries.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>No entries yet</p>
          <p style={styles.emptyText}>
            Be the first to climb the leaderboard.
          </p>
        </div>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={styles.colRank}>Rank</span>
            <span style={styles.colName}>User</span>
            <span style={styles.colScore}>Score</span>
          </div>
          {entries.map((entry) => (
            <div
              key={entry.userId}
              style={{
                ...styles.tableRow,
                ...(entry.rank <= 3 ? styles.topThreeRow : {}),
              }}
            >
              <span
                style={{
                  ...styles.colRank,
                  ...styles.rankValue,
                  color:
                    entry.rank === 1
                      ? '#FFD700'
                      : entry.rank === 2
                        ? '#C0C0C0'
                        : entry.rank === 3
                          ? '#CD7F32'
                          : 'var(--text-secondary)',
                }}
              >
                {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
              </span>
              <div style={{ ...styles.colName, ...styles.userCell }}>
                <div style={styles.userAvatar}>
                  <span style={styles.userAvatarText}>
                    {entry.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span style={styles.userName}>{entry.displayName}</span>
              </div>
              <span
                style={{
                  ...styles.colScore,
                  ...styles.scoreValue,
                }}
              >
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '640px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  filters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    font: 'inherit',
    transition: 'background-color 0.15s, color 0.15s',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
  },
  empty: {
    textAlign: 'center',
    padding: '64px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
  },
  table: {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  topThreeRow: {
    backgroundColor: 'var(--surface-elevated)',
  },
  colRank: {
    width: '60px',
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  colName: {
    flex: 1,
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  colScore: {
    width: '80px',
    flexShrink: 0,
    textAlign: 'right' as const,
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  rankValue: {
    fontSize: '16px',
    fontWeight: 700,
    textTransform: 'none' as const,
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textTransform: 'none' as const,
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    backgroundColor: '#7C4DFF1A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--accent-social)',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
  },
  scoreValue: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--accent-social)',
    textTransform: 'none' as const,
  },
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u3', displayName: 'Sam', score: 2450, moduleId: 'all' },
  {
    rank: 2,
    userId: 'u1',
    displayName: 'Alex',
    score: 1890,
    moduleId: 'all',
  },
  {
    rank: 3,
    userId: 'u4',
    displayName: 'Riley',
    score: 1650,
    moduleId: 'all',
  },
  {
    rank: 4,
    userId: 'u2',
    displayName: 'Jordan',
    score: 1200,
    moduleId: 'all',
  },
  {
    rank: 5,
    userId: 'me',
    displayName: 'You',
    score: 980,
    moduleId: 'all',
  },
];
