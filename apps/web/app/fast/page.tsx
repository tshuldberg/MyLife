'use client';

import { useEffect, useState, useCallback } from 'react';
import { computeTimerState, formatDuration, type ActiveFast } from '@mylife/fast';
import {
  fetchActiveFast,
  doStartFast,
  doEndFast,
  fetchProtocols,
  fetchStreaks,
} from './actions';

type Protocol = {
  id: string;
  name: string;
  fasting_hours: number;
  eating_hours: number;
  description: string | null;
};

type Streaks = {
  currentStreak: number;
  longestStreak: number;
  totalFasts: number;
};

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function FastPage() {
  const [loading, setLoading] = useState(true);
  const [activeFast, setActiveFast] = useState<ActiveFast | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [streaks, setStreaks] = useState<Streaks>({ currentStreak: 0, longestStreak: 0, totalFasts: 0 });
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');

  const timerState = computeTimerState(activeFast, new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const [fast, protos, streakData] = await Promise.all([
      fetchActiveFast(),
      fetchProtocols(),
      fetchStreaks(),
    ]);
    setActiveFast(fast as ActiveFast | null);
    const protoList = protos as Protocol[];
    setProtocols(protoList);
    setStreaks(streakData as Streaks);
    if (protoList.length > 0 && !selectedProtocol) {
      setSelectedProtocol(protoList[0].id);
    }
    setLoading(false);
  }, [selectedProtocol]);

  useEffect(() => {
    void load();
  }, []);

  async function handleStart() {
    const proto = protocols.find((p) => p.id === selectedProtocol);
    if (!proto) return;
    const id = generateId();
    await doStartFast(id, proto.id, proto.fasting_hours);
    await load();
  }

  async function handleEnd() {
    await doEndFast();
    await load();
  }

  if (loading) return <div>Loading...</div>;

  const isActive = timerState.state === 'fasting';

  return (
    <div>
      <h1>MyFast</h1>

      {isActive ? (
        <div>
          <p>Fasting in progress</p>
          <p>{formatDuration(timerState.elapsed)}</p>
          <button type="button" onClick={handleEnd}>End Fast</button>
        </div>
      ) : (
        <div>
          <p>Ready to fast</p>
          <div>
            {protocols.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProtocol(p.id)}
                aria-pressed={selectedProtocol === p.id}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleStart}>Start Fast</button>
        </div>
      )}

      <div>
        <div>
          <span>Current Streak</span>
          <span>{streaks.currentStreak}</span>
        </div>
        <div>
          <span>Longest Streak</span>
          <span>{streaks.longestStreak}</span>
        </div>
        <div>
          <span>Total Fasts</span>
          <span>{streaks.totalFasts}</span>
        </div>
      </div>
    </div>
  );
}
