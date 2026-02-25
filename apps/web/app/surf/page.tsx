'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  doCreateSurfSession,
  doCreateSurfSpot,
  doDeleteSurfSession,
  doDeleteSurfSpot,
  doToggleSurfFavorite,
  doUpdateSurfSpotConditions,
  fetchSurfOverview,
  fetchSurfSessions,
  fetchSurfSpots,
} from './actions';
import type { SurfSession, SurfSpot } from '@mylife/surf';

export default function SurfPage() {
  const [overview, setOverview] = useState({
    spots: 0,
    favorites: 0,
    averageWaveHeightFt: 0,
    sessions: 0,
  });
  const [spots, setSpots] = useState<SurfSpot[]>([]);
  const [sessions, setSessions] = useState<SurfSession[]>([]);

  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [spotName, setSpotName] = useState('');
  const [spotRegion, setSpotRegion] = useState('');
  const [spotBreakType, setSpotBreakType] = useState<SurfSpot['breakType']>('beach');
  const [spotWaveHeight, setSpotWaveHeight] = useState('3.5');
  const [spotWindKts, setSpotWindKts] = useState('10');
  const [spotTide, setSpotTide] = useState<SurfSpot['tide']>('mid');
  const [spotSwellDirection, setSpotSwellDirection] = useState('W');

  const [sessionSpotId, setSessionSpotId] = useState('');
  const [sessionDurationMin, setSessionDurationMin] = useState('90');
  const [sessionRating, setSessionRating] = useState('4');
  const [sessionNotes, setSessionNotes] = useState('');

  const [updatingSpotId, setUpdatingSpotId] = useState<string | null>(null);
  const [editingWaveHeight, setEditingWaveHeight] = useState<Record<string, string>>({});
  const [editingWindKts, setEditingWindKts] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    const [nextOverview, nextSpots, nextSessions] = await Promise.all([
      fetchSurfOverview(),
      fetchSurfSpots({
        search: search.trim() || undefined,
        favoritesOnly,
      }),
      fetchSurfSessions({ limit: 12 }),
    ]);
    setOverview(nextOverview);
    setSpots(nextSpots);
    setSessions(nextSessions);
    if (!sessionSpotId && nextSpots[0]) {
      setSessionSpotId(nextSpots[0].id);
    }
  }, [favoritesOnly, search, sessionSpotId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedSpotName = useMemo(
    () => spots.find((spot) => spot.id === sessionSpotId)?.name ?? '',
    [spots, sessionSpotId],
  );

  const handleCreateSpot = async () => {
    if (!spotName.trim() || !spotRegion.trim()) return;
    await doCreateSurfSpot(crypto.randomUUID(), {
      name: spotName.trim(),
      region: spotRegion.trim(),
      breakType: spotBreakType,
      waveHeightFt: Number(spotWaveHeight) || 0,
      windKts: Number(spotWindKts) || 0,
      tide: spotTide,
      swellDirection: spotSwellDirection.trim() || 'W',
    });
    setSpotName('');
    setSpotRegion('');
    await loadData();
  };

  const handleCreateSession = async () => {
    if (!sessionSpotId) return;
    await doCreateSurfSession(crypto.randomUUID(), {
      spotId: sessionSpotId,
      sessionDate: new Date().toISOString(),
      durationMin: Math.max(15, Number(sessionDurationMin) || 60),
      rating: Math.min(5, Math.max(1, Number(sessionRating) || 3)),
      notes: sessionNotes.trim() || undefined,
    });
    setSessionNotes('');
    await loadData();
  };

  const handleRefreshConditions = async (spot: SurfSpot) => {
    const nextWave = Number(editingWaveHeight[spot.id] ?? spot.waveHeightFt);
    const nextWind = Number(editingWindKts[spot.id] ?? spot.windKts);

    setUpdatingSpotId(spot.id);
    try {
      await doUpdateSurfSpotConditions(spot.id, {
        waveHeightFt: Number.isFinite(nextWave) ? nextWave : spot.waveHeightFt,
        windKts: Number.isFinite(nextWind) ? nextWind : spot.windKts,
      });
      await loadData();
    } finally {
      setUpdatingSpotId(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>MySurf</h1>
        <p style={styles.subtitle}>Live spot intel and session logging</p>
      </div>

      <div style={styles.summaryGrid}>
        <MetricCard label="Tracked Spots" value={String(overview.spots)} />
        <MetricCard label="Favorites" value={String(overview.favorites)} />
        <MetricCard
          label="Avg Wave Height"
          value={`${overview.averageWaveHeightFt.toFixed(1)} ft`}
        />
        <MetricCard label="Sessions Logged" value={String(overview.sessions)} />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Add Spot</h2>
        <div style={styles.formRow}>
          <input
            value={spotName}
            onChange={(event) => setSpotName(event.target.value)}
            placeholder="Spot name"
            style={styles.input}
          />
          <input
            value={spotRegion}
            onChange={(event) => setSpotRegion(event.target.value)}
            placeholder="Region"
            style={styles.input}
          />
          <select
            value={spotBreakType}
            onChange={(event) => setSpotBreakType(event.target.value as SurfSpot['breakType'])}
            style={styles.select}
          >
            <option value="beach">Beach break</option>
            <option value="point">Point break</option>
            <option value="reef">Reef break</option>
            <option value="river-mouth">River mouth</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={styles.formRow}>
          <input
            value={spotWaveHeight}
            onChange={(event) => setSpotWaveHeight(event.target.value)}
            placeholder="Wave height (ft)"
            style={styles.input}
          />
          <input
            value={spotWindKts}
            onChange={(event) => setSpotWindKts(event.target.value)}
            placeholder="Wind (kts)"
            style={styles.input}
          />
          <select
            value={spotTide}
            onChange={(event) => setSpotTide(event.target.value as SurfSpot['tide'])}
            style={styles.select}
          >
            <option value="low">Low tide</option>
            <option value="mid">Mid tide</option>
            <option value="high">High tide</option>
            <option value="all">All tides</option>
          </select>
          <input
            value={spotSwellDirection}
            onChange={(event) => setSpotSwellDirection(event.target.value)}
            placeholder="Swell direction"
            style={styles.input}
          />
          <button style={styles.primaryButton} onClick={() => void handleCreateSpot()}>
            Add Spot
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Spot Intel</h2>
          <div style={styles.inlineControls}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search spots"
              style={styles.input}
            />
            <button
              style={favoritesOnly ? styles.secondaryButtonActive : styles.secondaryButton}
              onClick={() => setFavoritesOnly((value) => !value)}
            >
              Favorites only
            </button>
          </div>
        </div>

        <div style={styles.list}>
          {spots.map((spot) => (
            <div key={spot.id} style={styles.listItem}>
              <div style={styles.listMain}>
                <button
                  style={spot.isFavorite ? styles.favoriteActive : styles.favorite}
                  onClick={() => void doToggleSurfFavorite(spot.id).then(loadData)}
                >
                  ★
                </button>
                <div>
                  <div style={styles.spotTitle}>{spot.name}</div>
                  <div style={styles.spotMeta}>
                    {spot.region} · {spot.breakType} · Best at {spot.tide} tide · Swell{' '}
                    {spot.swellDirection}
                  </div>
                </div>
              </div>
              <div style={styles.conditions}>
                <input
                  value={editingWaveHeight[spot.id] ?? String(spot.waveHeightFt)}
                  onChange={(event) =>
                    setEditingWaveHeight((prev) => ({ ...prev, [spot.id]: event.target.value }))
                  }
                  style={styles.smallInput}
                />
                <span style={styles.smallLabel}>ft</span>
                <input
                  value={editingWindKts[spot.id] ?? String(spot.windKts)}
                  onChange={(event) =>
                    setEditingWindKts((prev) => ({ ...prev, [spot.id]: event.target.value }))
                  }
                  style={styles.smallInput}
                />
                <span style={styles.smallLabel}>kts</span>
                <button
                  style={styles.secondaryButton}
                  onClick={() => void handleRefreshConditions(spot)}
                  disabled={updatingSpotId === spot.id}
                >
                  {updatingSpotId === spot.id ? 'Saving…' : 'Update'}
                </button>
                <button
                  style={styles.dangerButton}
                  onClick={() => void doDeleteSurfSpot(spot.id).then(loadData)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {spots.length === 0 && <div style={styles.empty}>No spots yet. Add your first break above.</div>}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Log Session</h2>
        <div style={styles.formRow}>
          <select
            value={sessionSpotId}
            onChange={(event) => setSessionSpotId(event.target.value)}
            style={styles.select}
          >
            {spots.map((spot) => (
              <option key={spot.id} value={spot.id}>
                {spot.name}
              </option>
            ))}
          </select>
          <input
            value={sessionDurationMin}
            onChange={(event) => setSessionDurationMin(event.target.value)}
            placeholder="Duration (min)"
            style={styles.input}
          />
          <input
            value={sessionRating}
            onChange={(event) => setSessionRating(event.target.value)}
            placeholder="Rating (1-5)"
            style={styles.input}
          />
          <input
            value={sessionNotes}
            onChange={(event) => setSessionNotes(event.target.value)}
            placeholder="Session notes"
            style={styles.input}
          />
          <button
            style={styles.primaryButton}
            disabled={!sessionSpotId}
            onClick={() => void handleCreateSession()}
          >
            Save Session
          </button>
        </div>

        <div style={styles.list}>
          {sessions.map((session) => (
            <div key={session.id} style={styles.listItem}>
              <div>
                <div style={styles.spotTitle}>
                  {new Date(session.sessionDate).toLocaleDateString()} · {session.durationMin} min ·{' '}
                  {session.rating}/5
                </div>
                <div style={styles.spotMeta}>
                  {spots.find((spot) => spot.id === session.spotId)?.name ?? selectedSpotName}
                  {session.notes ? ` · ${session.notes}` : ''}
                </div>
              </div>
              <button
                style={styles.dangerButton}
                onClick={() => void doDeleteSurfSession(session.id).then(loadData)}
              >
                Delete
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div style={styles.empty}>No sessions logged yet. Track your next surf here.</div>
          )}
        </div>
      </div>
    </div>
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1080,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: 700,
    margin: 0,
    color: 'var(--text)',
  },
  subtitle: {
    marginTop: 4,
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
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
    marginBottom: 12,
  },
  sectionTitle: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 600,
  },
  formRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  inlineControls: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    minWidth: 120,
    flex: 1,
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  select: {
    minWidth: 140,
    flex: 1,
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  primaryButton: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: '#3B82F6',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface-elevated)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  secondaryButtonActive: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #3B82F6',
    background: 'rgba(59, 130, 246, 0.12)',
    color: '#3B82F6',
    cursor: 'pointer',
  },
  dangerButton: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--danger)',
    color: '#fff',
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 10,
  },
  listMain: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  favorite: {
    border: '1px solid var(--border)',
    borderRadius: '50%',
    width: 28,
    height: 28,
    background: 'transparent',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
  },
  favoriteActive: {
    border: '1px solid #f59e0b',
    borderRadius: '50%',
    width: 28,
    height: 28,
    background: 'rgba(245, 158, 11, 0.16)',
    color: '#f59e0b',
    cursor: 'pointer',
  },
  spotTitle: {
    fontWeight: 600,
    color: 'var(--text)',
  },
  spotMeta: {
    marginTop: 2,
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  conditions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  smallInput: {
    width: 58,
    padding: '6px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
  },
  smallLabel: {
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  empty: {
    padding: 14,
    color: 'var(--text-tertiary)',
    textAlign: 'center',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-elevated)',
  },
};
