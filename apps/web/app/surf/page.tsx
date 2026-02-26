'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  doToggleSurfFavorite,
  fetchSurfHomeCards,
  fetchSurfOverview,
  fetchSurfRegionalNarrative,
  type SurfDaySummary,
  type SurfNarrative,
  type SurfSpotHomeCard,
} from './actions';
import { SurfShell } from './components/SurfShell';

export default function SurfPage() {
  const [overview, setOverview] = useState({
    spots: 0,
    favorites: 0,
    averageWaveHeightFt: 0,
    sessions: 0,
  });
  const [cards, setCards] = useState<SurfSpotHomeCard[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [narrative, setNarrative] = useState<SurfNarrative | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [nextOverview, nextCards] = await Promise.all([
      fetchSurfOverview(),
      fetchSurfHomeCards(),
    ]);

    setOverview(nextOverview);
    setCards(nextCards);

    const region = nextCards[0]?.spot.region;
    const nextNarrative = await fetchSurfRegionalNarrative({ region });
    setNarrative(nextNarrative);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const dayOptions = useMemo(() => {
    const first = cards[0];
    return first?.days ?? [];
  }, [cards]);

  const hasData = cards.length > 0;

  return (
    <SurfShell subtitle="Forecast home with regional narrative and spot scoring">
      <div style={styles.summaryGrid}>
        <MetricCard label="Tracked Spots" value={String(overview.spots)} />
        <MetricCard label="Favorites" value={String(overview.favorites)} />
        <MetricCard label="Avg Wave Height" value={`${overview.averageWaveHeightFt.toFixed(1)} ft`} />
        <MetricCard label="Sessions Logged" value={String(overview.sessions)} />
      </div>

      <div style={styles.quickLinks}>
        <Link href="/surf/map" style={styles.quickLink}>Open Map + Pin</Link>
        <Link href="/surf/sessions" style={styles.quickLink}>Log Sessions</Link>
        <Link href="/surf/favorites" style={styles.quickLink}>Manage Favorites</Link>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Regional Narrative</h2>
        {!narrative ? (
          <div style={styles.empty}>Generating narrative...</div>
        ) : (
          <div style={styles.narrativeCard}>
            <div style={styles.narrativeSummary}>{narrative.summary}</div>
            <div style={styles.narrativeBody}>{narrative.body}</div>
            <div style={styles.narrativeMeta}>
              {new Date(narrative.generatedAt).toLocaleString()} · Helpful {narrative.helpfulVotes} · Not helpful {narrative.unhelpfulVotes}
            </div>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Daily Spot View</h2>
          <div style={styles.dayRow}>
            {dayOptions.map((day, index) => (
              <button
                key={day.date}
                style={selectedDay === index ? styles.dayChipActive : styles.dayChip}
                onClick={() => setSelectedDay(index)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.list}>
          {!hasData && loading && <div style={styles.empty}>Loading spot forecasts...</div>}
          {!hasData && !loading && <div style={styles.empty}>No spots found. Add one from Map.</div>}

          {cards.map((card) => {
            const day = card.days[selectedDay] ?? card.days[0];
            if (!day) return null;
            return (
              <div key={card.spot.id} style={styles.listItem}>
                <div style={styles.itemMain}>
                  <div style={styles.itemTop}>
                    <Link href={`/surf/spot/${card.spot.id}`} style={styles.spotLink}>
                      {card.spot.name}
                    </Link>
                    <span style={{ ...styles.ratingBadge, backgroundColor: colorForCondition(day.conditionColor) }}>
                      {day.rating.toFixed(1)}
                    </span>
                  </div>
                  <div style={styles.spotMeta}>
                    {card.spot.region} · {card.spot.breakType} · {day.waveHeightMin.toFixed(1)}-{day.waveHeightMax.toFixed(1)} ft · {day.windKtsAvg.toFixed(0)} kts
                  </div>
                </div>
                <button
                  style={card.spot.isFavorite ? styles.favoriteActive : styles.favorite}
                  onClick={() => void doToggleSurfFavorite(card.spot.id).then(loadData)}
                >
                  {card.spot.isFavorite ? 'Favorited' : 'Favorite'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </SurfShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function colorForCondition(condition: SurfDaySummary['conditionColor']): string {
  switch (condition) {
    case 'green':
      return '#22c55e';
    case 'yellow':
      return '#f59e0b';
    case 'orange':
      return '#f97316';
    default:
      return '#ef4444';
  }
}

const styles: Record<string, React.CSSProperties> = {
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  },
  metricCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 14,
  },
  metricLabel: {
    color: 'var(--text-tertiary)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricValue: {
    marginTop: 6,
    color: '#3B82F6',
    fontWeight: 700,
    fontSize: 20,
  },
  quickLinks: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickLink: {
    textDecoration: 'none',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 10px',
  },
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 600,
  },
  narrativeCard: {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--surface-elevated)',
    padding: 12,
  },
  narrativeSummary: {
    color: 'var(--text)',
    fontWeight: 600,
  },
  narrativeBody: {
    color: 'var(--text-secondary)',
    marginTop: 6,
    lineHeight: 1.45,
    fontSize: 14,
  },
  narrativeMeta: {
    marginTop: 8,
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  dayRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayChip: {
    border: '1px solid var(--border)',
    borderRadius: '999px',
    background: 'var(--surface-elevated)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  dayChipActive: {
    border: '1px solid #3B82F6',
    borderRadius: '999px',
    background: 'rgba(59, 130, 246, 0.14)',
    color: '#3B82F6',
    fontSize: 12,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--surface-elevated)',
    padding: 10,
  },
  itemMain: {
    minWidth: 0,
    flex: 1,
  },
  itemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  spotLink: {
    color: 'var(--text)',
    fontWeight: 600,
    textDecoration: 'none',
  },
  spotMeta: {
    marginTop: 2,
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  ratingBadge: {
    color: '#fff',
    borderRadius: '999px',
    minWidth: 42,
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 12,
    padding: '4px 8px',
  },
  favorite: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    padding: '7px 10px',
    cursor: 'pointer',
  },
  favoriteActive: {
    border: '1px solid #f59e0b',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(245, 158, 11, 0.16)',
    color: '#f59e0b',
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
