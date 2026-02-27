'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { WorkoutCategory, MuscleGroup, WorkoutExerciseLibraryItem } from '@mylife/workouts';
import { WORKOUT_CATEGORIES, MUSCLE_GROUP_LABELS } from '@mylife/workouts';
import { fetchWorkoutExercises } from '../actions';
import { WorkoutBodyMapWeb } from './body-map-web';

const DIFFICULTY_DOTS: Record<string, string> = {
  beginner: '\u25CF\u25CB\u25CB',
  intermediate: '\u25CF\u25CF\u25CB',
  advanced: '\u25CF\u25CF\u25CF',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatMuscleGroups(groups: MuscleGroup[], max = 3): string {
  const labels = groups.map((g) => MUSCLE_GROUP_LABELS[g] ?? g);
  if (labels.length <= max) return labels.join(', ');
  return labels.slice(0, max).join(', ') + ` +${labels.length - max}`;
}

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<WorkoutExerciseLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  }, []);

  const handleToggleMuscle = useCallback((muscle: MuscleGroup) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle],
    );
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetchWorkoutExercises({
      search: debouncedSearch || undefined,
      category: selectedCategory,
      muscleGroups: selectedMuscles.length > 0 ? selectedMuscles : undefined,
      limit: 100,
    }).then((data) => {
      if (!active) return;
      setExercises(data);
      setLoading(false);
    });
    return () => { active = false; };
  }, [debouncedSearch, selectedCategory, selectedMuscles]);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Explore Exercises</h1>

      <div style={styles.layout}>
        {/* Left: Body Map */}
        <div style={styles.sidebar}>
          <WorkoutBodyMapWeb
            selectedMuscles={selectedMuscles}
            onToggleMuscle={handleToggleMuscle}
          />
        </div>

        {/* Right: Filters + Grid */}
        <div style={styles.main}>
          {/* Category pills */}
          <div style={styles.pillRow}>
            <button
              type="button"
              style={selectedCategory === null ? styles.pillActive : styles.pill}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {WORKOUT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                style={selectedCategory === cat ? styles.pillActive : styles.pill}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                {capitalize(cat)}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search exercises..."
            style={styles.searchInput}
          />

          {/* Exercise grid */}
          <div style={styles.grid}>
            {loading && exercises.length === 0 && (
              <div style={styles.empty}>Loading exercises...</div>
            )}
            {!loading && exercises.length === 0 && (
              <div style={styles.empty}>No exercises match your filters.</div>
            )}
            {exercises.map((ex) => (
              <Link
                key={ex.id}
                href={`/workouts/exercise/${ex.id}`}
                style={styles.card}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.cardName}>{ex.name}</span>
                  <span style={styles.categoryBadge}>{capitalize(ex.category)}</span>
                </div>
                <div style={styles.cardMeta}>
                  {DIFFICULTY_DOTS[ex.difficulty]} {capitalize(ex.difficulty)}
                </div>
                <div style={styles.cardMuscles}>
                  {formatMuscleGroups(ex.muscleGroups)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text)',
  },
  layout: {
    display: 'flex',
    gap: 24,
  },
  sidebar: {
    flexShrink: 0,
    width: 300,
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  pillRow: {
    display: 'flex',
    gap: 6,
    overflowX: 'auto' as const,
    paddingBottom: 4,
  },
  pill: {
    whiteSpace: 'nowrap' as const,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  pillActive: {
    whiteSpace: 'nowrap' as const,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: '999px',
    border: '1px solid #EF4444',
    background: 'rgba(239, 68, 68, 0.14)',
    color: '#EF4444',
    cursor: 'pointer',
    flexShrink: 0,
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 10,
  },
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    padding: 12,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--surface-elevated)',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    color: 'var(--text)',
    fontWeight: 600,
    fontSize: 14,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#EF4444',
    padding: '2px 8px',
    borderRadius: '999px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.08)',
    flexShrink: 0,
  },
  cardMeta: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  cardMuscles: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
  },
  empty: {
    gridColumn: '1 / -1',
    padding: 24,
    textAlign: 'center' as const,
    color: 'var(--text-tertiary)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
  },
};
