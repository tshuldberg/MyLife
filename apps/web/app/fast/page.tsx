'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchActiveFast, doStartFast, doEndFast, fetchProtocols, fetchStreaks } from './actions';
import { computeTimerState, formatDuration } from '@mylife/fast';

interface ProtocolRow {
  id: string;
  name: string;
  fasting_hours: number;
  eating_hours: number;
  description: string | null;
}

export default function FastTimerPage() {
  const [timerState, setTimerState] = useState(computeTimerState(null, new Date()));
  const [protocols, setProtocols] = useState<ProtocolRow[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('16:8');
  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0, totalFasts: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [active, protos, streakData] = await Promise.all([
      fetchActiveFast(),
      fetchProtocols(),
      fetchStreaks(),
    ]);
    setTimerState(computeTimerState(active, new Date()));
    setProtocols(protos);
    setStreaks(streakData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tick the timer every second when fasting
  useEffect(() => {
    if (timerState.state !== 'fasting') return;
    const interval = setInterval(() => {
      setTimerState((prev) =>
        prev.activeFast ? computeTimerState(prev.activeFast, new Date()) : prev,
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState.state]);

  const handleStart = async () => {
    const proto = protocols.find((p) => p.id === selectedProtocol);
    if (!proto) return;
    const id = crypto.randomUUID();
    await doStartFast(id, proto.id, proto.fasting_hours);
    await loadData();
  };

  const handleStop = async () => {
    await doEndFast();
    await loadData();
  };

  if (loading) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>Timer</h1>
          <p style={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Timer</h1>
        <p style={styles.subtitle}>Intermittent fasting tracker</p>
      </div>

      {/* Timer display */}
      <div style={styles.timerCard}>
        <div style={styles.timerDisplay}>
          <span style={styles.timerTime}>
            {formatDuration(timerState.state === 'fasting' ? timerState.elapsed : 0)}
          </span>
          <span style={styles.timerLabel}>
            {timerState.state === 'fasting'
              ? timerState.targetReached
                ? 'Target reached!'
                : `${formatDuration(timerState.remaining)} remaining`
              : 'Ready to fast'}
          </span>
        </div>

        {/* Progress bar */}
        {timerState.state === 'fasting' && (
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.round(timerState.progress * 100)}%`,
                backgroundColor: timerState.targetReached ? '#22C55E' : 'var(--accent-fast, #14B8A6)',
              }}
            />
          </div>
        )}

        {/* Start/Stop button */}
        {timerState.state === 'idle' ? (
          <div>
            <div style={styles.protocolSelector}>
              {protocols.map((proto) => (
                <button
                  key={proto.id}
                  onClick={() => setSelectedProtocol(proto.id)}
                  style={{
                    ...styles.protocolChip,
                    ...(selectedProtocol === proto.id ? styles.protocolChipActive : {}),
                  }}
                >
                  {proto.id}
                </button>
              ))}
            </div>
            <button onClick={handleStart} style={styles.startButton}>
              Start Fast
            </button>
          </div>
        ) : (
          <button onClick={handleStop} style={styles.stopButton}>
            End Fast
          </button>
        )}
      </div>

      {/* Streaks */}
      <div style={styles.streakGrid}>
        <div style={styles.streakCard}>
          <span style={styles.streakValue}>{streaks.currentStreak}</span>
          <span style={styles.streakLabel}>Current Streak</span>
        </div>
        <div style={styles.streakCard}>
          <span style={styles.streakValue}>{streaks.longestStreak}</span>
          <span style={styles.streakLabel}>Longest Streak</span>
        </div>
        <div style={styles.streakCard}>
          <span style={styles.streakValue}>{streaks.totalFasts}</span>
          <span style={styles.streakLabel}>Total Fasts</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  timerCard: {
    padding: '32px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  timerDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
  },
  timerTime: {
    fontSize: '56px',
    fontWeight: 700,
    color: 'var(--accent-fast, #14B8A6)',
    fontVariantNumeric: 'tabular-nums',
  },
  timerLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  progressBar: {
    height: '8px',
    backgroundColor: 'var(--surface-elevated)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 1s linear',
  },
  protocolSelector: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: '16px',
  },
  protocolChip: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  protocolChipActive: {
    borderColor: 'var(--accent-fast, #14B8A6)',
    color: 'var(--accent-fast, #14B8A6)',
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  startButton: {
    padding: '14px 48px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: 'var(--accent-fast, #14B8A6)',
    color: '#0E0C09',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  stopButton: {
    padding: '14px 48px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: '#E8725C',
    color: '#0E0C09',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  streakGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  streakCard: {
    padding: '16px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  streakValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--accent-fast, #14B8A6)',
  },
  streakLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
};
