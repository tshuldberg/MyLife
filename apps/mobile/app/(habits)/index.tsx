import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getHabits,
  getCompletionsForDate,
  getStreaks,
  getStreaksWithGrace,
  getNegativeStreaks,
  getMeasurableStreaks,
  getMeasurementsForDate,
  getSessionsForDate,
  recordCompletion,
  recordMeasurement,
  deleteCompletion,
  startSession,
  endSession,
  type Completion,
  type Habit,
  type TimedSession,
  type Measurement,
  type DayOfWeek,
} from '@mylife/habits';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

function isDueToday(habit: Habit): boolean {
  const now = new Date();
  const dow = DAY_MAP[now.getDay()];
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'specific_days' && habit.specificDays) {
    return habit.specificDays.includes(dow);
  }
  if (habit.frequency === 'weekly') {
    // Due on first day of week (Monday)
    return dow === 'mon';
  }
  if (habit.frequency === 'monthly') {
    return now.getDate() === 1;
  }
  return true;
}

export default function TodayScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const today = new Date().toISOString().slice(0, 10);
  const habits = useMemo(() => getHabits(db, { isArchived: false }), [db, tick]);
  const dueHabits = useMemo(() => habits.filter(isDueToday), [habits]);
  const completions = useMemo(() => getCompletionsForDate(db, today), [db, today, tick]);
  const measurements = useMemo(() => getMeasurementsForDate(db, today), [db, today, tick]);
  const sessions = useMemo(() => getSessionsForDate(db, today), [db, today, tick]);

  const completionsByHabitId = useMemo(() => {
    const map = new Map<string, Completion[]>();
    for (const c of completions) {
      const list = map.get(c.habitId) ?? [];
      list.push(c);
      map.set(c.habitId, list);
    }
    return map;
  }, [completions]);

  const measurementsByHabitId = useMemo(() => {
    const map = new Map<string, Measurement[]>();
    for (const m of measurements) {
      const list = map.get(m.habitId) ?? [];
      list.push(m);
      map.set(m.habitId, list);
    }
    return map;
  }, [measurements]);

  const sessionsByHabitId = useMemo(() => {
    const map = new Map<string, TimedSession[]>();
    for (const s of sessions) {
      const list = map.get(s.habitId) ?? [];
      list.push(s);
      map.set(s.habitId, list);
    }
    return map;
  }, [sessions]);

  const doneCount = useMemo(() => {
    let count = 0;
    for (const h of dueHabits) {
      if (h.habitType === 'measurable') {
        const ms = measurementsByHabitId.get(h.id);
        if (ms && ms.some((m) => m.value >= m.target)) count++;
      } else if (h.habitType === 'timed') {
        const ss = sessionsByHabitId.get(h.id);
        if (ss && ss.some((s) => s.completed)) count++;
      } else {
        if (completionsByHabitId.has(h.id)) count++;
      }
    }
    return count;
  }, [dueHabits, completionsByHabitId, measurementsByHabitId, sessionsByHabitId]);

  const completionRate = dueHabits.length > 0
    ? Math.round((doneCount / dueHabits.length) * 100)
    : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.navRow}>
        <NavButton label="All Habits" onPress={() => router.push('/(habits)/habits')} />
        <NavButton label="Stats" onPress={() => router.push('/(habits)/stats')} />
        <NavButton label="MyCycle" onPress={() => router.push('/(habits)/cycle')} />
        <NavButton label="Settings" onPress={() => router.push('/(habits)/settings')} />
      </View>

      <View style={styles.metricsGrid}>
        <Metric label="Due Today" value={String(dueHabits.length)} />
        <Metric label="Done" value={`${doneCount}/${dueHabits.length}`} />
        <Metric label="Rate" value={`${completionRate}%`} />
      </View>

      <Card>
        <Text variant="subheading">Today&apos;s Habits</Text>
        <FlatList
          data={dueHabits}
          keyExtractor={(item: Habit) => item.id}
          scrollEnabled={false}
          style={styles.list}
          renderItem={({ item }) => (
            <HabitRow
              habit={item}
              completions={completionsByHabitId.get(item.id) ?? []}
              measurements={measurementsByHabitId.get(item.id) ?? []}
              sessions={sessionsByHabitId.get(item.id) ?? []}
              db={db}
              today={today}
              refresh={refresh}
              onPress={() => router.push(`/(habits)/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>
                No habits due today. Add some from the Habits tab!
              </Text>
            </View>
          }
        />
      </Card>
    </ScrollView>
  );
}

function HabitRow({
  habit,
  completions,
  measurements: habitMeasurements,
  sessions: habitSessions,
  db,
  today,
  refresh,
  onPress,
}: {
  habit: Habit;
  completions: Completion[];
  measurements: Measurement[];
  sessions: TimedSession[];
  db: ReturnType<typeof useDatabase>;
  today: string;
  refresh: () => void;
  onPress: () => void;
}) {
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getStreakText = () => {
    if (habit.habitType === 'negative') {
      const neg = getNegativeStreaks(db, habit.id);
      return `${neg.daysSinceLastSlip}d clean / best ${neg.longestCleanStreak}d`;
    }
    if (habit.habitType === 'measurable') {
      const ms = getMeasurableStreaks(db, habit.id, habit.gracePeriod);
      return `streak ${ms.currentStreak} / best ${ms.longestStreak}`;
    }
    if (habit.gracePeriod > 0) {
      const gs = getStreaksWithGrace(db, habit.id, habit.gracePeriod);
      return `streak ${gs.currentStreak} / best ${gs.longestStreak}`;
    }
    const s = getStreaks(db, habit.id);
    return `streak ${s.currentStreak} / best ${s.longestStreak}`;
  };

  const isDone = () => {
    if (habit.habitType === 'measurable') {
      return habitMeasurements.some((m) => m.value >= m.target);
    }
    if (habit.habitType === 'timed') {
      return habitSessions.some((s) => s.completed);
    }
    return completions.length > 0;
  };

  const done = isDone();

  const handleStandard = () => {
    if (completions.length > 0) {
      deleteCompletion(db, completions[0].id);
    } else {
      recordCompletion(db, uuid(), habit.id, new Date().toISOString(), 1);
    }
    refresh();
  };

  const handleNegative = () => {
    // Record a slip
    recordCompletion(db, uuid(), habit.id, new Date().toISOString(), -1, 'Slipped');
    refresh();
  };

  const handleMeasurable = () => {
    // Increment by 1 toward target
    const current = habitMeasurements.reduce((sum, m) => sum + m.value, 0);
    recordMeasurement(db, uuid(), habit.id, new Date().toISOString(), current + 1, habit.targetCount);
    refresh();
  };

  const handleTimerToggle = () => {
    if (timerActive) {
      // Stop timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      if (sessionIdRef.current) {
        endSession(db, sessionIdRef.current, timerSeconds);
        if (timerSeconds >= habit.targetCount) {
          recordCompletion(db, uuid(), habit.id, new Date().toISOString(), timerSeconds);
        }
      }
      setTimerActive(false);
      setTimerSeconds(0);
      sessionIdRef.current = null;
      refresh();
    } else {
      // Start timer
      const sid = uuid();
      sessionIdRef.current = sid;
      startSession(db, sid, habit.id, habit.targetCount);
      setTimerActive(true);
      setTimerSeconds(0);
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const typeBadge = () => {
    const badgeColors: Record<string, string> = {
      standard: colors.modules.habits,
      timed: colors.modules.surf,
      negative: colors.danger,
      measurable: colors.modules.budget,
    };
    return (
      <View style={[styles.typeBadge, { backgroundColor: badgeColors[habit.habitType] ?? colors.border }]}>
        <Text variant="caption" color={colors.background} style={{ fontSize: 10 }}>
          {habit.habitType}
        </Text>
      </View>
    );
  };

  const renderAction = () => {
    if (habit.habitType === 'timed') {
      return (
        <Pressable
          style={[styles.actionButton, timerActive ? styles.actionActive : null]}
          onPress={handleTimerToggle}
        >
          <Text variant="label" color={colors.background}>
            {timerActive ? formatTime(timerSeconds) : 'Start'}
          </Text>
        </Pressable>
      );
    }
    if (habit.habitType === 'negative') {
      return (
        <Pressable style={[styles.actionButton, styles.actionDanger]} onPress={handleNegative}>
          <Text variant="label" color={colors.background}>I Slipped</Text>
        </Pressable>
      );
    }
    if (habit.habitType === 'measurable') {
      const current = habitMeasurements.reduce((sum, m) => sum + m.value, 0);
      return (
        <Pressable style={styles.actionButton} onPress={handleMeasurable}>
          <Text variant="label" color={colors.background}>
            {current}/{habit.targetCount}
          </Text>
        </Pressable>
      );
    }
    // Standard
    return (
      <Pressable style={styles.checkRow} onPress={handleStandard}>
        <View style={[styles.checkbox, done ? styles.checkboxDone : null]}>
          <Text variant="label" color={done ? colors.background : colors.textTertiary}>
            {done ? '\u2713' : ''}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.innerCard}>
        <View style={styles.rowBetween}>
          <View style={styles.mainCopy}>
            <View style={styles.nameRow}>
              <Text variant="body" color={done ? colors.textSecondary : colors.text}>
                {habit.icon ?? '\u2705'} {habit.name}
              </Text>
              {typeBadge()}
              {habit.gracePeriod > 0 && (
                <View style={styles.graceBadge}>
                  <Text variant="caption" color={colors.modules.habits} style={{ fontSize: 9 }}>
                    GP:{habit.gracePeriod}
                  </Text>
                </View>
              )}
            </View>
            <Text variant="caption" color={colors.textTertiary}>
              {habit.frequency} / {getStreakText()}
            </Text>
          </View>
          {renderAction()}
        </View>
      </Card>
    </Pressable>
  );
}

function NavButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.navButton} onPress={onPress}>
      <Text variant="caption" color={colors.modules.habits}>{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  navRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  navButton: {
    borderRadius: 8, borderWidth: 1, borderColor: colors.modules.habits,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { flex: 1, minWidth: 90, gap: spacing.xs },
  metricValue: { color: colors.modules.habits, fontSize: 22, fontWeight: '700' },
  list: { marginTop: spacing.sm },
  innerCard: { marginBottom: spacing.sm, backgroundColor: colors.surfaceElevated },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  mainCopy: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.modules.habits, borderColor: colors.modules.habits },
  typeBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  graceBadge: {
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
    borderWidth: 1, borderColor: colors.modules.habits,
  },
  actionButton: {
    borderRadius: 8, backgroundColor: colors.modules.habits,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, alignItems: 'center',
    minWidth: 60,
  },
  actionActive: { backgroundColor: colors.success },
  actionDanger: { backgroundColor: colors.danger },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
