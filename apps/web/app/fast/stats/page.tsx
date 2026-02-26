'use client';

import { useState, useEffect } from 'react';
import {
  fetchStreaks,
  fetchAverageDuration,
  fetchAdherenceRate,
  fetchWeeklyRollup,
  fetchFastCount,
} from '../actions';
import { formatDuration } from '@mylife/fast';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DaySummaryUI {
  date: string;
  totalHours: number;
  hitTarget: boolean;
}

export default function FastStatsPage() {
  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0, totalFasts: 0 });
  const [avgDuration, setAvgDuration] = useState(0);
  const [adherence, setAdherence] = useState(0);
  const [weekly, setWeekly] = useState<DaySummaryUI[]>([]);
  const [totalFasts, setTotalFasts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, avg, adh, w, count] = await Promise.all([
        fetchStreaks(),
        fetchAverageDuration(),
        fetchAdherenceRate(),
        fetchWeeklyRollup(),
        fetchFastCount(),
      ]);
      setStreaks(s);
      setAvgDuration(avg);
      setAdherence(adh);
      setWeekly(w);
      setTotalFasts(count);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>Stats</h1>
          <p style={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Stats</h1>
        <p style={styles.subtitle}>Your fasting journey at a glance</p>
      </div>

      {/* Summary cards */}
      <div style={styles.statGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{totalFasts}</span>
          <span style={styles.statLabel}>Total Fasts</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{streaks.currentStreak}</span>
          <span style={styles.statLabel}>Current Streak</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{streaks.longestStreak}</span>
          <span style={styles.statLabel}>Best Streak</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>
            {avgDuration > 0 ? formatDuration(Math.round(avgDuration)) : '--'}
          </span>
          <span style={styles.statLabel}>Avg Duration</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{adherence > 0 ? `${adherence}%` : '--'}</span>
          <span style={styles.statLabel}>Adherence</span>
        </div>
      </div>

      {/* Weekly chart */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>This Week</h3>
        {weekly.length > 0 ? (
          <div style={styles.chartContainer}>
            {weekly.map((day) => (
              <div key={day.date} style={styles.chartRow}>
                <span style={styles.chartLabel}>{DAY_LABELS[new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1] ?? day.date.slice(5)}</span>
                <div style={styles.chartBarBg}>
                  {day.totalHours > 0 && (
                    <div
                      style={{
                        ...styles.chartBarFill,
                        width: `${Math.max(4, (day.totalHours / 24) * 100)}%`,
                        backgroundColor: day.hitTarget ? '#22C55E' : 'var(--accent-fast, #14B8A6)',
                      }}
                    />
                  )}
                </div>
                <span style={styles.chartValue}>
                  {day.totalHours > 0 ? `${day.totalHours}h` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>Start fasting to see weekly trends.</p>
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
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
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
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--accent-fast, #14B8A6)',
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
    width: '36px',
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
    border: '1px solid var(--border)',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 'var(--radius-sm)',
    transition: 'width 0.3s ease',
  },
  chartValue: {
    width: '36px',
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
