'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { SurfSession, SurfSpot } from '@mylife/surf';
import {
  doCreateSurfSession,
  doDeleteSurfSpot,
  doToggleSurfFavorite,
  doUpdateSurfSpotConditions,
  fetchSurfDaySummaries,
  fetchSurfForecast,
  fetchSurfGuide,
  fetchSurfLiveConditions,
  fetchSurfNarrative,
  fetchSurfSessions,
  fetchSurfSpotById,
  voteSurfNarrative,
  type SurfDaySummary,
  type SurfForecastPoint,
  type SurfGuide,
  type SurfLiveConditions,
  type SurfNarrative,
} from '../../actions';
import { SurfShell } from '../../components/SurfShell';

type SpotTab = 'Forecast' | 'Analysis' | 'Live' | 'Charts' | 'Guide';

export default function SurfSpotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SpotTab>('Forecast');
  const [spot, setSpot] = useState<SurfSpot | null>(null);
  const [daySummaries, setDaySummaries] = useState<SurfDaySummary[]>([]);
  const [forecastPoints, setForecastPoints] = useState<SurfForecastPoint[]>([]);
  const [narrative, setNarrative] = useState<SurfNarrative | null>(null);
  const [live, setLive] = useState<SurfLiveConditions | null>(null);
  const [guide, setGuide] = useState<SurfGuide | null>(null);
  const [sessions, setSessions] = useState<SurfSession[]>([]);

  const [selectedDay, setSelectedDay] = useState(0);
  const [waveHeightFt, setWaveHeightFt] = useState('0');
  const [windKts, setWindKts] = useState('0');
  const [durationMin, setDurationMin] = useState('90');
  const [rating, setRating] = useState('4');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    const nextSpot = await fetchSurfSpotById(id);
    if (!nextSpot) {
      setSpot(null);
      setDaySummaries([]);
      setForecastPoints([]);
      setNarrative(null);
      setLive(null);
      setGuide(null);
      setSessions([]);
      return;
    }

    const [nextDays, nextForecast, nextNarrative, nextLive, nextGuide, nextSessions] = await Promise.all([
      fetchSurfDaySummaries(id, 16),
      fetchSurfForecast(id, 4),
      fetchSurfNarrative({ spotId: id }),
      fetchSurfLiveConditions(id),
      fetchSurfGuide(id),
      fetchSurfSessions({ spotId: id, limit: 40 }),
    ]);

    setSpot(nextSpot);
    setDaySummaries(nextDays);
    setForecastPoints(nextForecast);
    setNarrative(nextNarrative);
    setLive(nextLive);
    setGuide(nextGuide);
    setSessions(nextSessions);
    setWaveHeightFt(String(nextSpot.waveHeightFt));
    setWindKts(String(nextSpot.windKts));
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedSummary = useMemo(
    () => daySummaries[selectedDay] ?? daySummaries[0] ?? null,
    [daySummaries, selectedDay],
  );

  const chartPoints = useMemo(() => forecastPoints.slice(0, 16), [forecastPoints]);

  const averageSessionRating = useMemo(() => {
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, session) => sum + session.rating, 0) / sessions.length;
  }, [sessions]);

  if (!spot) {
    return (
      <SurfShell subtitle="Spot detail">
        <div style={styles.section}>
          <h2 style={styles.heading}>Spot Not Found</h2>
          <p style={styles.meta}>The spot may have been deleted.</p>
          <Link href="/surf" style={styles.link}>Back to MySurf Home</Link>
        </div>
      </SurfShell>
    );
  }

  return (
    <SurfShell subtitle={`${spot.name} · ${spot.region}`}>
      <div style={styles.topRow}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Current Wave</div>
          <div style={styles.metricValue}>{spot.waveHeightFt.toFixed(1)} ft</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Current Wind</div>
          <div style={styles.metricValue}>{spot.windKts.toFixed(0)} kts</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Session Avg</div>
          <div style={styles.metricValue}>{sessions.length ? averageSessionRating.toFixed(1) : '--'}</div>
        </div>
      </div>

      <div style={styles.tabRow}>
        {(['Forecast', 'Analysis', 'Live', 'Charts', 'Guide'] as SpotTab[]).map((tab) => (
          <button
            key={tab}
            style={activeTab === tab ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Forecast' && (
        <div style={styles.section}>
          <div style={styles.headerRow}>
            <h2 style={styles.heading}>Forecast</h2>
            <button
              style={spot.isFavorite ? styles.favoriteActive : styles.favorite}
              onClick={() => void doToggleSurfFavorite(spot.id).then(loadData)}
            >
              {spot.isFavorite ? 'Favorited' : 'Favorite'}
            </button>
          </div>

          <div style={styles.dayRow}>
            {daySummaries.slice(0, 7).map((day, index) => (
              <button
                key={day.date}
                style={selectedDay === index ? styles.dayChipActive : styles.dayChip}
                onClick={() => setSelectedDay(index)}
              >
                {day.label}
              </button>
            ))}
          </div>

          {selectedSummary ? (
            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>{selectedSummary.label}</div>
              <div style={styles.meta}>
                {selectedSummary.waveHeightMin.toFixed(1)}-{selectedSummary.waveHeightMax.toFixed(1)} ft · {selectedSummary.windKtsAvg.toFixed(0)} kts · Rating {selectedSummary.rating.toFixed(1)}
              </div>
            </div>
          ) : (
            <div style={styles.empty}>No forecast summary available.</div>
          )}

          <div style={styles.formRow}>
            <input
              style={styles.input}
              value={waveHeightFt}
              onChange={(event) => setWaveHeightFt(event.target.value)}
              placeholder="Wave height (ft)"
            />
            <input
              style={styles.input}
              value={windKts}
              onChange={(event) => setWindKts(event.target.value)}
              placeholder="Wind (kts)"
            />
            <button
              style={styles.primaryButton}
              onClick={() =>
                void doUpdateSurfSpotConditions(spot.id, {
                  waveHeightFt: Number(waveHeightFt) || spot.waveHeightFt,
                  windKts: Number(windKts) || spot.windKts,
                }).then(loadData)
              }
            >
              Update Conditions
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Analysis' && (
        <div style={styles.section}>
          <h2 style={styles.heading}>Analysis</h2>
          {!narrative ? (
            <div style={styles.empty}>Narrative unavailable.</div>
          ) : (
            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>{narrative.summary}</div>
              <div style={styles.meta}>{narrative.body}</div>
              <div style={styles.voteRow}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => void voteSurfNarrative({ narrativeId: narrative.id, helpful: true }).then(loadData)}
                >
                  Helpful ({narrative.helpfulVotes})
                </button>
                <button
                  style={styles.secondaryButton}
                  onClick={() => void voteSurfNarrative({ narrativeId: narrative.id, helpful: false }).then(loadData)}
                >
                  Not Helpful ({narrative.unhelpfulVotes})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Live' && (
        <div style={styles.section}>
          <h2 style={styles.heading}>Live</h2>
          {!live ? (
            <div style={styles.empty}>No live data.</div>
          ) : (
            <>
              <div style={styles.infoCard}>
                <div style={styles.infoTitle}>{live.buoyName} · {live.distanceMi.toFixed(1)} mi</div>
                <div style={styles.meta}>
                  Latest: {live.latest.waveHeightFt.toFixed(1)} ft @ {live.latest.periodSec.toFixed(1)}s · {live.latest.windKts.toFixed(0)} kts {live.latest.windDir} · {live.latest.waterTempF}F
                </div>
              </div>
              <div style={styles.list}>
                {live.recent.slice(0, 8).map((reading) => (
                  <div key={reading.timestamp} style={styles.item}>
                    <span style={styles.meta}>{new Date(reading.timestamp).toLocaleTimeString()}</span>
                    <span style={styles.meta}>{reading.waveHeightFt.toFixed(1)} ft</span>
                    <span style={styles.meta}>{reading.periodSec.toFixed(1)}s</span>
                    <span style={styles.meta}>{reading.windKts.toFixed(0)} kts {reading.windDir}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'Charts' && (
        <div style={styles.section}>
          <h2 style={styles.heading}>Charts</h2>
          <div style={styles.chart}>
            {chartPoints.map((point, index) => (
              <div key={point.timestamp} style={styles.chartRow}>
                <span style={styles.chartLabel}>{index + 1}</span>
                <div style={styles.chartBarBg}>
                  <div
                    style={{
                      ...styles.chartBarFill,
                      width: `${Math.min(100, (point.waveHeightFt / 10) * 100)}%`,
                    }}
                  />
                </div>
                <span style={styles.chartValue}>{point.waveHeightFt.toFixed(1)} ft</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Guide' && (
        <div style={styles.section}>
          <h2 style={styles.heading}>Guide</h2>
          {guide ? (
            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>Skill: {guide.skillLevel}</div>
              <div style={styles.meta}>Crowd factor: {guide.crowdFactor}/5</div>
              <div style={styles.meta}>Hazards: {guide.hazards.join(', ')}</div>
              <div style={styles.meta}>{guide.description}</div>
            </div>
          ) : (
            <div style={styles.empty}>Guide data unavailable.</div>
          )}

          <div style={styles.formRow}>
            <input
              style={styles.input}
              value={durationMin}
              onChange={(event) => setDurationMin(event.target.value)}
              placeholder="Duration (min)"
            />
            <input
              style={styles.input}
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              placeholder="Rating (1-5)"
            />
            <input
              style={styles.input}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes"
            />
            <button
              style={styles.primaryButton}
              onClick={() =>
                void doCreateSurfSession(crypto.randomUUID(), {
                  spotId: spot.id,
                  sessionDate: new Date().toISOString(),
                  durationMin: Math.max(15, Number(durationMin) || 60),
                  rating: Math.min(5, Math.max(1, Number(rating) || 3)),
                  notes: notes.trim() || undefined,
                }).then(() => {
                  setNotes('');
                  loadData();
                })
              }
            >
              Log Session
            </button>
          </div>

          <div style={styles.list}>
            {sessions.map((session) => (
              <div key={session.id} style={styles.item}>
                <span style={styles.meta}>{new Date(session.sessionDate).toLocaleDateString()}</span>
                <span style={styles.meta}>{session.durationMin} min</span>
                <span style={styles.meta}>{session.rating}/5</span>
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={styles.empty}>No sessions for this spot yet.</div>
            )}
          </div>

          <button
            style={styles.dangerButton}
            onClick={() =>
              void doDeleteSurfSpot(spot.id).then(() => {
                router.push('/surf');
              })
            }
          >
            Delete Spot
          </button>
        </div>
      )}
    </SurfShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },
  metricCard: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
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
    fontSize: 20,
    fontWeight: 700,
  },
  tabRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  tab: {
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 600,
    padding: '7px 12px',
    cursor: 'pointer',
  },
  tabActive: {
    borderRadius: '999px',
    border: '1px solid #3B82F6',
    background: 'rgba(59, 130, 246, 0.14)',
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: 600,
    padding: '7px 12px',
    cursor: 'pointer',
  },
  section: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 600,
  },
  dayRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayChip: {
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--surface-elevated)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  dayChipActive: {
    borderRadius: '999px',
    border: '1px solid #3B82F6',
    background: 'rgba(59, 130, 246, 0.14)',
    color: '#3B82F6',
    fontSize: 12,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  infoCard: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-elevated)',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  infoTitle: {
    color: 'var(--text)',
    fontWeight: 600,
  },
  meta: {
    color: 'var(--text-tertiary)',
    fontSize: 12,
    lineHeight: 1.4,
  },
  voteRow: {
    marginTop: 4,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  formRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  input: {
    minWidth: 120,
    flex: 1,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  primaryButton: {
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    padding: '8px 12px',
    background: '#3B82F6',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '7px 10px',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  chart: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: '26px 1fr 64px',
    alignItems: 'center',
    gap: 8,
  },
  chartLabel: {
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  chartBarBg: {
    height: 8,
    borderRadius: 999,
    background: 'var(--surface-elevated)',
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 999,
    background: '#3B82F6',
  },
  chartValue: {
    color: 'var(--text-secondary)',
    fontSize: 12,
    textAlign: 'right',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-elevated)',
    padding: 10,
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: 10,
    alignItems: 'center',
  },
  favorite: {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    padding: '7px 10px',
    cursor: 'pointer',
  },
  favoriteActive: {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #f59e0b',
    background: 'rgba(245, 158, 11, 0.16)',
    color: '#f59e0b',
    padding: '7px 10px',
    cursor: 'pointer',
  },
  dangerButton: {
    alignSelf: 'flex-start',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    padding: '8px 12px',
    background: 'var(--danger)',
    color: '#fff',
    cursor: 'pointer',
  },
  link: {
    marginTop: 2,
    display: 'inline-block',
    color: '#3B82F6',
    textDecoration: 'none',
    fontWeight: 600,
  },
  empty: {
    padding: 14,
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
  },
};
