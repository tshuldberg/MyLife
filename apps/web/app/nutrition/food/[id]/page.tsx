'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchFoodById, fetchFoodNutrients, doDeleteFood } from '../../actions';

interface Food {
  id: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  source: string;
  barcode: string | null;
  usdaNdbNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FoodNutrientDetail {
  id: string;
  foodId: string;
  nutrientId: string;
  amount: number;
  name: string;
  unit: string;
  rda: number | null;
}

const SOURCE_LABELS: Record<string, string> = {
  usda: 'USDA Database',
  open_food_facts: 'Open Food Facts',
  fatsecret: 'FatSecret',
  custom: 'Custom Entry',
  ai_photo: 'AI Photo Estimate',
};

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 720, margin: '0 auto' },
  backLink: { fontSize: '0.85rem', color: 'var(--accent-nutrition)', marginBottom: '1rem', display: 'inline-block' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  brand: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  sourceBadge: {
    display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem',
    borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-tertiary)', marginTop: '0.5rem',
  },
  factsCard: {
    background: 'var(--surface-elevated)', border: '2px solid var(--accent-nutrition)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem',
  },
  factsTitle: { fontSize: '1.25rem', fontWeight: 700, borderBottom: '8px solid var(--accent-nutrition)', paddingBottom: '0.25rem', marginBottom: '0.25rem' },
  factsServing: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' },
  factsMajorRow: {
    display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0',
    borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '1rem',
  },
  factsRow: {
    display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0',
    borderBottom: '1px solid var(--border)', fontSize: '0.85rem',
  },
  factsSubRow: {
    display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0 0.25rem 1rem',
    borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)',
  },
  factsLabel: { color: 'var(--text)' },
  factsValue: { color: 'var(--text)', fontWeight: 500 },
  factsDv: { color: 'var(--text-tertiary)', fontSize: '0.75rem', marginLeft: '0.5rem' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  nutrientRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.4rem 0', borderBottom: '1px solid var(--border)',
  },
  nutrientName: { fontSize: '0.85rem', color: 'var(--text)' },
  nutrientAmount: { fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: 80, textAlign: 'right' as const },
  rdaBar: { width: 50, height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' as const, marginLeft: '0.5rem' },
  rdaFill: { height: '100%', background: 'var(--accent-nutrition)', borderRadius: 3 },
  metaRow: {
    display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0',
    borderBottom: '1px solid var(--border)', fontSize: '0.8rem',
  },
  metaKey: { color: 'var(--text-secondary)' },
  metaVal: { color: 'var(--text)' },
  actions: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  btnDanger: {
    background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-md)', padding: '0.5rem 1.25rem', fontSize: '0.85rem',
    fontWeight: 600, cursor: 'pointer',
  },
  empty: { textAlign: 'center' as const, color: 'var(--text-tertiary)', padding: '3rem', fontSize: '0.9rem' },
};

export default function FoodDetailPage() {
  const params = useParams();
  const foodId = params.id as string;

  const [food, setFood] = useState<Food | null>(null);
  const [nutrients, setNutrients] = useState<FoodNutrientDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [f, n] = await Promise.all([
        fetchFoodById(foodId),
        fetchFoodNutrients(foodId),
      ]);
      setFood(f as Food | null);
      setNutrients(n as FoodNutrientDetail[]);
    } catch (err) {
      console.error('Failed to load food:', err);
    } finally {
      setLoading(false);
    }
  }, [foodId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Delete this food? This cannot be undone.')) return;
    await doDeleteFood(foodId);
    window.location.href = '/nutrition/search';
  }, [foodId]);

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading food details...</div></div>;
  }

  if (!food) {
    return (
      <div style={styles.page}>
        <Link href="/nutrition/search" style={styles.backLink}>Back to Search</Link>
        <div style={styles.empty}>Food not found.</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Link href="/nutrition/search" style={styles.backLink}>Back to Search</Link>

      <div style={styles.header}>
        <h1 style={styles.title}>{food.name}</h1>
        {food.brand && <div style={styles.brand}>{food.brand}</div>}
        <div style={styles.sourceBadge}>{SOURCE_LABELS[food.source] ?? food.source}</div>
      </div>

      {/* Nutrition Facts Label */}
      <div style={styles.factsCard}>
        <div style={styles.factsTitle}>Nutrition Facts</div>
        <div style={styles.factsServing}>
          Serving Size: {food.servingSize} {food.servingUnit}
        </div>
        <div style={styles.factsMajorRow}>
          <span>Calories</span>
          <span>{Math.round(food.calories)}</span>
        </div>
        <div style={styles.factsRow}>
          <span style={styles.factsLabel}>Total Fat</span>
          <span style={styles.factsValue}>{food.fatG.toFixed(1)}g</span>
        </div>
        <div style={styles.factsRow}>
          <span style={styles.factsLabel}>Total Carbohydrates</span>
          <span style={styles.factsValue}>{food.carbsG.toFixed(1)}g</span>
        </div>
        <div style={styles.factsSubRow}>
          <span>Dietary Fiber</span>
          <span>{food.fiberG.toFixed(1)}g</span>
        </div>
        <div style={styles.factsSubRow}>
          <span>Total Sugars</span>
          <span>{food.sugarG.toFixed(1)}g</span>
        </div>
        <div style={styles.factsRow}>
          <span style={styles.factsLabel}>Protein</span>
          <span style={styles.factsValue}>{food.proteinG.toFixed(1)}g</span>
        </div>
        <div style={styles.factsRow}>
          <span style={styles.factsLabel}>Sodium</span>
          <span style={styles.factsValue}>{Math.round(food.sodiumMg)}mg</span>
        </div>
      </div>

      {/* Micronutrients */}
      {nutrients.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Micronutrients ({nutrients.length})</h2>
          <div style={{
            background: 'var(--surface-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
          }}>
            {nutrients.map((n) => {
              const pct = n.rda && n.rda > 0 ? Math.round((n.amount / n.rda) * 100) : null;
              return (
                <div key={n.id} style={styles.nutrientRow}>
                  <span style={styles.nutrientName}>{n.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={styles.nutrientAmount}>{n.amount.toFixed(1)} {n.unit}</span>
                    {pct !== null && (
                      <>
                        <div style={styles.rdaBar}>
                          <div style={{ ...styles.rdaFill, width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span style={styles.factsDv}>{pct}%</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Details</h2>
        <div style={{
          background: 'var(--surface-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
        }}>
          {food.barcode && (
            <div style={styles.metaRow}>
              <span style={styles.metaKey}>Barcode</span>
              <span style={styles.metaVal}>{food.barcode}</span>
            </div>
          )}
          {food.usdaNdbNumber && (
            <div style={styles.metaRow}>
              <span style={styles.metaKey}>USDA NDB #</span>
              <span style={styles.metaVal}>{food.usdaNdbNumber}</span>
            </div>
          )}
          <div style={styles.metaRow}>
            <span style={styles.metaKey}>Created</span>
            <span style={styles.metaVal}>{new Date(food.createdAt).toLocaleDateString()}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaKey}>Updated</span>
            <span style={styles.metaVal}>{new Date(food.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {(food.source === 'custom' || food.source === 'ai_photo') && (
        <div style={styles.actions}>
          <button style={styles.btnDanger} onClick={handleDelete}>Delete Food</button>
        </div>
      )}
    </div>
  );
}
