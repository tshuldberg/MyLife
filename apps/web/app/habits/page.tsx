'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  fetchHabits,
  fetchHabitCount,
  fetchCompletionsForDate,
  fetchStreaks,
  doCreateHabit,
  doUpdateHabit,
  doDeleteHabit,
  doRecordCompletion,
  doDeleteCompletion,
} from './actions';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  unit: string | null;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Completion {
  id: string;
  habitId: string;
  completedAt: string;
  value: number | null;
  notes: string | null;
  createdAt: string;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '2rem',
    maxWidth: 900,
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  statsRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    flex: 1,
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--accent-habits)',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginTop: '0.25rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '0.75rem',
  },
  checklistCard: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-sm)',
    border: '2px solid var(--border)',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    flexShrink: 0,
  },
  checkBtnDone: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-sm)',
    border: '2px solid var(--accent-habits)',
    background: 'var(--accent-habits)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    color: '#fff',
    flexShrink: 0,
  },
  checklistName: {
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: 'var(--text)',
    flex: 1,
  },
  checklistNameDone: {
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    flex: 1,
    textDecoration: 'line-through',
  },
  habitCard: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem 1.25rem',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  habitMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginTop: '0.125rem',
  },
  badge: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    padding: '0.125rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    color: 'var(--accent-habits)',
    border: '1px solid var(--border)',
    textTransform: 'uppercase' as const,
  },
  streakText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap' as const,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: 'var(--text-tertiary)',
    padding: '0.25rem',
  },
  dangerBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: 'var(--danger)',
    padding: '0.25rem',
  },
  formCard: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
  },
  formRow: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    alignItems: 'flex-end',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    flex: 1,
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  input: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 0.75rem',
    color: 'var(--text)',
    fontSize: '0.875rem',
    outline: 'none',
  },
  select: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 0.75rem',
    color: 'var(--text)',
    fontSize: '0.875rem',
    outline: 'none',
  },
  primaryBtn: {
    background: 'var(--accent-habits)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 1.25rem',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 1rem',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  editRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flex: 1,
  },
  editInput: {
    background: 'var(--surface)',
    border: '1px solid var(--accent-habits)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.375rem 0.625rem',
    color: 'var(--text)',
    fontSize: '0.875rem',
    outline: 'none',
    flex: 1,
  },
  editSelect: {
    background: 'var(--surface)',
    border: '1px solid var(--accent-habits)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.375rem 0.625rem',
    color: 'var(--text)',
    fontSize: '0.875rem',
    outline: 'none',
    width: 110,
  },
  editNumberInput: {
    background: 'var(--surface)',
    border: '1px solid var(--accent-habits)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.375rem 0.625rem',
    color: 'var(--text)',
    fontSize: '0.875rem',
    outline: 'none',
    width: 70,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    color: 'var(--text-tertiary)',
    fontSize: '0.875rem',
  },
  showArchived: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    color: 'var(--text-tertiary)',
    textDecoration: 'underline',
    padding: 0,
    marginTop: '1rem',
  },
};

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [streaks, setStreaks] = useState<Record<string, StreakInfo>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFrequency, setEditFrequency] = useState('daily');
  const [editTarget, setEditTarget] = useState(1);
  const [newName, setNewName] = useState('');
  const [newFrequency, setNewFrequency] = useState('daily');
  const [newTarget, setNewTarget] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(async () => {
    const [habitList, count, todayCompletions] = await Promise.all([
      fetchHabits({ isArchived: showArchived }),
      fetchHabitCount(),
      fetchCompletionsForDate(today),
    ]);
    setHabits(habitList as Habit[]);
    setTotalCount(count);
    setCompletions(todayCompletions as Completion[]);

    const streakMap: Record<string, StreakInfo> = {};
    await Promise.all(
      (habitList as Habit[]).map(async (h) => {
        streakMap[h.id] = (await fetchStreaks(h.id)) as StreakInfo;
      }),
    );
    setStreaks(streakMap);
  }, [showArchived, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeHabits = habits.filter((h) => !h.isArchived);
  const completedHabitIds = new Set(completions.map((c) => c.habitId));
  const completedTodayCount = activeHabits.filter((h) =>
    completedHabitIds.has(h.id),
  ).length;

  const handleToggleCompletion = useCallback(
    async (habitId: string) => {
      const existing = completions.find((c) => c.habitId === habitId);
      if (existing) {
        await doDeleteCompletion(existing.id);
      } else {
        const id = crypto.randomUUID();
        await doRecordCompletion(id, habitId, today);
      }
      await loadData();
    },
    [completions, today, loadData],
  );

  const handleCreate = useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    await doCreateHabit(id, {
      name: trimmed,
      frequency: newFrequency,
      targetCount: newTarget,
    });
    setNewName('');
    setNewFrequency('daily');
    setNewTarget(1);
    await loadData();
  }, [newName, newFrequency, newTarget, loadData]);

  const handleStartEdit = useCallback((habit: Habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditFrequency(habit.frequency);
    setEditTarget(habit.targetCount);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    await doUpdateHabit(editingId, {
      name: editName.trim(),
      frequency: editFrequency,
      targetCount: editTarget,
    });
    setEditingId(null);
    await loadData();
  }, [editingId, editName, editFrequency, editTarget, loadData]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleToggleArchive = useCallback(
    async (habit: Habit) => {
      await doUpdateHabit(habit.id, { isArchived: !habit.isArchived });
      await loadData();
    },
    [loadData],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await doDeleteHabit(id);
      setConfirmDeleteId(null);
      await loadData();
    },
    [loadData],
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Habits</h1>
        <div style={styles.subtitle}>{formatToday()}</div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{totalCount}</div>
          <div style={styles.statLabel}>Total Habits</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{completedTodayCount}</div>
          <div style={styles.statLabel}>Completed Today</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {activeHabits.length > 0
              ? Math.round((completedTodayCount / activeHabits.length) * 100)
              : 0}
            %
          </div>
          <div style={styles.statLabel}>Today&apos;s Progress</div>
        </div>
      </div>

      {/* Today's Checklist */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Today&apos;s Checklist</div>
        {activeHabits.length === 0 && (
          <div style={styles.emptyState}>
            No active habits yet. Create one below to get started.
          </div>
        )}
        {activeHabits.map((habit) => {
          const done = completedHabitIds.has(habit.id);
          return (
            <div key={habit.id} style={styles.checklistCard}>
              <button
                style={done ? styles.checkBtnDone : styles.checkBtn}
                onClick={() => handleToggleCompletion(habit.id)}
                title={done ? 'Mark incomplete' : 'Mark complete'}
              >
                {done ? '✓' : ''}
              </button>
              <span style={done ? styles.checklistNameDone : styles.checklistName}>
                {habit.icon ? `${habit.icon} ` : ''}
                {habit.name}
              </span>
              <span style={styles.badge}>{habit.frequency}</span>
            </div>
          );
        })}
      </div>

      {/* Habit List */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          {showArchived ? 'Archived Habits' : 'All Habits'}
        </div>
        {habits.length === 0 && (
          <div style={styles.emptyState}>
            {showArchived
              ? 'No archived habits.'
              : 'No habits yet. Create your first habit below.'}
          </div>
        )}
        {habits.map((habit) => {
          const streak = streaks[habit.id];

          if (editingId === habit.id) {
            return (
              <div key={habit.id} style={styles.habitCard}>
                <div style={styles.editRow}>
                  <input
                    style={styles.editInput}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Habit name"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  />
                  <select
                    style={styles.editSelect}
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <input
                    style={styles.editNumberInput}
                    type="number"
                    min={1}
                    value={editTarget}
                    onChange={(e) => setEditTarget(Number(e.target.value))}
                  />
                </div>
                <div style={styles.actions}>
                  <button style={styles.primaryBtn} onClick={handleSaveEdit}>
                    Save
                  </button>
                  <button style={styles.secondaryBtn} onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={habit.id} style={styles.habitCard}>
              <div style={styles.habitInfo}>
                <div style={styles.habitName}>
                  {habit.icon ? `${habit.icon} ` : ''}
                  {habit.name}
                </div>
                <div style={styles.habitMeta}>
                  Target: {habit.targetCount}x {habit.frequency}
                  {streak
                    ? ` · Streak: ${streak.currentStreak}d (best: ${streak.longestStreak}d)`
                    : ''}
                </div>
              </div>
              <span style={styles.badge}>{habit.frequency}</span>
              {streak && (
                <span style={styles.streakText}>
                  {streak.currentStreak}d
                </span>
              )}
              <div style={styles.actions}>
                <button
                  style={styles.iconBtn}
                  onClick={() => handleStartEdit(habit)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  style={styles.iconBtn}
                  onClick={() => handleToggleArchive(habit)}
                  title={habit.isArchived ? 'Unarchive' : 'Archive'}
                >
                  {habit.isArchived ? '📥' : '📦'}
                </button>
                {confirmDeleteId === habit.id ? (
                  <>
                    <button
                      style={styles.dangerBtn}
                      onClick={() => handleDelete(habit.id)}
                      title="Confirm delete"
                    >
                      Confirm
                    </button>
                    <button
                      style={styles.iconBtn}
                      onClick={() => setConfirmDeleteId(null)}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    style={styles.dangerBtn}
                    onClick={() => setConfirmDeleteId(habit.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <button
          style={styles.showArchived}
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? 'Show active habits' : 'Show archived habits'}
        </button>
      </div>

      {/* New Habit Form */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>New Habit</div>
        <div style={styles.formCard}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <input
                style={styles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Meditate, Read, Exercise"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Frequency</label>
              <select
                style={styles.select}
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Target Count</label>
              <input
                style={styles.input}
                type="number"
                min={1}
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
              />
            </div>
          </div>
          <button style={styles.primaryBtn} onClick={handleCreate}>
            Add Habit
          </button>
        </div>
      </div>
    </div>
  );
}
