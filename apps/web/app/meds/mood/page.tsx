'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  doCreateMoodEntry,
  fetchMoodEntries,
  fetchMoodCalendarMonth,
} from '../actions';
import {
  MOOD_VOCABULARY_SIMPLIFIED,
  DEFAULT_ACTIVITIES,
} from '@mylife/meds';

interface MoodEntry {
  id: string;
  mood: string;
  energyLevel: 'high' | 'low';
  pleasantness: 'pleasant' | 'unpleasant' | 'neutral';
  intensity: number;
  notes: string | null;
  recordedAt: string;
  createdAt: string;
}

interface CalendarEntry {
  date: string;
  dominantMood: string | null;
  pleasantness: 'pleasant' | 'unpleasant' | 'neutral' | null;
  color: string;
  hasData: boolean;
}

type QuadrantKey = keyof typeof MOOD_VOCABULARY_SIMPLIFIED;

const QUADRANT_CONFIG: Record<QuadrantKey, { label: string; color: string; energy: 'high' | 'low'; pleasantness: 'pleasant' | 'unpleasant' }> = {
  highEnergyPleasant: { label: 'High Energy + Pleasant', color: '#4CAF50', energy: 'high', pleasantness: 'pleasant' },
  highEnergyUnpleasant: { label: 'High Energy + Unpleasant', color: '#F44336', energy: 'high', pleasantness: 'unpleasant' },
  lowEnergyPleasant: { label: 'Low Energy + Pleasant', color: '#2196F3', energy: 'low', pleasantness: 'pleasant' },
  lowEnergyUnpleasant: { label: 'Low Energy + Unpleasant', color: '#9E9E9E', energy: 'low', pleasantness: 'unpleasant' },
};

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  backLink: { color: 'var(--accent-meds)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  quadrantGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' },
  quadrantCard: { borderRadius: 'var(--radius-lg)', padding: '1rem', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' },
  quadrantLabel: { fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' },
  chipRow: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const },
  chip: {
    fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text-secondary)', transition: 'all 0.15s',
  },
  chipSelected: { background: 'var(--accent-meds)', color: '#fff', border: '1px solid var(--accent-meds)' },
  form: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' },
  textarea: {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: '0.85rem',
    color: 'var(--text)', outline: 'none', resize: 'vertical' as const, minHeight: 60,
    marginTop: '0.75rem', boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    background: 'var(--accent-meds)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', padding: '0.5rem 1.25rem', fontSize: '0.85rem',
    fontWeight: 600, cursor: 'pointer', marginTop: '0.75rem',
  },
  entryCard: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '0.75rem',
  },
  entryMood: { fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem', textTransform: 'capitalize' as const },
  entryMeta: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' },
  badge: {
    fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem',
    borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  },
  badgeRow: { display: 'flex', gap: '0.4rem', alignItems: 'center' as const, marginTop: '0.35rem', flexWrap: 'wrap' as const },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' },
  calDayLabel: { fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'center' as const, padding: '0.25rem 0' },
  calCell: { aspectRatio: '1', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, fontSize: '0.65rem', color: 'var(--text-secondary)' },
  empty: { textAlign: 'center' as const, color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.9rem' },
  monthNav: { display: 'flex', alignItems: 'center' as const, gap: '1rem', marginBottom: '0.75rem' },
  monthBtn: {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    padding: '0.3rem 0.65rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer',
  },
  monthLabel: { fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' },
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MoodPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Check-in form state
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantKey | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(3);
  const [notes, setNotes] = useState('');

  // Calendar month state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  const loadData = useCallback(async () => {
    try {
      const [recentEntries, calData] = await Promise.all([
        fetchMoodEntries(),
        fetchMoodCalendarMonth(calYear, calMonth),
      ]);
      setEntries(recentEntries as MoodEntry[]);
      setCalendar(calData as CalendarEntry[]);
    } catch (err) {
      console.error('Failed to load mood data:', err);
    } finally {
      setLoading(false);
    }
  }, [calYear, calMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuadrantSelect = useCallback((key: QuadrantKey) => {
    setSelectedQuadrant(key);
    setSelectedMood(null);
  }, []);

  const handleMoodSelect = useCallback((mood: string) => {
    setSelectedMood(mood);
  }, []);

  const toggleActivity = useCallback((activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedQuadrant || !selectedMood) return;
    const config = QUADRANT_CONFIG[selectedQuadrant];
    const id = crypto.randomUUID();
    await doCreateMoodEntry(id, {
      mood: selectedMood,
      energyLevel: config.energy,
      pleasantness: config.pleasantness,
      intensity,
      notes: notes.trim() || undefined,
    });
    setSelectedQuadrant(null);
    setSelectedMood(null);
    setSelectedActivities([]);
    setIntensity(3);
    setNotes('');
    await loadData();
  }, [selectedQuadrant, selectedMood, intensity, notes, loadData]);

  const prevMonth = useCallback(() => {
    if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1); }
    else { setCalMonth((m) => m - 1); }
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1); }
    else { setCalMonth((m) => m + 1); }
  }, [calMonth]);

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading mood data...</div></div>;
  }

  // Build calendar grid
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();
  const calendarCells: (CalendarEntry | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (const entry of calendar) calendarCells.push(entry);

  return (
    <div style={styles.page}>
      <Link href="/meds" style={styles.backLink}>Back to Medications</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Mood Tracking</h1>
        <p style={styles.subtitle}>Log how you feel and track patterns over time</p>
      </div>

      {/* Mood Check-In Form */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Check In</h2>
        <div style={styles.form}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Select how you feel:
          </div>
          <div style={styles.quadrantGrid}>
            {(Object.entries(QUADRANT_CONFIG) as [QuadrantKey, typeof QUADRANT_CONFIG[QuadrantKey]][]).map(
              ([key, config]) => (
                <div
                  key={key}
                  onClick={() => handleQuadrantSelect(key)}
                  style={{
                    ...styles.quadrantCard,
                    background: `${config.color}15`,
                    borderColor: selectedQuadrant === key ? config.color : 'transparent',
                  }}
                >
                  <div style={{ ...styles.quadrantLabel, color: config.color }}>
                    {config.label}
                  </div>
                  <div style={styles.chipRow}>
                    {MOOD_VOCABULARY_SIMPLIFIED[key].map((mood) => (
                      <span
                        key={mood}
                        onClick={(e) => { e.stopPropagation(); handleQuadrantSelect(key); handleMoodSelect(mood); }}
                        style={{
                          ...styles.chip,
                          ...(selectedMood === mood && selectedQuadrant === key ? styles.chipSelected : {}),
                        }}
                      >
                        {mood}
                      </span>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Activities */}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Activities (optional):
          </div>
          <div style={{ ...styles.chipRow, marginBottom: '0.75rem' }}>
            {DEFAULT_ACTIVITIES.map((activity) => (
              <span
                key={activity}
                onClick={() => toggleActivity(activity)}
                style={{
                  ...styles.chip,
                  ...(selectedActivities.includes(activity) ? styles.chipSelected : {}),
                }}
              >
                {activity}
              </span>
            ))}
          </div>

          {/* Intensity */}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Intensity: {intensity}/5
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-meds)' }}
          />

          <textarea
            style={styles.textarea}
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            style={{
              ...styles.btnPrimary,
              opacity: selectedMood ? 1 : 0.5,
            }}
            onClick={handleSubmit}
            disabled={!selectedMood}
          >
            Save Mood
          </button>
        </div>
      </div>

      {/* Mood Calendar */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Monthly Calendar</h2>
        <div style={styles.monthNav}>
          <button style={styles.monthBtn} onClick={prevMonth}>Prev</button>
          <span style={styles.monthLabel}>{MONTH_NAMES[calMonth - 1]} {calYear}</span>
          <button style={styles.monthBtn} onClick={nextMonth}>Next</button>
        </div>
        <div style={styles.calGrid}>
          {DAY_LABELS.map((d) => (
            <div key={d} style={styles.calDayLabel}>{d}</div>
          ))}
          {calendarCells.map((cell, i) => (
            <div
              key={i}
              style={{
                ...styles.calCell,
                background: cell?.hasData ? cell.color : 'var(--surface)',
                border: cell ? '1px solid var(--border)' : 'none',
              }}
              title={cell ? `${cell.date}: ${cell.dominantMood ?? 'no data'}` : ''}
            >
              {cell ? parseInt(cell.date.slice(8, 10), 10) : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Entries */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Entries</h2>
        {entries.length === 0 ? (
          <div style={styles.empty}>No mood entries yet. Check in above to get started.</div>
        ) : (
          entries.slice(0, 20).map((entry) => (
            <div key={entry.id} style={styles.entryCard}>
              <div style={styles.entryMood}>{entry.mood}</div>
              <div style={styles.entryMeta}>
                {new Date(entry.recordedAt).toLocaleDateString()} at{' '}
                {new Date(entry.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={styles.badgeRow}>
                <span style={styles.badge}>{entry.energyLevel} energy</span>
                <span style={{
                  ...styles.badge,
                  color: entry.pleasantness === 'pleasant' ? '#4CAF50' : entry.pleasantness === 'unpleasant' ? '#F44336' : 'var(--text-secondary)',
                }}>
                  {entry.pleasantness}
                </span>
                <span style={styles.badge}>intensity {entry.intensity}/5</span>
              </div>
              {entry.notes && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {entry.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
