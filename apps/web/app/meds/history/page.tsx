'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchAdherenceCalendar,
  fetchActiveMedications,
  fetchAdherenceStats,
  fetchStreak,
} from '../actions';

interface MedDayStatus {
  medicationId: string;
  name: string;
  status: 'taken' | 'missed' | 'late' | 'partial' | 'none';
  accentColor: string;
}

interface CalendarDay {
  date: string;
  meds: MedDayStatus[];
}

interface MedInfo {
  id: string;
  name: string;
}

interface MedStats {
  rate: number;
  streak: number;
  totalTaken: number;
  totalMissed: number;
  totalLate: number;
}

const STATUS_COLORS: Record<string, string> = {
  taken: '#4CAF50',
  missed: '#F44336',
  late: '#FF9800',
  partial: '#FFC107',
  none: 'var(--surface)',
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  backLink: { color: 'var(--accent-meds)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  monthNav: { display: 'flex', alignItems: 'center' as const, gap: '1rem', marginBottom: '1rem' },
  monthBtn: {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    padding: '0.3rem 0.65rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer',
  },
  monthLabel: { fontWeight: 600, fontSize: '1rem', color: 'var(--text)' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '1rem' },
  calDayLabel: { fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'center' as const, padding: '0.25rem 0' },
  calCell: {
    aspectRatio: '1', borderRadius: 'var(--radius-sm)', display: 'flex',
    flexDirection: 'column' as const, alignItems: 'center' as const,
    justifyContent: 'center' as const, fontSize: '0.65rem', color: 'var(--text-secondary)',
    border: '1px solid var(--border)', cursor: 'default',
  },
  legend: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, marginBottom: '1rem' },
  legendItem: { display: 'flex', alignItems: 'center' as const, gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)' },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  statsRow: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  statCard: {
    flex: '1 1 120px', background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem', textAlign: 'center' as const,
  },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-meds)' },
  statLabel: { fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' },
  medBreakdown: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '0.75rem',
  },
  medName: { fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' },
  adherenceBar: { marginTop: '0.5rem', display: 'flex', alignItems: 'center' as const, gap: '0.5rem' },
  adherenceTrack: { flex: 1, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' as const },
  adherenceFill: { height: '100%', background: 'var(--accent-meds)', borderRadius: 3, transition: 'width 0.3s ease' },
  adherenceLabel: { fontSize: '0.75rem', color: 'var(--text-tertiary)', minWidth: 40, textAlign: 'right' as const },
  medMeta: { fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', display: 'flex', gap: '1rem' },
  empty: { textAlign: 'center' as const, color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.9rem' },
};

export default function HistoryPage() {
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [meds, setMeds] = useState<MedInfo[]>([]);
  const [medStats, setMedStats] = useState<Record<string, MedStats>>({});
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  const monthStr = `${calYear}-${String(calMonth).padStart(2, '0')}`;

  const loadData = useCallback(async () => {
    try {
      const [calData, activeMeds] = await Promise.all([
        fetchAdherenceCalendar(monthStr),
        fetchActiveMedications(),
      ]);
      const calDays = calData as CalendarDay[];
      const medsData = activeMeds as MedInfo[];
      setCalendar(calDays);
      setMeds(medsData);

      // Load per-medication stats
      const stats: Record<string, MedStats> = {};
      for (const med of medsData) {
        try {
          const [adherence, streak] = await Promise.all([
            fetchAdherenceStats(med.id, 30),
            fetchStreak(med.id),
          ]);
          stats[med.id] = {
            ...(adherence as MedStats),
            streak: streak as number,
          };
        } catch {
          stats[med.id] = { rate: 0, streak: 0, totalTaken: 0, totalMissed: 0, totalLate: 0 };
        }
      }
      setMedStats(stats);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const prevMonth = useCallback(() => {
    if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1); }
    else { setCalMonth((m) => m - 1); }
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1); }
    else { setCalMonth((m) => m + 1); }
  }, [calMonth]);

  // Compute overall stats from calendar
  const overallTaken = calendar.reduce((sum, day) => sum + day.meds.filter((m) => m.status === 'taken').length, 0);
  const overallMissed = calendar.reduce((sum, day) => sum + day.meds.filter((m) => m.status === 'missed').length, 0);
  const overallPartial = calendar.reduce((sum, day) => sum + day.meds.filter((m) => m.status === 'partial' || m.status === 'late').length, 0);
  const overallTotal = overallTaken + overallMissed + overallPartial;
  const overallRate = overallTotal > 0 ? Math.round((overallTaken / overallTotal) * 100) : 100;

  // Determine dominant status for each calendar day
  function dayColor(day: CalendarDay): string {
    const statuses = day.meds.map((m) => m.status).filter((s) => s !== 'none');
    if (statuses.length === 0) return STATUS_COLORS.none;
    if (statuses.every((s) => s === 'taken')) return STATUS_COLORS.taken;
    if (statuses.every((s) => s === 'missed')) return STATUS_COLORS.missed;
    if (statuses.some((s) => s === 'missed')) return STATUS_COLORS.partial;
    if (statuses.some((s) => s === 'late')) return STATUS_COLORS.late;
    return STATUS_COLORS.taken;
  }

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading adherence history...</div></div>;
  }

  // Calendar grid with leading empty cells
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();
  const calendarCells: (CalendarDay | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (const day of calendar) calendarCells.push(day);

  return (
    <div style={styles.page}>
      <Link href="/meds" style={styles.backLink}>Back to Medications</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Adherence History</h1>
        <p style={styles.subtitle}>Track your medication adherence over time</p>
      </div>

      {/* Overall Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{overallRate}%</div>
          <div style={styles.statLabel}>Adherence</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{overallTaken}</div>
          <div style={styles.statLabel}>Taken</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{overallMissed}</div>
          <div style={styles.statLabel}>Missed</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{meds.length}</div>
          <div style={styles.statLabel}>Active Meds</div>
        </div>
      </div>

      {/* Calendar */}
      <div style={styles.section}>
        <div style={styles.monthNav}>
          <button style={styles.monthBtn} onClick={prevMonth}>Prev</button>
          <span style={styles.monthLabel}>{MONTH_NAMES[calMonth - 1]} {calYear}</span>
          <button style={styles.monthBtn} onClick={nextMonth}>Next</button>
        </div>

        <div style={styles.legend}>
          {(['taken', 'missed', 'late', 'partial'] as const).map((status) => (
            <div key={status} style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: STATUS_COLORS[status] }} />
              <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
          ))}
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
                background: cell ? dayColor(cell) : 'transparent',
                border: cell ? '1px solid var(--border)' : 'none',
                color: cell && dayColor(cell) !== STATUS_COLORS.none ? '#fff' : 'var(--text-secondary)',
              }}
              title={cell ? `${cell.date}: ${cell.meds.map((m) => `${m.name}: ${m.status}`).join(', ')}` : ''}
            >
              {cell ? parseInt(cell.date.slice(8, 10), 10) : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Per-Medication Breakdown */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Per-Medication Breakdown</h2>
        {meds.length === 0 ? (
          <div style={styles.empty}>No active medications to show.</div>
        ) : (
          meds.map((med) => {
            const stats = medStats[med.id];
            return (
              <div key={med.id} style={styles.medBreakdown}>
                <div style={styles.medName}>{med.name}</div>
                <div style={styles.adherenceBar}>
                  <div style={styles.adherenceTrack}>
                    <div style={{ ...styles.adherenceFill, width: `${stats?.rate ?? 0}%` }} />
                  </div>
                  <span style={styles.adherenceLabel}>{Math.round(stats?.rate ?? 0)}%</span>
                </div>
                <div style={styles.medMeta}>
                  <span>Streak: {stats?.streak ?? 0} days</span>
                  <span>Taken: {stats?.totalTaken ?? 0}</span>
                  <span>Missed: {stats?.totalMissed ?? 0}</span>
                  <span>Late: {stats?.totalLate ?? 0}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
