'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchLatestVitals, fetchVitals, doLogVital } from '../actions';
import type { VitalType } from '@mylife/health';

type LatestMap = Awaited<ReturnType<typeof fetchLatestVitals>>;

const VITAL_TYPES: { key: VitalType; label: string; unit: string; icon: string }[] = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: '❤️' },
  { key: 'resting_heart_rate', label: 'Resting HR', unit: 'bpm', icon: '💚' },
  { key: 'hrv', label: 'HRV', unit: 'ms', icon: '📊' },
  { key: 'blood_oxygen', label: 'Blood Oxygen', unit: '%', icon: '🫁' },
  { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: '🩺' },
  { key: 'body_temperature', label: 'Temperature', unit: '°F', icon: '🌡️' },
  { key: 'steps', label: 'Steps', unit: 'steps', icon: '👣' },
  { key: 'active_energy', label: 'Active Energy', unit: 'kcal', icon: '🔥' },
];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  backLink: { color: '#10B981', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' },
  subtitle: { color: '#9CA3AF', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: { background: '#1E1E1E', borderRadius: 8, padding: '1rem', border: '1px solid #333' },
  cardTitle: { fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase' as const, marginBottom: '0.5rem' },
  cardValue: { fontSize: '1.5rem', fontWeight: 700, color: '#10B981' },
  cardUnit: { fontSize: '0.75rem', color: '#9CA3AF' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#D1D5DB' },
  form: { background: '#1E1E1E', borderRadius: 8, padding: '1.25rem', border: '1px solid #333', marginBottom: '2rem' },
  formRow: { display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' as const },
  input: {
    background: '#111', border: '1px solid #333', borderRadius: 6, padding: '0.5rem 0.75rem',
    fontSize: '0.85rem', color: '#E5E7EB', width: 120,
  },
  select: {
    background: '#111', border: '1px solid #333', borderRadius: 6, padding: '0.5rem 0.75rem',
    fontSize: '0.85rem', color: '#E5E7EB',
  },
  btn: {
    background: '#10B981', color: '#fff', border: 'none', borderRadius: 6,
    padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  },
  label: { fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.25rem' },
  historyRow: {
    display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0',
    borderBottom: '1px solid #333', fontSize: '0.85rem',
  },
  empty: { textAlign: 'center' as const, color: '#6B7280', padding: '2rem', fontSize: '0.9rem' },
};

export default function VitalsPage() {
  const [latest, setLatest] = useState<LatestMap | null>(null);
  const [history, setHistory] = useState<{ value: number; value_secondary?: number | null; recorded_at: string }[]>([]);
  const [selectedType, setSelectedType] = useState<VitalType>('heart_rate');
  const [logType, setLogType] = useState<VitalType>('heart_rate');
  const [logValue, setLogValue] = useState('');
  const [logSecondary, setLogSecondary] = useState('');
  const [saving, setSaving] = useState(false);

  const loadLatest = useCallback(async () => {
    const data = await fetchLatestVitals();
    setLatest(data);
  }, []);

  const loadHistory = useCallback(async () => {
    const data = await fetchVitals(selectedType, 20);
    setHistory(data as { value: number; value_secondary?: number | null; recorded_at: string }[]);
  }, [selectedType]);

  useEffect(() => { loadLatest(); }, [loadLatest]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleLog = async () => {
    const val = parseFloat(logValue);
    if (isNaN(val)) return;
    setSaving(true);
    const typeInfo = VITAL_TYPES.find((t) => t.key === logType);
    const secondary = logType === 'blood_pressure' ? parseFloat(logSecondary) : undefined;
    await doLogVital(logType, val, typeInfo?.unit ?? '', isNaN(secondary as number) ? undefined : secondary);
    setLogValue('');
    setLogSecondary('');
    setSaving(false);
    await Promise.all([loadLatest(), loadHistory()]);
  };

  const formatVitalValue = (key: VitalType, vital: { value: number; value_secondary?: number | null } | null) => {
    if (!vital) return '--';
    if (key === 'blood_pressure' && vital.value_secondary) {
      return `${Math.round(vital.value)}/${Math.round(vital.value_secondary)}`;
    }
    return key === 'steps' || key === 'active_energy'
      ? Math.round(vital.value).toLocaleString()
      : Math.round(vital.value).toString();
  };

  return (
    <div style={styles.page}>
      <Link href="/health" style={styles.backLink}>Back to Health</Link>
      <h1 style={styles.title}>Vitals</h1>
      <p style={styles.subtitle}>Heart rate, blood pressure, SpO2, and more</p>

      {/* Latest Readings */}
      <div style={styles.grid}>
        {VITAL_TYPES.map((vt) => {
          const val = latest?.[vt.key] as { value: number; value_secondary?: number | null } | null | undefined;
          return (
            <div
              key={vt.key}
              style={{ ...styles.card, cursor: 'pointer', borderColor: selectedType === vt.key ? '#10B981' : '#333' }}
              onClick={() => setSelectedType(vt.key)}
            >
              <div style={styles.cardTitle}>{vt.icon} {vt.label}</div>
              <div style={styles.cardValue}>{formatVitalValue(vt.key, val ?? null)}</div>
              <div style={styles.cardUnit}>{vt.unit}</div>
            </div>
          );
        })}
      </div>

      {/* Log Vital */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Log Measurement</div>
        <div style={styles.form}>
          <div style={styles.formRow}>
            <div>
              <div style={styles.label}>Type</div>
              <select
                style={styles.select}
                value={logType}
                onChange={(e) => setLogType(e.target.value as VitalType)}
              >
                {VITAL_TYPES.map((vt) => (
                  <option key={vt.key} value={vt.key}>{vt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={styles.label}>{logType === 'blood_pressure' ? 'Systolic' : 'Value'}</div>
              <input
                style={styles.input}
                type="number"
                placeholder="0"
                value={logValue}
                onChange={(e) => setLogValue(e.target.value)}
              />
            </div>
            {logType === 'blood_pressure' && (
              <div>
                <div style={styles.label}>Diastolic</div>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="0"
                  value={logSecondary}
                  onChange={(e) => setLogSecondary(e.target.value)}
                />
              </div>
            )}
            <button style={{ ...styles.btn, opacity: saving ? 0.5 : 1 }} onClick={handleLog} disabled={saving}>
              {saving ? 'Saving...' : 'Log'}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          {VITAL_TYPES.find((t) => t.key === selectedType)?.label ?? selectedType} History
        </div>
        {history.length === 0 ? (
          <div style={styles.empty}>No readings yet for this vital type</div>
        ) : (
          history.map((entry, i) => (
            <div key={i} style={styles.historyRow}>
              <span style={{ color: '#E5E7EB' }}>
                {selectedType === 'blood_pressure' && entry.value_secondary
                  ? `${Math.round(entry.value)}/${Math.round(entry.value_secondary)}`
                  : Math.round(entry.value).toLocaleString()}{' '}
                <span style={{ color: '#9CA3AF' }}>
                  {VITAL_TYPES.find((t) => t.key === selectedType)?.unit}
                </span>
              </span>
              <span style={{ color: '#9CA3AF' }}>
                {new Date(entry.recorded_at).toLocaleDateString()}{' '}
                {new Date(entry.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
