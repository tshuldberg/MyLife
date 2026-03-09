'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchDailySummary,
  fetchGoalProgress,
  fetchMealBreakdown,
  fetchFoodLogEntries,
  fetchFoodLogItems,
  fetchEatingWindow,
  doCreateFoodLogEntry,
  doDeleteFoodLogEntry,
  doAddFoodLogItem,
  doDeleteFoodLogItem,
} from './actions';

type DailySummary = Awaited<ReturnType<typeof fetchDailySummary>>;
type GoalProgress = Awaited<ReturnType<typeof fetchGoalProgress>>;
type MealBreakdownList = Awaited<ReturnType<typeof fetchMealBreakdown>>;
type EatingWindow = Awaited<ReturnType<typeof fetchEatingWindow>>;

interface LogEntry {
  id: string;
  date: string;
  mealType: string;
  notes: string | null;
  createdAt: string;
}

interface LogItem {
  id: string;
  logId: string;
  foodId: string;
  servingCount: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  dateRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem',
  },
  dateBtn: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', fontSize: '0.85rem',
    color: 'var(--text)', cursor: 'pointer',
  },
  dateLabel: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', minWidth: 120, textAlign: 'center' as const },
  statsRow: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' as const },
  statCard: {
    flex: '1 1 120px', background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', textAlign: 'center' as const,
  },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-nutrition)' },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' },
  progressBar: { marginTop: '0.5rem', height: 4, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden' as const },
  progressFill: { height: '100%', background: 'var(--accent-nutrition)', borderRadius: 2, transition: 'width 0.3s ease' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  mealCard: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '0.75rem',
  },
  mealHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem',
  },
  mealName: { fontWeight: 600, color: 'var(--accent-nutrition)', fontSize: '0.95rem' },
  mealCals: { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  itemRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.35rem 0', borderTop: '1px solid var(--border)',
  },
  itemName: { fontSize: '0.85rem', color: 'var(--text)' },
  itemMacros: { fontSize: '0.75rem', color: 'var(--text-tertiary)' },
  btnSmall: {
    background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer',
  },
  btnDanger: {
    background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer',
  },
  eatingWindow: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1.5rem',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
  },
  windowDot: { width: 10, height: 10, borderRadius: '50%' },
  windowText: { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  navGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem',
  },
  navCard: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', textDecoration: 'none', display: 'block',
  },
  navLabel: { fontWeight: 600, color: 'var(--accent-nutrition)', fontSize: '0.95rem' },
  navDesc: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  empty: { textAlign: 'center' as const, color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.9rem' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function NutritionDiaryPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [meals, setMeals] = useState<MealBreakdownList>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [entryItems, setEntryItems] = useState<Record<string, LogItem[]>>({});
  const [eatingWindow, setEatingWindow] = useState<EatingWindow>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, m, e, ew] = await Promise.all([
        fetchDailySummary(date),
        fetchGoalProgress(date),
        fetchMealBreakdown(date),
        fetchFoodLogEntries(date),
        fetchEatingWindow(),
      ]);
      setSummary(s);
      setProgress(p);
      setMeals(m);
      setEntries(e as LogEntry[]);
      setEatingWindow(ew);

      // Load items for each entry
      const items: Record<string, LogItem[]> = {};
      for (const entry of e as LogEntry[]) {
        items[entry.id] = (await fetchFoodLogItems(entry.id)) as LogItem[];
      }
      setEntryItems(items);
    } catch (err) {
      console.error('Failed to load nutrition data:', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };

  const isToday = date === new Date().toISOString().slice(0, 10);

  const handleAddMeal = async (mealType: string) => {
    const id = crypto.randomUUID();
    await doCreateFoodLogEntry(id, { date, mealType });
    await loadData();
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Delete this meal and all its items?')) return;
    await doDeleteFoodLogEntry(id);
    await loadData();
  };

  const handleDeleteItem = async (itemId: string) => {
    await doDeleteFoodLogItem(itemId);
    await loadData();
  };

  // Group entries by meal type
  const entriesByMeal = MEAL_ORDER.reduce<Record<string, LogEntry[]>>((acc, mt) => {
    acc[mt] = entries.filter((e) => e.mealType === mt);
    return acc;
  }, {});

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading nutrition diary...</div></div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Nutrition Diary</h1>
        <p style={styles.subtitle}>Track what you eat, hit your macros</p>
      </div>

      {/* Date Navigation */}
      <div style={styles.dateRow}>
        <button style={styles.dateBtn} onClick={() => changeDate(-1)}>Prev</button>
        <div style={styles.dateLabel}>{isToday ? 'Today' : formatDate(date)}</div>
        <button style={styles.dateBtn} onClick={() => changeDate(1)}>Next</button>
        {!isToday && (
          <button style={styles.dateBtn} onClick={() => setDate(new Date().toISOString().slice(0, 10))}>Today</button>
        )}
      </div>

      {/* Eating Window Indicator */}
      {eatingWindow && eatingWindow.isActive && (
        <div style={styles.eatingWindow}>
          <div style={{
            ...styles.windowDot,
            background: eatingWindow.eatingWindowStart && new Date() >= new Date(eatingWindow.eatingWindowStart)
              ? 'var(--success)' : 'var(--danger)',
          }} />
          <div style={styles.windowText}>
            {eatingWindow.eatingWindowStart
              ? `Eating window: ${new Date(eatingWindow.eatingWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${eatingWindow.eatingWindowEnd ? new Date(eatingWindow.eatingWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
              : `Fasting (${eatingWindow.targetHours}h target)`
            }
          </div>
        </div>
      )}

      {/* Daily Totals */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{Math.round(summary?.calories ?? 0)}</div>
          <div style={styles.statLabel}>Calories</div>
          {progress?.calories && (
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${Math.min(progress.calories.percentage, 100)}%` }} />
            </div>
          )}
          {progress?.calories && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
              {progress.calories.percentage}% of {progress.calories.goal}
            </div>
          )}
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#3B82F6' }}>{Math.round(summary?.proteinG ?? 0)}g</div>
          <div style={styles.statLabel}>Protein</div>
          {progress?.proteinG && (
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${Math.min(progress.proteinG.percentage, 100)}%`, background: '#3B82F6' }} />
            </div>
          )}
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#F59E0B' }}>{Math.round(summary?.carbsG ?? 0)}g</div>
          <div style={styles.statLabel}>Carbs</div>
          {progress?.carbsG && (
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${Math.min(progress.carbsG.percentage, 100)}%`, background: '#F59E0B' }} />
            </div>
          )}
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#EF4444' }}>{Math.round(summary?.fatG ?? 0)}g</div>
          <div style={styles.statLabel}>Fat</div>
          {progress?.fatG && (
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${Math.min(progress.fatG.percentage, 100)}%`, background: '#EF4444' }} />
            </div>
          )}
        </div>
      </div>

      {/* Meal Groups */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Meals</h2>
        {MEAL_ORDER.map((mealType) => {
          const mealEntries = entriesByMeal[mealType] ?? [];
          const mealStat = meals.find((m) => m.mealType === mealType);
          return (
            <div key={mealType} style={styles.mealCard}>
              <div style={styles.mealHeader}>
                <div style={styles.mealName}>{MEAL_LABELS[mealType]}</div>
                <div style={styles.mealCals}>
                  {mealStat ? `${Math.round(mealStat.calories)} cal` : '0 cal'}
                </div>
              </div>
              {mealEntries.map((entry) => {
                const items = entryItems[entry.id] ?? [];
                return (
                  <div key={entry.id}>
                    {items.map((item) => (
                      <div key={item.id} style={styles.itemRow}>
                        <div>
                          <div style={styles.itemName}>
                            {item.servingCount !== 1 ? `${item.servingCount}x ` : ''}Food
                          </div>
                          <div style={styles.itemMacros}>
                            {Math.round(item.calories)} cal | P: {Math.round(item.proteinG)}g | C: {Math.round(item.carbsG)}g | F: {Math.round(item.fatG)}g
                          </div>
                        </div>
                        <button style={styles.btnDanger} onClick={() => handleDeleteItem(item.id)}>Remove</button>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '0.25rem 0' }}>
                        No items logged
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Link href={`/nutrition/search?logId=${entry.id}&meal=${mealType}`} style={styles.btnSmall}>
                        + Add Food
                      </Link>
                      <button style={styles.btnDanger} onClick={() => handleDeleteEntry(entry.id)}>Delete Meal</button>
                    </div>
                  </div>
                );
              })}
              {mealEntries.length === 0 && (
                <button
                  style={{ ...styles.btnSmall, marginTop: '0.25rem' }}
                  onClick={() => handleAddMeal(mealType)}
                >
                  + Log {MEAL_LABELS[mealType]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>More</h2>
        <div style={styles.navGrid}>
          <Link href="/nutrition/search" style={styles.navCard}>
            <div style={styles.navLabel}>Search Foods</div>
            <div style={styles.navDesc}>Find and log foods</div>
          </Link>
          <Link href="/nutrition/dashboard" style={styles.navCard}>
            <div style={styles.navLabel}>Dashboard</div>
            <div style={styles.navDesc}>Macro rings and micronutrients</div>
          </Link>
          <Link href="/nutrition/trends" style={styles.navCard}>
            <div style={styles.navLabel}>Trends</div>
            <div style={styles.navDesc}>Calorie history and patterns</div>
          </Link>
          <Link href="/nutrition/settings" style={styles.navCard}>
            <div style={styles.navLabel}>Settings</div>
            <div style={styles.navDesc}>Goals, units, and export</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
