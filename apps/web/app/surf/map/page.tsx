'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { SurfSpot } from '@mylife/surf';
import {
  doCreateSurfPin,
  doCreateSurfSpot,
  doDeleteSurfPin,
  doToggleSurfFavorite,
  fetchSurfHomeCards,
  fetchSurfPins,
  fetchSurfRegions,
  type SurfDaySummary,
  type SurfMapPin,
  type SurfSpotHomeCard,
} from '../actions';
import { SurfShell } from '../components/SurfShell';

export default function SurfMapPage() {
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [timeSlot, setTimeSlot] = useState(0);
  const [cards, setCards] = useState<SurfSpotHomeCard[]>([]);
  const [pins, setPins] = useState<SurfMapPin[]>([]);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [lat, setLat] = useState('34.409');
  const [lng, setLng] = useState('-119.698');
  const [isPublic, setIsPublic] = useState(true);

  const loadData = useCallback(async () => {
    const [nextRegions, nextCards, nextPins] = await Promise.all([
      fetchSurfRegions(),
      fetchSurfHomeCards(selectedRegion === 'all' ? undefined : selectedRegion),
      fetchSurfPins(),
    ]);
    setRegions(nextRegions);
    setCards(nextCards);
    setPins(nextPins);
  }, [selectedRegion]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const maxDay = useMemo(
    () => Math.max(0, ...cards.map((card) => card.days.length - 1)),
    [cards],
  );

  useEffect(() => {
    if (timeSlot > maxDay) {
      setTimeSlot(maxDay);
    }
  }, [maxDay, timeSlot]);

  const dayLabel = useMemo(() => cards[0]?.days[timeSlot]?.label ?? 'Today', [cards, timeSlot]);

  const handlePinSpot = async () => {
    if (!name.trim()) return;
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    await doCreateSurfPin({
      name: name.trim(),
      notes: notes.trim(),
      latitude,
      longitude,
      isPublic,
    });

    await doCreateSurfSpot(crypto.randomUUID(), {
      name: name.trim(),
      region: selectedRegion === 'all' ? 'Pinned Region' : selectedRegion,
      breakType: 'other',
      waveHeightFt: 2.5,
      windKts: 8,
      tide: 'mid',
      swellDirection: 'W',
    });

    setName('');
    setNotes('');
    await loadData();
  };

  return (
    <SurfShell subtitle="Interactive map controls, timeline scrubber, and spot pinning">
      <div style={styles.mapCard}>
        <div style={styles.mapHeader}>
          <h2 style={styles.heading}>Swell Map Controls</h2>
          <select
            value={selectedRegion}
            onChange={(event) => setSelectedRegion(event.target.value)}
            style={styles.select}
          >
            <option value="all">All regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        <div style={styles.scrubberRow}>
          <input
            type="range"
            min={0}
            max={Math.max(maxDay, 0)}
            value={timeSlot}
            onChange={(event) => setTimeSlot(Number(event.target.value))}
            style={styles.slider}
          />
          <span style={styles.sliderLabel}>{dayLabel}</span>
        </div>

        <p style={styles.mapHint}>
          Tap-anywhere model parity is represented via pin coordinates and daily scrubber state. Spots update against the active forecast day.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Pin Spot</h2>
        <div style={styles.row}>
          <input
            style={styles.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Spot name"
          />
          <input
            style={styles.input}
            value={lat}
            onChange={(event) => setLat(event.target.value)}
            placeholder="Latitude"
          />
          <input
            style={styles.input}
            value={lng}
            onChange={(event) => setLng(event.target.value)}
            placeholder="Longitude"
          />
        </div>
        <div style={styles.row}>
          <input
            style={styles.input}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
          />
          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
            />
            Public Pin
          </label>
          <button style={styles.primaryButton} onClick={() => void handlePinSpot()}>
            Save Pin
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Spot Grid</h2>
        <div style={styles.grid}>
          {cards.map((card) => {
            const day = card.days[timeSlot] ?? card.days[0];
            if (!day) return null;
            return (
              <SpotTile
                key={card.spot.id}
                spot={card.spot}
                day={day}
                onToggleFavorite={() => void doToggleSurfFavorite(card.spot.id).then(loadData)}
              />
            );
          })}
          {cards.length === 0 && (
            <div style={styles.empty}>No spots available for this region yet.</div>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Pinned Spots</h2>
        <div style={styles.list}>
          {pins.map((pin) => (
            <div key={pin.id} style={styles.pinItem}>
              <div>
                <div style={styles.pinTitle}>{pin.name}</div>
                <div style={styles.pinMeta}>
                  {pin.latitude.toFixed(3)}, {pin.longitude.toFixed(3)} · {pin.isPublic ? 'Public' : 'Private'}
                  {pin.notes ? ` · ${pin.notes}` : ''}
                </div>
              </div>
              <button
                style={styles.dangerButton}
                onClick={() => void doDeleteSurfPin(pin.id).then(loadData)}
              >
                Remove
              </button>
            </div>
          ))}
          {pins.length === 0 && (
            <div style={styles.empty}>No map pins yet. Add one above.</div>
          )}
        </div>
      </div>
    </SurfShell>
  );
}

function SpotTile({
  spot,
  day,
  onToggleFavorite,
}: {
  spot: SurfSpot;
  day: SurfDaySummary;
  onToggleFavorite: () => void;
}) {
  return (
    <div style={styles.tile}>
      <div style={styles.tileTop}>
        <Link href={`/surf/spot/${spot.id}`} style={styles.link}>{spot.name}</Link>
        <button
          style={spot.isFavorite ? styles.favoriteActive : styles.favorite}
          onClick={onToggleFavorite}
        >
          {spot.isFavorite ? '★' : '☆'}
        </button>
      </div>
      <div style={styles.meta}>{spot.region} · {spot.breakType}</div>
      <div style={styles.meta}>{day.label} · {day.waveHeightMin.toFixed(1)}-{day.waveHeightMax.toFixed(1)} ft · {day.windKtsAvg.toFixed(0)} kts</div>
      <div style={styles.ratingRow}>
        <span style={{ ...styles.ratingDot, backgroundColor: colorForCondition(day.conditionColor) }} />
        <span style={styles.ratingText}>{day.rating.toFixed(1)} / 5</span>
      </div>
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
  mapCard: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    padding: 16,
  },
  mapHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heading: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 600,
  },
  scrubberRow: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  slider: {
    flex: 1,
  },
  sliderLabel: {
    minWidth: 70,
    fontSize: 12,
    color: 'var(--text-secondary)',
    textAlign: 'right',
  },
  mapHint: {
    marginTop: 8,
    color: 'var(--text-tertiary)',
    fontSize: 13,
    lineHeight: 1.4,
  },
  section: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    padding: 16,
  },
  row: {
    marginTop: 10,
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
  select: {
    minWidth: 160,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-secondary)',
    fontSize: 13,
    padding: '0 4px',
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
  grid: {
    marginTop: 10,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 8,
  },
  tile: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-elevated)',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  tileTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  link: {
    color: 'var(--text)',
    textDecoration: 'none',
    fontWeight: 600,
  },
  meta: {
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  ratingDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  ratingText: {
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 600,
  },
  favorite: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    width: 28,
    height: 28,
    cursor: 'pointer',
  },
  favoriteActive: {
    border: '1px solid #f59e0b',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(245, 158, 11, 0.16)',
    color: '#f59e0b',
    width: 28,
    height: 28,
    cursor: 'pointer',
  },
  list: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  pinItem: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-elevated)',
    padding: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pinTitle: {
    color: 'var(--text)',
    fontWeight: 600,
  },
  pinMeta: {
    marginTop: 2,
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  dangerButton: {
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    padding: '8px 12px',
    background: 'var(--danger)',
    color: '#fff',
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
