'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doSearchFoods, doAddFoodLogItem } from '../actions';

interface FoodResult {
  id: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: string;
}

type TabKey = 'all' | 'usda' | 'custom' | 'recent';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'usda', label: 'USDA' },
  { key: 'custom', label: 'Custom' },
  { key: 'recent', label: 'Recent' },
];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  searchRow: {
    display: 'flex', gap: '0.75rem', marginBottom: '1rem',
  },
  input: {
    flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '0.6rem 1rem', fontSize: '0.9rem',
    color: 'var(--text)', outline: 'none',
  },
  btnPrimary: {
    background: 'var(--accent-nutrition)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', padding: '0.6rem 1.25rem', fontSize: '0.85rem',
    fontWeight: 600, cursor: 'pointer',
  },
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
  resultCard: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '0.5rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  foodName: { fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' },
  foodBrand: { fontSize: '0.8rem', color: 'var(--text-tertiary)' },
  foodMacros: { fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' },
  foodCal: { fontSize: '1rem', fontWeight: 700, color: 'var(--accent-nutrition)', textAlign: 'right' as const },
  foodServing: { fontSize: '0.7rem', color: 'var(--text-tertiary)', textAlign: 'right' as const },
  actions: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  btnSmall: {
    background: 'var(--accent-nutrition)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.65rem', fontSize: '0.75rem',
    fontWeight: 600, cursor: 'pointer',
  },
  empty: { textAlign: 'center' as const, color: 'var(--text-tertiary)', padding: '3rem', fontSize: '0.9rem' },
  sourceBadge: {
    fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.4rem',
    borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-tertiary)', textTransform: 'uppercase' as const,
  },
  backLink: { fontSize: '0.85rem', color: 'var(--accent-nutrition)', marginBottom: '1rem', display: 'inline-block' },
};

export default function NutritionSearchPage() {
  const searchParams = useSearchParams();
  const logId = searchParams.get('logId');
  const mealType = searchParams.get('meal');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const foods = await doSearchFoods(q, 50);
      setResults(foods as FoodResult[]);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleAddToLog = useCallback(async (food: FoodResult) => {
    if (!logId) return;
    const itemId = crypto.randomUUID();
    await doAddFoodLogItem(itemId, {
      logId,
      foodId: food.id,
      servingCount: 1,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
    });
    setAddedIds((prev) => new Set(prev).add(food.id));
  }, [logId]);

  const filteredResults = results.filter((f) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'usda') return f.source === 'usda';
    if (activeTab === 'custom') return f.source === 'custom' || f.source === 'ai_photo';
    if (activeTab === 'recent') return true; // Recent filtering would need timestamp logic
    return true;
  });

  return (
    <div style={styles.page}>
      <Link href="/nutrition" style={styles.backLink}>Back to Diary</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Search Foods</h1>
        <p style={styles.subtitle}>
          {logId && mealType
            ? `Adding to ${mealType}`
            : 'Search the food database'}
        </p>
      </div>

      <div style={styles.searchRow}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search foods..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button style={styles.btnPrimary} onClick={handleSearch} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            style={activeTab === tab.key ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredResults.length === 0 && !searching && (
        <div style={styles.empty}>
          {query.trim() ? 'No results found. Try a different search term.' : 'Type a food name and press Search.'}
        </div>
      )}

      {filteredResults.map((food) => (
        <div key={food.id} style={styles.resultCard}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={styles.foodName}>{food.name}</span>
              <span style={styles.sourceBadge}>{food.source}</span>
            </div>
            {food.brand && <div style={styles.foodBrand}>{food.brand}</div>}
            <div style={styles.foodMacros}>
              P: {Math.round(food.proteinG)}g | C: {Math.round(food.carbsG)}g | F: {Math.round(food.fatG)}g
            </div>
          </div>
          <div style={styles.actions}>
            <div>
              <div style={styles.foodCal}>{Math.round(food.calories)}</div>
              <div style={styles.foodServing}>{food.servingSize} {food.servingUnit}</div>
            </div>
            {logId && (
              <button
                style={{
                  ...styles.btnSmall,
                  ...(addedIds.has(food.id) ? { background: 'var(--success)' } : {}),
                }}
                onClick={() => handleAddToLog(food)}
                disabled={addedIds.has(food.id)}
              >
                {addedIds.has(food.id) ? 'Added' : 'Add'}
              </button>
            )}
            <Link
              href={`/nutrition/food/${food.id}`}
              style={{ ...styles.btnSmall, background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', textDecoration: 'none' }}
            >
              Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
