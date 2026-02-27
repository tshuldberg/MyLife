'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  WorkoutDifficulty,
  WorkoutExerciseEntry,
  WorkoutExerciseLibraryItem,
} from '@mylife/workouts';
import {
  fetchWorkout,
  fetchWorkoutExercises,
  doCreateWorkout,
  doUpdateWorkout,
} from '../actions';

const DIFFICULTIES: WorkoutDifficulty[] = ['beginner', 'intermediate', 'advanced'];

function estimateDuration(exercises: WorkoutExerciseEntry[]): number {
  let total = 0;
  for (const ex of exercises) {
    const setTime = ex.duration ?? (ex.reps ?? 10) * 3;
    total += ex.sets * setTime + (ex.sets - 1) * ex.restAfter;
  }
  return Math.ceil(total / 60);
}

export default function WorkoutBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty>('intermediate');
  const [exercises, setExercises] = useState<WorkoutExerciseEntry[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<WorkoutExerciseLibraryItem[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      const workout = await fetchWorkout(editId);
      if (cancelled || !workout) return;
      setTitle(workout.title);
      setDescription(workout.description);
      setDifficulty(workout.difficulty);
      setExercises(workout.exercises);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [editId]);

  const openExerciseModal = useCallback(async () => {
    const items = await fetchWorkoutExercises({ limit: 50 });
    setAvailableExercises(items);
    setExerciseSearch('');
    setShowExerciseModal(true);
  }, []);

  const addExercise = useCallback((item: WorkoutExerciseLibraryItem) => {
    const entry: WorkoutExerciseEntry = {
      exerciseId: item.id,
      name: item.name,
      category: item.category,
      sets: item.defaultSets,
      reps: item.defaultReps,
      duration: item.defaultDuration,
      restAfter: 30,
      order: exercises.length,
    };
    setExercises((prev) => [...prev, entry]);
    setShowExerciseModal(false);
  }, [exercises.length]);

  const updateExercise = useCallback((index: number, updates: Partial<WorkoutExerciseEntry>) => {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...updates } : ex)));
  }, []);

  const removeExercise = useCallback((index: number) => {
    setExercises((prev) =>
      prev.filter((_, i) => i !== index).map((ex, i) => ({ ...ex, order: i })),
    );
  }, []);

  const moveExercise = useCallback((index: number, direction: -1 | 1) => {
    setExercises((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((ex, i) => ({ ...ex, order: i }));
    });
  }, []);

  const handleSave = async () => {
    if (!title.trim() || exercises.length === 0) return;
    setSaving(true);
    try {
      const input = {
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty,
        exercises,
        estimatedDuration: estimateDuration(exercises),
      };
      if (editId) {
        await doUpdateWorkout(editId, input);
      } else {
        const id = crypto.randomUUID();
        await doCreateWorkout(id, input);
      }
      router.push('/workouts');
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = availableExercises.filter((item) =>
    item.name.toLowerCase().includes(exerciseSearch.toLowerCase()),
  );

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Loading workout...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link href="/workouts" style={styles.backLink}>&larr; Back</Link>
        <h1 style={styles.title}>{editId ? 'Edit Workout' : 'Create Workout'}</h1>
      </div>

      <div style={styles.formSection}>
        <label style={styles.label}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Workout name"
          style={styles.input}
        />
      </div>

      <div style={styles.formSection}>
        <label style={styles.label}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
          style={styles.textarea}
        />
      </div>

      <div style={styles.formSection}>
        <label style={styles.label}>Difficulty</label>
        <div style={styles.difficultyRow}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              style={{
                ...styles.difficultyBtn,
                ...(difficulty === d ? styles.difficultyBtnActive : {}),
              }}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.formSection}>
        <div style={styles.exercisesHeader}>
          <label style={styles.label}>Exercises ({exercises.length})</label>
          <button onClick={openExerciseModal} style={styles.addBtn}>
            + Add Exercise
          </button>
        </div>

        {exercises.length === 0 ? (
          <div style={styles.emptyExercises}>
            <p style={styles.emptyText}>No exercises added yet</p>
          </div>
        ) : (
          <div style={styles.exerciseList}>
            {exercises.map((ex, index) => (
              <div key={`${ex.exerciseId}-${index}`} style={styles.exerciseCard}>
                <div style={styles.exerciseTop}>
                  <div style={styles.exerciseInfo}>
                    <span style={styles.exerciseOrder}>{index + 1}</span>
                    <span style={styles.exerciseName}>{ex.name}</span>
                    <span style={styles.exerciseCategory}>{ex.category}</span>
                  </div>
                  <div style={styles.exerciseActions}>
                    <button
                      onClick={() => moveExercise(index, -1)}
                      disabled={index === 0}
                      style={{
                        ...styles.iconBtn,
                        opacity: index === 0 ? 0.3 : 1,
                      }}
                    >
                      &#9650;
                    </button>
                    <button
                      onClick={() => moveExercise(index, 1)}
                      disabled={index === exercises.length - 1}
                      style={{
                        ...styles.iconBtn,
                        opacity: index === exercises.length - 1 ? 0.3 : 1,
                      }}
                    >
                      &#9660;
                    </button>
                    <button
                      onClick={() => removeExercise(index)}
                      style={styles.removeBtn}
                    >
                      &times;
                    </button>
                  </div>
                </div>
                <div style={styles.exerciseInputs}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Sets</label>
                    <input
                      type="number"
                      min={1}
                      value={ex.sets}
                      onChange={(e) =>
                        updateExercise(index, { sets: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      style={styles.numberInput}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Reps</label>
                    <input
                      type="number"
                      min={0}
                      value={ex.reps ?? ''}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        updateExercise(index, { reps: isNaN(v) ? null : v });
                      }}
                      placeholder="-"
                      style={styles.numberInput}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Duration (s)</label>
                    <input
                      type="number"
                      min={0}
                      value={ex.duration ?? ''}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        updateExercise(index, { duration: isNaN(v) ? null : v });
                      }}
                      placeholder="-"
                      style={styles.numberInput}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Rest (s)</label>
                    <input
                      type="number"
                      min={0}
                      value={ex.restAfter}
                      onChange={(e) =>
                        updateExercise(index, { restAfter: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      style={styles.numberInput}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <Link href="/workouts" style={styles.cancelBtn}>
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim() || exercises.length === 0}
          style={{
            ...styles.saveBtn,
            opacity: saving || !title.trim() || exercises.length === 0 ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving...' : editId ? 'Update Workout' : 'Create Workout'}
        </button>
      </div>

      {showExerciseModal && (
        <div style={styles.modalOverlay} onClick={() => setShowExerciseModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Exercise</h2>
              <button onClick={() => setShowExerciseModal(false)} style={styles.modalClose}>
                &times;
              </button>
            </div>
            <input
              type="text"
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              placeholder="Search exercises..."
              style={styles.searchInput}
              autoFocus
            />
            <div style={styles.modalList}>
              {filteredExercises.length === 0 ? (
                <p style={styles.noResults}>No exercises found</p>
              ) : (
                filteredExercises.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addExercise(item)}
                    style={styles.modalItem}
                  >
                    <span style={styles.modalItemName}>{item.name}</span>
                    <span style={styles.modalItemMeta}>
                      {item.category} &middot; {item.difficulty}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ACCENT = '#EF4444';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '24px',
  },
  loadingText: {
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    padding: '64px 0',
  },
  header: {
    marginBottom: '32px',
  },
  backLink: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  formSection: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    color: 'var(--text)',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    color: 'var(--text)',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  difficultyRow: {
    display: 'flex',
    gap: '8px',
  },
  difficultyBtn: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    textTransform: 'capitalize' as const,
  },
  difficultyBtnActive: {
    color: '#fff',
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  exercisesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  addBtn: {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: ACCENT,
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  },
  emptyExercises: {
    padding: '32px',
    textAlign: 'center' as const,
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
  emptyText: {
    color: 'var(--text-tertiary)',
    fontSize: '14px',
    margin: 0,
  },
  exerciseList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  exerciseCard: {
    padding: '14px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
  exerciseTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  exerciseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  exerciseOrder: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    color: '#fff',
    backgroundColor: ACCENT,
    borderRadius: '50%',
    flexShrink: 0,
  },
  exerciseName: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  exerciseCategory: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textTransform: 'capitalize' as const,
  },
  exerciseActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  iconBtn: {
    padding: '4px 6px',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    lineHeight: 1,
  },
  removeBtn: {
    padding: '4px 8px',
    fontSize: '16px',
    color: 'var(--danger)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    lineHeight: 1,
    marginLeft: '4px',
  },
  exerciseInputs: {
    display: 'flex',
    gap: '12px',
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
  },
  numberInput: {
    width: '100%',
    padding: '6px 8px',
    fontSize: '14px',
    color: 'var(--text)',
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    textAlign: 'center' as const,
    boxSizing: 'border-box' as const,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid var(--border)',
  },
  cancelBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  saveBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: ACCENT,
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '480px',
    maxHeight: '70vh',
    backgroundColor: 'var(--surface-elevated)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  modalClose: {
    fontSize: '20px',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: 1,
  },
  searchInput: {
    margin: '12px 20px',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'var(--text)',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
  },
  modalList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '0 20px 16px',
  },
  noResults: {
    color: 'var(--text-tertiary)',
    fontSize: '14px',
    textAlign: 'center' as const,
    padding: '24px 0',
  },
  modalItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    marginBottom: '6px',
    textAlign: 'left' as const,
  },
  modalItemName: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
  },
  modalItemMeta: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textTransform: 'capitalize' as const,
  },
};
