'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  doCreateWorkoutLog,
  doCreateWorkoutProgram,
  doDeleteWorkoutLog,
  doDeleteWorkoutProgram,
  doSetActiveWorkoutProgram,
  fetchWorkoutLogs,
  fetchWorkoutOverview,
  fetchWorkoutPrograms,
} from './actions';
import type { WorkoutFocus, WorkoutLog, WorkoutProgram } from '@mylife/workouts';

export default function WorkoutsPage() {
  const [overview, setOverview] = useState({
    workouts: 0,
    totalMinutes: 0,
    totalCalories: 0,
    averageRpe: 0,
  });
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  const [programName, setProgramName] = useState('');
  const [programGoal, setProgramGoal] = useState('Build strength');
  const [logName, setLogName] = useState('');
  const [logFocus, setLogFocus] = useState<WorkoutFocus>('full_body');
  const [logDuration, setLogDuration] = useState('45');

  const loadData = useCallback(async () => {
    const [nextOverview, nextPrograms, nextLogs] = await Promise.all([
      fetchWorkoutOverview(),
      fetchWorkoutPrograms(),
      fetchWorkoutLogs({ limit: 100 }),
    ]);
    setOverview(nextOverview);
    setPrograms(nextPrograms);
    setLogs(nextLogs);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeProgram = useMemo(
    () => programs.find((program) => program.isActive) ?? null,
    [programs],
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>MyWorkouts</h1>
      <p style={styles.subtitle}>Track training logs and active programming.</p>

      <div style={styles.metrics}>
        <Metric label="Workouts" value={String(overview.workouts)} />
        <Metric label="Minutes" value={String(overview.totalMinutes)} />
        <Metric label="Calories" value={String(overview.totalCalories)} />
        <Metric label="Avg RPE" value={overview.workouts ? overview.averageRpe.toFixed(1) : '--'} />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Programs</h2>
        <div style={styles.row}>
          <input style={styles.input} value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="Program name" />
          <input style={styles.input} value={programGoal} onChange={(event) => setProgramGoal(event.target.value)} placeholder="Goal" />
          <button
            style={styles.primaryButton}
            onClick={() =>
              void doCreateWorkoutProgram(crypto.randomUUID(), {
                name: programName.trim() || 'New Program',
                goal: programGoal.trim() || 'General fitness',
                weeks: 8,
                sessionsPerWeek: 4,
                isActive: true,
              }).then(() => {
                setProgramName('');
                loadData();
              })
            }
          >
            Add Program
          </button>
        </div>

        <div style={styles.list}>
          {programs.map((program) => (
            <div key={program.id} style={styles.item}>
              <div>
                <div style={styles.itemTitle}>{program.name}</div>
                <div style={styles.meta}>{program.goal} · {program.weeks}w · {program.sessionsPerWeek}/wk</div>
              </div>
              <div style={styles.actions}>
                <button style={program.isActive ? styles.activeButton : styles.secondaryButton} onClick={() => void doSetActiveWorkoutProgram(program.isActive ? null : program.id).then(loadData)}>
                  {program.isActive ? 'Active' : 'Set Active'}
                </button>
                <button style={styles.dangerButton} onClick={() => void doDeleteWorkoutProgram(program.id).then(loadData)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {programs.length === 0 && <div style={styles.empty}>No workout programs yet.</div>}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Workout Logs {activeProgram ? `· ${activeProgram.name}` : ''}</h2>
        <div style={styles.row}>
          <input style={styles.input} value={logName} onChange={(event) => setLogName(event.target.value)} placeholder="Workout name" />
          <select style={styles.select} value={logFocus} onChange={(event) => setLogFocus(event.target.value as WorkoutFocus)}>
            {['full_body','upper_body','lower_body','push','pull','legs','cardio','mobility','custom'].map((focus) => (
              <option key={focus} value={focus}>{focus.replace('_', ' ')}</option>
            ))}
          </select>
          <input style={styles.input} value={logDuration} onChange={(event) => setLogDuration(event.target.value)} placeholder="Duration" />
          <button
            style={styles.primaryButton}
            onClick={() =>
              void doCreateWorkoutLog(crypto.randomUUID(), {
                name: logName.trim() || 'Workout',
                focus: logFocus,
                durationMin: Math.max(10, Number(logDuration) || 30),
                calories: Math.max(0, Math.round((Number(logDuration) || 30) * 7)),
                rpe: 7,
                completedAt: new Date().toISOString(),
              }).then(() => {
                setLogName('');
                loadData();
              })
            }
          >
            Add Log
          </button>
        </div>

        <div style={styles.list}>
          {logs.map((log) => (
            <div key={log.id} style={styles.item}>
              <div>
                <div style={styles.itemTitle}>{log.name}</div>
                <div style={styles.meta}>{log.focus.replace('_', ' ')} · {log.durationMin} min · {log.calories} cal · RPE {log.rpe}</div>
              </div>
              <button style={styles.dangerButton} onClick={() => void doDeleteWorkoutLog(log.id).then(loadData)}>
                Delete
              </button>
            </div>
          ))}
          {logs.length === 0 && <div style={styles.empty}>No workout logs yet.</div>}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  title: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 30,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 4,
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
  metrics: {
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
    color: '#EF4444',
    fontSize: 20,
    fontWeight: 700,
  },
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
  },
  sectionTitle: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 600,
  },
  row: {
    marginTop: 10,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
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
  primaryButton: {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: '#EF4444',
    color: '#fff',
    padding: '8px 12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  list: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 10,
    background: 'var(--surface-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    color: 'var(--text)',
    fontWeight: 600,
  },
  meta: {
    marginTop: 2,
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  actions: {
    display: 'flex',
    gap: 6,
  },
  secondaryButton: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    padding: '7px 10px',
    cursor: 'pointer',
  },
  activeButton: {
    border: '1px solid #EF4444',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#EF4444',
    padding: '7px 10px',
    cursor: 'pointer',
  },
  dangerButton: {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--danger)',
    color: '#fff',
    padding: '7px 10px',
    cursor: 'pointer',
  },
  empty: {
    padding: 14,
    textAlign: 'center',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-tertiary)',
  },
};
