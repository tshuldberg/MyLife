import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  computeTimerState,
  formatDuration,
  getActiveFast,
  getProtocols,
  getStreaks,
  refreshStreakCache,
  startFast,
  endFast,
  getCurrentFastingZone,
  getCurrentZoneProgress,
  getWaterIntake,
  incrementWaterIntake,
  listGoals,
  getGoalProgress,
  refreshGoalProgress,
} from '@mylife/fast';
import type { Goal } from '@mylife/fast';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

interface ProtocolRow {
  id: string;
  name: string;
  fasting_hours: number;
  eating_hours: number;
  description: string | null;
  is_custom: number;
  is_default: number;
  sort_order: number;
}

interface GoalProgressDisplay {
  label: string;
  current: number;
  target: number;
  completed: boolean;
}

function formatGoalValue(goal: Goal, value: number): number {
  if (goal.type === 'hours_per_week' || goal.type === 'hours_per_month') {
    return Math.round(value * 10) / 10;
  }
  return Math.round(value);
}

function primaryGoalProgress(db: ReturnType<typeof useDatabase>): GoalProgressDisplay | null {
  const goals = listGoals(db, false);
  if (goals.length === 0) return null;

  const preferred = goals.find((goal) => goal.type === 'fasts_per_week') ?? goals[0];
  const progress = getGoalProgress(db, preferred.id);
  if (!progress) return null;

  const label = preferred.label ?? 'Goal Progress';
  return {
    label,
    current: formatGoalValue(preferred, progress.currentValue),
    target: formatGoalValue(preferred, progress.targetValue),
    completed: progress.completed,
  };
}

export default function FastTimerScreen() {
  const db = useDatabase();
  const [timerState, setTimerState] = useState(() => computeTimerState(null, new Date()));
  const [protocols, setProtocols] = useState<ProtocolRow[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState('16:8');
  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0, totalFasts: 0 });
  const [waterCount, setWaterCount] = useState(0);
  const [waterTarget, setWaterTarget] = useState(8);
  const [goalProgress, setGoalProgress] = useState<GoalProgressDisplay | null>(null);

  const reloadDailyState = useCallback(() => {
    const water = getWaterIntake(db);
    setWaterCount(water.count);
    setWaterTarget(water.target);

    refreshGoalProgress(db);
    setGoalProgress(primaryGoalProgress(db));
  }, [db]);

  const load = useCallback(() => {
    const active = getActiveFast(db);
    const protocolRows = getProtocols(db) as ProtocolRow[];
    setProtocols(protocolRows);
    setSelectedProtocol((prev) => prev || protocolRows[0]?.id || '16:8');
    setTimerState(computeTimerState(active, new Date()));
    setStreaks(getStreaks(db));
    reloadDailyState();
  }, [db, reloadDailyState]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (timerState.state !== 'fasting') return;

    const interval = setInterval(() => {
      const active = getActiveFast(db);
      setTimerState(computeTimerState(active, new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, [db, timerState.state]);

  const activeProtocol = useMemo(
    () => protocols.find((protocol) => protocol.id === selectedProtocol) ?? protocols[0],
    [protocols, selectedProtocol],
  );

  const handleStart = () => {
    if (!activeProtocol) return;
    startFast(db, uuid(), activeProtocol.id, activeProtocol.fasting_hours);
    load();
  };

  const handleStop = () => {
    endFast(db, new Date());
    refreshStreakCache(db);
    load();
  };

  const handleLogWater = () => {
    const updated = incrementWaterIntake(db);
    setWaterCount(updated.count);
    setWaterTarget(updated.target);
  };

  const zone = getCurrentFastingZone(timerState.elapsed);
  const zoneProgress = getCurrentZoneProgress(timerState.elapsed);
  const waterProgress = waterTarget > 0 ? Math.min(1, waterCount / waterTarget) : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card style={styles.timerCard}>
        <Text style={styles.timerValue}>
          {formatDuration(timerState.state === 'fasting' ? timerState.elapsed : 0)}
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          {timerState.state === 'fasting'
            ? timerState.targetReached
              ? 'Target reached'
              : `${formatDuration(timerState.remaining)} remaining`
            : 'Ready to start'}
        </Text>

        {timerState.state === 'fasting' ? (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.round(timerState.progress * 100))}%`,
                  backgroundColor: timerState.targetReached
                    ? colors.success
                    : colors.modules.fast,
                },
              ]}
            />
          </View>
        ) : null}

        {timerState.state === 'idle' ? (
          <>
            <View style={styles.protocolRow}>
              {protocols.map((protocol) => {
                const selected = selectedProtocol === protocol.id;
                return (
                  <Pressable
                    key={protocol.id}
                    onPress={() => setSelectedProtocol(protocol.id)}
                    style={[styles.protocolChip, selected ? styles.protocolChipActive : null]}
                  >
                    <Text
                      variant="caption"
                      color={selected ? colors.background : colors.textSecondary}
                    >
                      {protocol.id}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.primaryButton} onPress={handleStart}>
              <Text variant="label" color={colors.background}>Start Fast</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.stopButton} onPress={handleStop}>
            <Text variant="label" color={colors.background}>End Fast</Text>
          </Pressable>
        )}
      </Card>

      <Card>
        <Text variant="subheading">Metabolic Zone</Text>
        <Text style={styles.zoneName}>{zone.name}</Text>
        <Text variant="caption" color={colors.textSecondary}>{zone.title}</Text>
        <Text variant="caption" color={colors.textSecondary} style={styles.zoneDescription}>{zone.description}</Text>
        <View style={styles.zoneTrack}>
          <View style={[styles.zoneFill, { width: `${Math.max(6, zoneProgress * 100)}%` }]} />
        </View>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text variant="subheading">Hydration</Text>
          <Text style={styles.metricValue}>{waterCount}/{waterTarget}</Text>
        </View>
        <View style={styles.zoneTrack}>
          <View style={[styles.zoneFill, { width: `${Math.max(4, waterProgress * 100)}%` }]} />
        </View>
        <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
          <Pressable style={styles.chipButton} onPress={handleLogWater}>
            <Text variant="label" color={colors.background}>Log Water</Text>
          </Pressable>
          {waterCount >= waterTarget ? (
            <Text variant="caption" color={colors.success}>Hydration Goal Met</Text>
          ) : null}
        </View>
      </Card>

      {goalProgress ? (
        <Card>
          <View style={styles.rowBetween}>
            <Text variant="subheading">{goalProgress.label}</Text>
            <Text style={[styles.metricValue, { color: goalProgress.completed ? colors.success : colors.modules.fast }]}>
              {goalProgress.current}/{goalProgress.target}
            </Text>
          </View>
          <View style={styles.zoneTrack}>
            <View
              style={[
                styles.zoneFill,
                {
                  width: `${Math.min(100, Math.round((goalProgress.current / Math.max(1, goalProgress.target)) * 100))}%`,
                  backgroundColor: goalProgress.completed ? colors.success : colors.modules.fast,
                },
              ]}
            />
          </View>
        </Card>
      ) : null}

      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Current Streak</Text>
          <Text style={styles.metricValue}>{streaks.currentStreak}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Longest Streak</Text>
          <Text style={styles.metricValue}>{streaks.longestStreak}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Total Fasts</Text>
          <Text style={styles.metricValue}>{streaks.totalFasts}</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  timerCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerValue: {
    color: colors.modules.fast,
    fontSize: 44,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  protocolRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  protocolChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  protocolChipActive: {
    borderColor: colors.modules.fast,
    backgroundColor: colors.modules.fast,
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: colors.modules.fast,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  stopButton: {
    borderRadius: 10,
    backgroundColor: '#E8725C',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '31.5%',
    minWidth: 94,
    gap: spacing.xs,
  },
  metricValue: {
    color: colors.modules.fast,
    fontSize: 22,
    fontWeight: '700',
  },
  zoneName: {
    color: colors.modules.fast,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  zoneDescription: {
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  zoneTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  zoneFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.modules.fast,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chipButton: {
    borderRadius: 999,
    backgroundColor: colors.modules.fast,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
