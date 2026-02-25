'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  fetchRecipes,
  fetchRecipeCount,
  doCreateRecipe,
  doUpdateRecipe,
  doDeleteRecipe,
} from './actions';

type Recipe = {
  id: string;
  title: string;
  description: string | null;
  servings: number | null;
  prep_time_mins: number | null;
  cook_time_mins: number | null;
  total_time_mins: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  source_url: string | null;
  image_uri: string | null;
  is_favorite: number;
  rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '2rem',
    maxWidth: 960,
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
    color: 'var(--text-tertiary)',
    marginTop: '0.25rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text)',
    fontSize: '0.875rem',
    outline: 'none',
    marginBottom: '1.5rem',
  },
  topGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  card: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
  },
  cardTitle: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  statValue: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: 'var(--accent-recipes)',
  },
  formGroup: {
    marginBottom: '0.75rem',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: '0.875rem',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: '0.875rem',
    outline: 'none',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  btnPrimary: {
    width: '100%',
    padding: '0.625rem',
    background: 'var(--accent-recipes)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
  listSection: {
    marginTop: '0.5rem',
  },
  listTitle: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  recipeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.875rem 1rem',
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '0.5rem',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '0.25rem',
  },
  recipeMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.8125rem',
    color: 'var(--text-tertiary)',
  },
  difficultyBadge: {
    padding: '0.125rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  stars: {
    color: 'var(--accent-recipes)',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: '1rem',
  },
  btnIcon: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.25rem',
    color: 'var(--text-tertiary)',
  },
  btnDanger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.25rem',
    color: 'var(--danger)',
  },
  editOverlay: {
    background: 'var(--surface)',
    border: '1px solid var(--accent-recipes)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem',
    marginBottom: '0.5rem',
  },
  editActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
  btnSave: {
    padding: '0.5rem 1rem',
    background: 'var(--accent-recipes)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    fontSize: '0.8125rem',
    cursor: 'pointer',
  },
  btnCancel: {
    padding: '0.5rem 1rem',
    background: 'var(--surface-elevated)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    fontSize: '0.8125rem',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    color: 'var(--text-tertiary)',
    fontSize: '0.875rem',
  },
  confirmOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  confirmBox: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    maxWidth: 360,
    width: '90%',
  },
  confirmTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '0.5rem',
  },
  confirmText: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '1.25rem',
  },
  confirmActions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  btnConfirmDelete: {
    padding: '0.5rem 1rem',
    background: 'var(--danger)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    fontSize: '0.8125rem',
    cursor: 'pointer',
  },
};

function renderStars(rating: number | null): string {
  if (rating == null || rating === 0) return '';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(empty);
}

function formatTime(mins: number | null): string {
  if (mins == null) return '';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [search, setSearch] = useState('');

  // New recipe form
  const [newTitle, setNewTitle] = useState('');
  const [newServings, setNewServings] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('');
  const [newPrepTime, setNewPrepTime] = useState('');
  const [newCookTime, setNewCookTime] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editServings, setEditServings] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('');
  const [editPrepTime, setEditPrepTime] = useState('');
  const [editCookTime, setEditCookTime] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);

  const load = useCallback(async () => {
    const filters = search ? { search } : undefined;
    const [list, total, favList] = await Promise.all([
      fetchRecipes(filters),
      fetchRecipeCount(),
      fetchRecipes({ is_favorite: true }),
    ]);
    setRecipes(list as Recipe[]);
    setTotalCount(total);
    setFavCount((favList as Recipe[]).length);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Create ────────────────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    const title = newTitle.trim();
    if (!title) return;

    const id = crypto.randomUUID();
    const prepMins = newPrepTime ? parseInt(newPrepTime, 10) : undefined;
    const cookMins = newCookTime ? parseInt(newCookTime, 10) : undefined;
    const totalMins =
      prepMins != null && cookMins != null ? prepMins + cookMins : prepMins ?? cookMins;

    await doCreateRecipe(id, {
      title,
      servings: newServings ? parseInt(newServings, 10) : undefined,
      difficulty: newDifficulty || undefined,
      prep_time_mins: prepMins,
      cook_time_mins: cookMins,
      total_time_mins: totalMins,
    });

    setNewTitle('');
    setNewServings('');
    setNewDifficulty('');
    setNewPrepTime('');
    setNewCookTime('');
    load();
  }, [newTitle, newServings, newDifficulty, newPrepTime, newCookTime, load]);

  // ── Edit ──────────────────────────────────────────────────────────

  const startEdit = useCallback((r: Recipe) => {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditServings(r.servings != null ? String(r.servings) : '');
    setEditDifficulty(r.difficulty ?? '');
    setEditPrepTime(r.prep_time_mins != null ? String(r.prep_time_mins) : '');
    setEditCookTime(r.cook_time_mins != null ? String(r.cook_time_mins) : '');
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (!title) return;

    const prepMins = editPrepTime ? parseInt(editPrepTime, 10) : undefined;
    const cookMins = editCookTime ? parseInt(editCookTime, 10) : undefined;
    const totalMins =
      prepMins != null && cookMins != null ? prepMins + cookMins : prepMins ?? cookMins;

    await doUpdateRecipe(editingId, {
      title,
      servings: editServings ? parseInt(editServings, 10) : undefined,
      difficulty: editDifficulty || undefined,
      prep_time_mins: prepMins,
      cook_time_mins: cookMins,
      total_time_mins: totalMins,
    });

    setEditingId(null);
    load();
  }, [editingId, editTitle, editServings, editDifficulty, editPrepTime, editCookTime, load]);

  // ── Favorite toggle ───────────────────────────────────────────────

  const toggleFavorite = useCallback(
    async (r: Recipe) => {
      await doUpdateRecipe(r.id, { is_favorite: r.is_favorite ? 0 : 1 });
      load();
    },
    [load],
  );

  // ── Delete ────────────────────────────────────────────────────────

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await doDeleteRecipe(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }, [deleteTarget, load]);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Recipes</h1>
        <p style={styles.subtitle}>
          {totalCount} recipe{totalCount !== 1 ? 's' : ''} in your collection
        </p>
      </div>

      {/* Search */}
      <input
        style={styles.searchInput}
        type="text"
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Top Grid: Summary + New Recipe */}
      <div style={styles.topGrid}>
        {/* Summary Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Summary</div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Total Recipes</span>
            <span style={styles.statValue}>{totalCount}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Favorites</span>
            <span style={styles.statValue}>{favCount}</span>
          </div>
        </div>

        {/* New Recipe Form */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>New Recipe</div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Recipe name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Servings</label>
              <input
                style={styles.input}
                type="number"
                placeholder="4"
                value={newServings}
                onChange={(e) => setNewServings(e.target.value)}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Difficulty</label>
              <select
                style={styles.select}
                value={newDifficulty}
                onChange={(e) =>
                  setNewDifficulty(e.target.value as 'easy' | 'medium' | 'hard' | '')
                }
              >
                <option value="">--</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Prep Time (min)</label>
              <input
                style={styles.input}
                type="number"
                placeholder="15"
                value={newPrepTime}
                onChange={(e) => setNewPrepTime(e.target.value)}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Cook Time (min)</label>
              <input
                style={styles.input}
                type="number"
                placeholder="30"
                value={newCookTime}
                onChange={(e) => setNewCookTime(e.target.value)}
              />
            </div>
          </div>
          <button style={styles.btnPrimary} onClick={handleCreate}>
            Add Recipe
          </button>
        </div>
      </div>

      {/* Recipe List */}
      <div style={styles.listSection}>
        <div style={styles.listTitle}>All Recipes</div>

        {recipes.length === 0 && (
          <div style={styles.emptyState}>
            {search ? 'No recipes match your search.' : 'No recipes yet. Add your first one above!'}
          </div>
        )}

        {recipes.map((r) =>
          editingId === r.id ? (
            /* ── Inline Edit ─────────────────────────────── */
            <div key={r.id} style={styles.editOverlay}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title</label>
                <input
                  style={styles.input}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Servings</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={editServings}
                    onChange={(e) => setEditServings(e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Difficulty</label>
                  <select
                    style={styles.select}
                    value={editDifficulty}
                    onChange={(e) =>
                      setEditDifficulty(e.target.value as 'easy' | 'medium' | 'hard' | '')
                    }
                  >
                    <option value="">--</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Prep Time (min)</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={editPrepTime}
                    onChange={(e) => setEditPrepTime(e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Cook Time (min)</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={editCookTime}
                    onChange={(e) => setEditCookTime(e.target.value)}
                  />
                </div>
              </div>
              <div style={styles.editActions}>
                <button style={styles.btnSave} onClick={saveEdit}>
                  Save
                </button>
                <button style={styles.btnCancel} onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── Recipe Row ──────────────────────────────── */
            <div key={r.id} style={styles.recipeRow}>
              <div style={styles.recipeInfo}>
                <div style={styles.recipeTitle}>{r.title}</div>
                <div style={styles.recipeMeta}>
                  {r.difficulty && (
                    <span
                      style={{
                        ...styles.difficultyBadge,
                        background: `${DIFFICULTY_COLORS[r.difficulty]}22`,
                        color: DIFFICULTY_COLORS[r.difficulty],
                      }}
                    >
                      {r.difficulty}
                    </span>
                  )}
                  {(r.prep_time_mins != null || r.cook_time_mins != null) && (
                    <span>
                      {r.prep_time_mins != null && `Prep ${formatTime(r.prep_time_mins)}`}
                      {r.prep_time_mins != null && r.cook_time_mins != null && ' / '}
                      {r.cook_time_mins != null && `Cook ${formatTime(r.cook_time_mins)}`}
                    </span>
                  )}
                  {r.servings != null && <span>{r.servings} servings</span>}
                  {r.rating != null && r.rating > 0 && (
                    <span style={styles.stars}>{renderStars(r.rating)}</span>
                  )}
                </div>
              </div>
              <div style={styles.actions}>
                <button
                  style={styles.btnIcon}
                  onClick={() => toggleFavorite(r)}
                  title={r.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {r.is_favorite ? '\u2764\uFE0F' : '\u2661'}
                </button>
                <button style={styles.btnIcon} onClick={() => startEdit(r)} title="Edit">
                  \u270E
                </button>
                <button
                  style={styles.btnDanger}
                  onClick={() => setDeleteTarget(r)}
                  title="Delete"
                >
                  \u2715
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div style={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmTitle}>Delete Recipe</div>
            <div style={styles.confirmText}>
              Are you sure you want to delete &ldquo;{deleteTarget.title}&rdquo;? This action
              cannot be undone.
            </div>
            <div style={styles.confirmActions}>
              <button style={styles.btnCancel} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button style={styles.btnConfirmDelete} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
