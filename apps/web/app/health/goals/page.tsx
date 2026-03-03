'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchActiveGoals, doCreateGoal, doDeactivateGoal } from '../actions';
import type { GoalDomain, GoalPeriod, GoalDirection } from '@mylife/health';

interface Goal {
  id: string;
  domain: string;
  metric: string;
  target_value: number;
  unit: string | null;
  period: string;
  direction: string;
  label: string | null;
  is_active: number;
  created_at: string;
}

const DOMAINS: { id: GoalDomain; label: string }[] = [
  { id: 'steps', label: 'Steps' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'water', label: 'Water' },
  { id: 'fasting', label: 'Fasting' },
  { id: 'weight', label: 'Weight' },
  { id: 'adherence', label: 'Med Adherence' },
  { id: 'custom', label: 'Custom' },
];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  backLink: { color: '#10B981', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' },
  subtitle: { color: '#9CA3AF', marginBottom: '2rem' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#D1D5DB' },
  card: { background: '#1E1E1E', borderRadius: 8, padding: '1rem', border: '1px solid #333', marginBottom: '0.75rem' },
  form: { background: '#1E1E1E', borderRadius: 8, padding: '1.25rem', border: '1px solid #333', marginBottom: '2rem' },
  formRow: { display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' as const, marginBottom: '0.75rem' },
  input: {
    background: '#111', border: '1px solid #333', borderRadius: 6, padding: '0.5rem 0.75rem',
    fontSize: '0.85rem', color: '#E5E7EB', width: 120,
  },
  select: {
    background: '#111', border: '1px solid #333', borderRadius: 6, padding: '0.5rem 0.75rem',
    fontSize: '0.85rem', color: '#E5E7EB',
  },
  label: { fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.25rem' },
  btn: {
    background: '#10B981', color: '#fff', border: 'none', borderRadius: 6,
    padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  },
  btnDanger: {
    background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: 6,
    padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer',
  },
  goalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontWeight: 600, color: '#E5E7EB', fontSize: '0.95rem' },
  goalMeta: { fontSize: '0.8rem', color: '#9CA3AF', marginTop: '0.25rem' },
  empty: { textAlign: 'center' as const, color: '#6B7280', padding: '2rem', fontSize: '0.9rem' },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [domain, setDomain] = useState<GoalDomain>('steps');
  const [metric, setMetric] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [period, setPeriod] = useState<GoalPeriod>('daily');
  const [direction, setDirection] = useState<GoalDirection>('at_least');
  const [label, setLabel] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetchActiveGoals();
      setGoals(data as Goal[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const val = parseFloat(targetValue);
    if (isNaN(val)) return;
    await doCreateGoal({
      domain,
      metric: metric.trim() || domain,
      target_value: val,
      unit: unit.trim() || undefined,
      period,
      direction,
      label: label.trim() || undefined,
    });
    setMetric('');
    setTargetValue('');
    setUnit('');
    setLabel('');
    await load();
  };

  const handleDeactivate = async (goalId: string) => {
    await doDeactivateGoal(goalId);
    await load();
  };

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading goals...</div></div>;
  }

  return (
    <div style={styles.page}>
      <Link href="/health" style={styles.backLink}>Back to Health</Link>
      <h1 style={styles.title}>Health Goals</h1>
      <p style={styles.subtitle}>Set and track your health targets</p>

      {/* Create Goal Form */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>New Goal</div>
        <div style={styles.form}>
          <div style={styles.formRow}>
            <div>
              <div style={styles.label}>Domain</div>
              <select style={styles.select} value={domain} onChange={(e) => setDomain(e.target.value as GoalDomain)}>
                {DOMAINS.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={styles.label}>Direction</div>
              <select style={styles.select} value={direction} onChange={(e) => setDirection(e.target.value as GoalDirection)}>
                <option value="at_least">At Least</option>
                <option value="at_most">At Most</option>
                <option value="exactly">Exactly</option>
              </select>
            </div>
            <div>
              <div style={styles.label}>Target</div>
              <input
                style={styles.input}
                type="number"
                placeholder="10000"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
            <div>
              <div style={styles.label}>Period</div>
              <select style={styles.select} value={period} onChange={(e) => setPeriod(e.target.value as GoalPeriod)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div style={styles.formRow}>
            {domain === 'custom' && (
              <div>
                <div style={styles.label}>Metric Name</div>
                <input style={styles.input} value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="e.g., meditation" />
              </div>
            )}
            <div>
              <div style={styles.label}>Unit (optional)</div>
              <input style={styles.input} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="steps, hrs, %" />
            </div>
            <div>
              <div style={styles.label}>Label (optional)</div>
              <input style={{ ...styles.input, width: 200 }} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Walk 10K steps daily" />
            </div>
          </div>
          <button style={styles.btn} onClick={handleCreate}>Create Goal</button>
        </div>
      </div>

      {/* Active Goals */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Active Goals ({goals.length})</div>
        {goals.length === 0 ? (
          <div style={styles.empty}>No active goals. Create one above to get started.</div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} style={styles.card}>
              <div style={styles.goalHeader}>
                <div>
                  <div style={styles.goalName}>
                    {goal.label ?? `${goal.domain}: ${goal.metric}`}
                  </div>
                  <div style={styles.goalMeta}>
                    {goal.direction.replace('_', ' ')} {goal.target_value} {goal.unit ?? ''} ({goal.period})
                  </div>
                </div>
                <button style={styles.btnDanger} onClick={() => handleDeactivate(goal.id)}>
                  Deactivate
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
