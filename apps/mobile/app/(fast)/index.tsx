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
} from '@mylife/fast';
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

export default function FastTimerScreen() {
  const db = useDatabase();
  const [timerState, setTimerState] = useState(() => computeTimerState(null, new Date()));
  const [protocols, setProtocols] = useState<ProtocolRow[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState('16:8');
  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0, totalFasts: 0 });

  const load = useCallback(() => {
    const active = getActiveFast(db);
    const protocolRows = getProtocols(db) as ProtocolRow[];
    setProtocols(protocolRows);
    setSelectedProtocol((prev) => prev || protocolRows[0]?.id || '16:8');
    setTimerState(computeTimerState(active, new Date()));
    setStreaks(getStreaks(db));
  }, [db]);

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
});
