'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { SurfSpot } from '@mylife/surf';
import {
  doToggleSurfFavorite,
  fetchSurfDaySummaries,
  fetchSurfFavoriteSpots,
  type SurfDaySummary,
} from '../actions';
import { SurfShell } from '../components/SurfShell';

interface FavoriteWithDay {
  spot: SurfSpot;
  day: SurfDaySummary | null;
}

export default function SurfFavoritesPage() {
  const [rows, setRows] = useState<FavoriteWithDay[]>([]);

  const loadFavorites = useCallback(async () => {
    const favorites = await fetchSurfFavoriteSpots();
    const next = await Promise.all(
      favorites.map(async (spot) => ({
        spot,
        day: (await fetchSurfDaySummaries(spot.id, 1))[0] ?? null,
      })),
    );
    setRows(next);
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const averageRating = useMemo(() => {
    const values = rows.map((row) => row.day?.rating).filter((value): value is number => typeof value === 'number');
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [rows]);

  return (
    <SurfShell subtitle="Saved spots with daily quality and quick access">
      <div style={styles.summaryCard}>
        <div style={styles.metric}><span style={styles.metricLabel}>Saved Spots</span><span style={styles.metricValue}>{rows.length}</span></div>
        <div style={styles.metric}><span style={styles.metricLabel}>Avg Quality</span><span style={styles.metricValue}>{rows.length ? averageRating.toFixed(1) : '--'}</span></div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Favorite Spots</h2>
        <div style={styles.list}>
          {rows.map((row) => (
            <div key={row.spot.id} style={styles.item}>
              <div>
                <Link href={`/surf/spot/${row.spot.id}`} style={styles.link}>{row.spot.name}</Link>
                <div style={styles.meta}>
                  {row.spot.region} · {row.spot.breakType}
                  {row.day ? ` · ${row.day.waveHeightMin.toFixed(1)}-${row.day.waveHeightMax.toFixed(1)} ft · ${row.day.windKtsAvg.toFixed(0)} kts` : ''}
                </div>
              </div>
              <button
                style={styles.removeButton}
                onClick={() => void doToggleSurfFavorite(row.spot.id).then(loadFavorites)}
              >
                Remove
              </button>
            </div>
          ))}
          {rows.length === 0 && (
            <div style={styles.empty}>No favorites yet. Favorite spots from Home or Map.</div>
          )}
        </div>
      </div>
    </SurfShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  summaryCard: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    padding: 14,
    display: 'flex',
    gap: 18,
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metricLabel: {
    color: 'var(--text-tertiary)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricValue: {
    color: '#3B82F6',
    fontSize: 20,
    fontWeight: 700,
  },
  section: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    padding: 16,
  },
  heading: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 600,
  },
  list: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-elevated)',
    padding: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  link: {
    color: 'var(--text)',
    textDecoration: 'none',
    fontWeight: 600,
  },
  meta: {
    marginTop: 2,
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  removeButton: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    padding: '7px 10px',
    cursor: 'pointer',
  },
  empty: {
    padding: 14,
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
  },
};
