'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { fetchCalorieHistory, fetchWeeklyTrends, fetchMonthlyTrends } from '../actions';

interface DayTotal {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

type ViewMode = '7d' | '30d' | '90d' | 'month';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  backLink: { fontSize: '0.85rem', color: 'var(--accent-nutrition)', marginBottom: '1rem', display: 'inline-block' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.85rem', fontSize: '0.8rem',
    color: 'var(--text-secondary)', cursor: 'pointer',
  },
  tabActive: {
    background: 'var(--accent-nutrition)', border: '1px solid var(--accent-nutrition)',
    borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.85rem', fontSize: '0.8rem',
    color: '#fff', cursor: 'pointer', fontWeight: 600,
  },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  chartContainer: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem',
  },
  barChart: {
    display: 'flex', alignItems: 'flex-end', gap: '2px', height: 200, padding: '0 0.5rem',
  },
  barColumn: {
    flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.25rem',
  },
  bar: {
    width: '100%', borderRadius: '3px 3px 0 0', transition: 'height 0.3s ease', minWidth: 4,
  },
  barLabel: { fontSize: '0.6rem', color: 'var(--text-tertiary)', writingMode: 'vertical-rl' as const, transform: 'rotate(180deg)', maxHeight: 50 },
  barValue: { fontSize: '0.6rem', color: 'var(--text-secondary)' },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem',
  },
  statCard: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', textAlign: 'center' as const,
  },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-nutrition)' },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' },
  dayRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.5rem 0', borderBottom: '1px solid var(--border)',
  },
  dayDate: { fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 },
  dayMacros: { fontSize: '0.75rem', color: 'var(--text-secondary)' },
  dayCal: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-nutrition)' },
  empty: { textAlign: 'center' as const, color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.9rem' },
};

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NutritionTrendsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('7d');
  const [data, setData] = useState<DayTotal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let result: DayTotal[];
      if (viewMode === '7d') {
        result = (await fetchCalorieHistory(7)) as DayTotal[];
      } else if (viewMode === '30d') {
        result = (await fetchCalorieHistory(30)) as DayTotal[];
      } else if (viewMode === '90d') {
        result = (await fetchCalorieHistory(90)) as DayTotal[];
      } else {
        const now = new Date();
        result = (await fetchMonthlyTrends(now.getFullYear(), now.getMonth() + 1)) as DayTotal[];
      }
      setData(result);
    } catch (err) {
      console.error('Failed to load trends:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => { loadData(); }, [loadData]);

  const maxCal = Math.max(...data.map((d) => d.calories), 1);
  const avgCal = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length) : 0;
  const avgProtein = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.proteinG, 0) / data.length) : 0;
  const avgCarbs = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.carbsG, 0) / data.length) : 0;
  const avgFat = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.fatG, 0) / data.length) : 0;
  const totalDays = data.length;
  const loggedDays = data.filter((d) => d.calories > 0).length;

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading trends...</div></div>;
  }

  return (
    <div style={styles.page}>
      <Link href="/nutrition" style={styles.backLink}>Back to Diary</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Trends</h1>
        <p style={styles.subtitle}>Calorie history and macro trends</p>
      </div>

      <div style={styles.tabs}>
        {[
          { key: '7d' as ViewMode, label: '7 Days' },
          { key: '30d' as ViewMode, label: '30 Days' },
          { key: '90d' as ViewMode, label: '90 Days' },
          { key: 'month' as ViewMode, label: 'This Month' },
        ].map((tab) => (
          <button
            key={tab.key}
            style={viewMode === tab.key ? styles.tabActive : styles.tab}
            onClick={() => setViewMode(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{avgCal}</div>
          <div style={styles.statLabel}>Avg Calories/Day</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#3B82F6' }}>{avgProtein}g</div>
          <div style={styles.statLabel}>Avg Protein</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#F59E0B' }}>{avgCarbs}g</div>
          <div style={styles.statLabel}>Avg Carbs</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#EF4444' }}>{avgFat}g</div>
          <div style={styles.statLabel}>Avg Fat</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{loggedDays}/{totalDays}</div>
          <div style={styles.statLabel}>Days Logged</div>
        </div>
      </div>

      {/* Calorie Bar Chart */}
      <div style={{ ...styles.section, marginTop: '1.5rem' }}>
        <h2 style={styles.sectionTitle}>Calorie History</h2>
        {data.length === 0 ? (
          <div style={styles.empty}>No data for this period. Log some meals to see trends.</div>
        ) : (
          <div style={styles.chartContainer}>
            <div style={styles.barChart}>
              {data.map((day) => {
                const height = maxCal > 0 ? (day.calories / maxCal) * 180 : 0;
                return (
                  <div key={day.date} style={styles.barColumn}>
                    <div style={styles.barValue}>
                      {day.calories > 0 ? Math.round(day.calories) : ''}
                    </div>
                    <div style={{
                      ...styles.bar,
                      height: Math.max(height, 2),
                      background: day.calories > 0 ? 'var(--accent-nutrition)' : 'var(--surface)',
                    }} />
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                      {viewMode === '7d' || viewMode === 'month'
                        ? formatShortDate(day.date)
                        : new Date(day.date + 'T12:00:00').getDate()
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Daily Breakdown */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Daily Breakdown</h2>
        <div style={{
          background: 'var(--surface-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
        }}>
          {data.length === 0 ? (
            <div style={styles.empty}>No data available.</div>
          ) : (
            [...data].reverse().map((day) => (
              <div key={day.date} style={styles.dayRow}>
                <div>
                  <div style={styles.dayDate}>{formatShortDate(day.date)}</div>
                  <div style={styles.dayMacros}>
                    P: {Math.round(day.proteinG)}g | C: {Math.round(day.carbsG)}g | F: {Math.round(day.fatG)}g
                  </div>
                </div>
                <div style={styles.dayCal}>{Math.round(day.calories)} cal</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
