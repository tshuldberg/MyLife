'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  doLogMeasurement,
  fetchMeasurements,
  fetchMeasurementTrend,
} from '../actions';

interface Measurement {
  id: string;
  type: string;
  value: string;
  unit: string;
  notes: string | null;
  measuredAt: string;
  createdAt: string;
}

interface TrendPoint {
  date: string;
  value: string;
}

const MEASUREMENT_TYPES = [
  { value: 'blood_pressure', label: 'Blood Pressure', defaultUnit: 'mmHg' },
  { value: 'blood_sugar', label: 'Blood Sugar', defaultUnit: 'mg/dL' },
  { value: 'weight', label: 'Weight', defaultUnit: 'lbs' },
  { value: 'temperature', label: 'Temperature', defaultUnit: 'F' },
  { value: 'heart_rate', label: 'Heart Rate', defaultUnit: 'bpm' },
  { value: 'custom', label: 'Custom', defaultUnit: '' },
] as const;

const TYPE_COLORS: Record<string, string> = {
  blood_pressure: '#F44336',
  blood_sugar: '#FF9800',
  weight: '#4CAF50',
  temperature: '#2196F3',
  heart_rate: '#E91E63',
  custom: '#9E9E9E',
};

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  backLink: { color: 'var(--accent-meds)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  form: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' },
  formRow: { display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' as const },
  input: {
    flex: '1 1 140px', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: '0.85rem',
    color: 'var(--text)', outline: 'none',
  },
  select: {
    flex: '1 1 140px', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: '0.85rem',
    color: 'var(--text)', outline: 'none',
  },
  btnPrimary: {
    background: 'var(--accent-meds)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', padding: '0.5rem 1.25rem', fontSize: '0.85rem',
    fontWeight: 600, cursor: 'pointer',
  },
  card: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '0.75rem',
    display: 'flex', alignItems: 'center' as const, gap: '1rem',
  },
  typeBadge: {
    fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.5rem',
    borderRadius: 'var(--radius-sm)', color: '#fff',
  },
  value: { fontWeight: 600, fontSize: '1.1rem', color: 'var(--text)' },
  unit: { fontSize: '0.8rem', color: 'var(--text-secondary)' },
  meta: { fontSize: '0.75rem', color: 'var(--text-tertiary)' },
  trendRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, marginBottom: '0.75rem' },
  trendCard: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '0.75rem 1rem', flex: '1 1 120px',
    textAlign: 'center' as const,
  },
  trendValue: { fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-meds)' },
  trendLabel: { fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' },
  empty: { textAlign: 'center' as const, color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.9rem' },
};

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [type, setType] = useState('blood_pressure');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('mmHg');
  const [formNotes, setFormNotes] = useState('');

  // Trend filter
  const [trendType, setTrendType] = useState('blood_pressure');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(async () => {
    try {
      const [allMeasurements, trendData] = await Promise.all([
        fetchMeasurements(),
        fetchMeasurementTrend(trendType, thirtyDaysAgo, today + 'T23:59:59'),
      ]);
      setMeasurements(allMeasurements as Measurement[]);
      setTrend(trendData as TrendPoint[]);
    } catch (err) {
      console.error('Failed to load measurements:', err);
    } finally {
      setLoading(false);
    }
  }, [trendType, thirtyDaysAgo, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When type changes, update default unit
  const handleTypeChange = useCallback((newType: string) => {
    setType(newType);
    const def = MEASUREMENT_TYPES.find((t) => t.value === newType);
    if (def) setUnit(def.defaultUnit);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!value.trim()) return;
    const id = crypto.randomUUID();
    await doLogMeasurement(id, {
      type: type as 'blood_pressure' | 'blood_sugar' | 'weight' | 'temperature' | 'heart_rate' | 'custom',
      value: value.trim(),
      unit: unit.trim(),
      notes: formNotes.trim() || undefined,
    });
    setValue('');
    setFormNotes('');
    await loadData();
  }, [type, value, unit, formNotes, loadData]);

  // Compute trend stats
  const trendValues = trend.map((p) => parseFloat(p.value)).filter((v) => !isNaN(v));
  const trendMin = trendValues.length > 0 ? Math.min(...trendValues) : null;
  const trendMax = trendValues.length > 0 ? Math.max(...trendValues) : null;
  const trendAvg = trendValues.length > 0
    ? Math.round((trendValues.reduce((s, v) => s + v, 0) / trendValues.length) * 10) / 10
    : null;

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading measurements...</div></div>;
  }

  return (
    <div style={styles.page}>
      <Link href="/meds" style={styles.backLink}>Back to Medications</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Health Measurements</h1>
        <p style={styles.subtitle}>Track vital signs and health metrics</p>
      </div>

      {/* Log Measurement Form */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Log Measurement</h2>
        <div style={styles.form}>
          <div style={styles.formRow}>
            <select style={styles.select} value={type} onChange={(e) => handleTypeChange(e.target.value)}>
              {MEASUREMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              style={styles.input}
              type="text"
              placeholder="Value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <div style={styles.formRow}>
            <input
              style={{ ...styles.input, flex: '1 1 100%' }}
              type="text"
              placeholder="Notes (optional)"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
          <button style={styles.btnPrimary} onClick={handleSubmit}>Log Measurement</button>
        </div>
      </div>

      {/* Trend Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>30-Day Trend</h2>
        <div style={{ marginBottom: '0.75rem' }}>
          <select style={styles.select} value={trendType} onChange={(e) => setTrendType(e.target.value)}>
            {MEASUREMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        {trendValues.length === 0 ? (
          <div style={styles.empty}>No data for this measurement type in the last 30 days.</div>
        ) : (
          <div style={styles.trendRow}>
            <div style={styles.trendCard}>
              <div style={styles.trendValue}>{trendMin}</div>
              <div style={styles.trendLabel}>Min</div>
            </div>
            <div style={styles.trendCard}>
              <div style={styles.trendValue}>{trendAvg}</div>
              <div style={styles.trendLabel}>Avg</div>
            </div>
            <div style={styles.trendCard}>
              <div style={styles.trendValue}>{trendMax}</div>
              <div style={styles.trendLabel}>Max</div>
            </div>
            <div style={styles.trendCard}>
              <div style={styles.trendValue}>{trendValues.length}</div>
              <div style={styles.trendLabel}>Readings</div>
            </div>
          </div>
        )}
      </div>

      {/* Measurements List */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>All Measurements</h2>
        {measurements.length === 0 ? (
          <div style={styles.empty}>No measurements recorded yet.</div>
        ) : (
          measurements.slice(0, 50).map((m) => (
            <div key={m.id} style={styles.card}>
              <span style={{ ...styles.typeBadge, background: TYPE_COLORS[m.type] ?? '#9E9E9E' }}>
                {m.type.replace('_', ' ')}
              </span>
              <div style={{ flex: 1 }}>
                <span style={styles.value}>{m.value}</span>{' '}
                <span style={styles.unit}>{m.unit}</span>
                {m.notes && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                    {m.notes}
                  </div>
                )}
              </div>
              <div style={styles.meta}>
                {new Date(m.measuredAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
