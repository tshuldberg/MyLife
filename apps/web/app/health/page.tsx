'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDashboard, fetchLatestVitals, fetchOverallStats, fetchSleepSessions } from './actions';

type DashboardData = Awaited<ReturnType<typeof fetchDashboard>>;
type VitalsData = Awaited<ReturnType<typeof fetchLatestVitals>>;
type StatsData = Awaited<ReturnType<typeof fetchOverallStats>>;

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' },
  subtitle: { color: '#9CA3AF', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: { background: '#1E1E1E', borderRadius: 8, padding: '1rem', border: '1px solid #333' },
  cardTitle: { fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase' as const, marginBottom: '0.5rem' },
  cardValue: { fontSize: '1.5rem', fontWeight: 700, color: '#10B981' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#D1D5DB' },
  link: { color: '#10B981', textDecoration: 'none', fontSize: '0.875rem' },
  navGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '2rem' },
  navCard: {
    background: '#1E1E1E', borderRadius: 8, padding: '1rem', border: '1px solid #333',
    textDecoration: 'none', color: '#E5E7EB', cursor: 'pointer',
  },
  navLabel: { fontSize: '0.875rem', fontWeight: 500 },
  navDesc: { fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' },
};

export default function HealthPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [vitals, setVitals] = useState<VitalsData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);

  const load = useCallback(async () => {
    const [d, v, s] = await Promise.all([fetchDashboard(), fetchLatestVitals(), fetchOverallStats()]);
    setData(d);
    setVitals(v);
    setStats(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>MyHealth</h1>
      <p style={styles.subtitle}>Your complete health companion</p>

      {/* Navigation */}
      <div style={styles.navGrid}>
        <Link href="/health/vitals" style={styles.navCard}>
          <div style={styles.navLabel}>Vitals</div>
          <div style={styles.navDesc}>Heart rate, BP, SpO2</div>
        </Link>
        <Link href="/health/sleep" style={styles.navCard}>
          <div style={styles.navLabel}>Sleep</div>
          <div style={styles.navDesc}>Sleep sessions & quality</div>
        </Link>
        <Link href="/health/mood" style={styles.navCard}>
          <div style={styles.navLabel}>Mood</div>
          <div style={styles.navDesc}>Mood journal & calendar</div>
        </Link>
        <Link href="/health/goals" style={styles.navCard}>
          <div style={styles.navLabel}>Goals</div>
          <div style={styles.navDesc}>Health targets</div>
        </Link>
        <Link href="/health/emergency" style={styles.navCard}>
          <div style={styles.navLabel}>Emergency</div>
          <div style={styles.navDesc}>ICE card</div>
        </Link>
        <Link href="/health/export" style={styles.navCard}>
          <div style={styles.navLabel}>Reports</div>
          <div style={styles.navDesc}>Doctor & therapy exports</div>
        </Link>
      </div>

      {/* Quick Stats */}
      {data && (
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Medications</div>
            <div style={styles.cardValue}>
              {data.todayDoseCount}/{data.medications.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>doses today</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Fasting</div>
            <div style={styles.cardValue}>
              {data.activeFast ? 'Active' : 'Idle'}
            </div>
            {data.activeFast && (
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                {data.activeFast.protocol}
              </div>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Steps</div>
            <div style={styles.cardValue}>
              {data.latestSteps?.toLocaleString() ?? '--'}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Heart Rate</div>
            <div style={styles.cardValue}>
              {data.latestHR ?? '--'}
            </div>
            {data.latestHR && <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>bpm</div>}
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Sleep</div>
            <div style={styles.cardValue}>
              {data.lastSleep
                ? `${Math.floor(data.lastSleep.durationMinutes / 60)}h ${data.lastSleep.durationMinutes % 60}m`
                : '--'}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Mood</div>
            <div style={styles.cardValue}>
              {data.todayMood?.mood ?? 'Not logged'}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Fasting Streak</div>
            <div style={styles.cardValue}>{data.streaks.currentStreak}</div>
          </div>

          {data.supplyAlertCount > 0 && (
            <div style={{ ...styles.card, borderColor: '#EF4444' }}>
              <div style={styles.cardTitle}>Supply Alerts</div>
              <div style={{ ...styles.cardValue, color: '#EF4444' }}>
                {data.supplyAlertCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>meds running low</div>
            </div>
          )}
        </div>
      )}

      {/* Overall Stats */}
      {stats && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>30-Day Overview</div>
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Adherence</div>
              <div style={styles.cardValue}>{stats.overallAdherence30d}%</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Mood Entries</div>
              <div style={styles.cardValue}>{stats.moodEntries30d}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Active Meds</div>
              <div style={styles.cardValue}>{stats.activeMedications}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Symptoms</div>
              <div style={styles.cardValue}>{stats.symptomEntries30d}</div>
            </div>
          </div>
        </div>
      )}

      {/* Goals */}
      {data && data.goals.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Active Goals</div>
          {data.goals.map((g) => (
            <div key={g.id} style={{ ...styles.card, marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 600 }}>
                {g.label ?? `${g.domain}: ${g.metric}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                Target: {g.targetValue} {g.unit ?? ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
          Health sync is only available on mobile devices
        </div>
      </div>
    </div>
  );
}
