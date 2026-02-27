import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  getWorkoutDashboard,
  getWorkoutMetrics,
  getWorkoutSessions,
  getWorkouts,
  type WorkoutDefinition,
  type WorkoutSession,
} from '@mylife/workouts';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

interface DashboardView {
  workouts: number;
  exercises: number;
  sessions: number;
  streakDays: number;
  totalMinutes30d: number;
}

const EMPTY_DASHBOARD: DashboardView = {
  workouts: 0,
  exercises: 0,
  sessions: 0,
  streakDays: 0,
  totalMinutes30d: 0,
};

export default function WorkoutProgressScreen() {
  const db = useDatabase();

  const [dashboard, setDashboard] = useState<DashboardView>(EMPTY_DASHBOARD);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutDefinition[]>([]);

  useEffect(() => {
    setDashboard(getWorkoutDashboard(db));
    setSessions(getWorkoutSessions(db, { onlyCompleted: true, limit: 40 }));
    setWorkouts(getWorkouts(db));
  }, [db]);

  const workoutTitles = useMemo(() => {
    const map = new Map<string, string>();
    workouts.forEach((workout) => {
      map.set(workout.id, workout.title);
    });
    return map;
  }, [workouts]);

  const metrics = useMemo(() => getWorkoutMetrics(db, 30), [db]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricGrid}>
        <Metric label="Sessions" value={String(dashboard.sessions)} />
        <Metric label="Streak" value={`${dashboard.streakDays}d`} />
        <Metric label="Minutes (30d)" value={String(dashboard.totalMinutes30d)} />
        <Metric label="Calories (30d)" value={String(metrics.totalCalories)} />
      </View>

      <Card>
        <Text variant="subheading">Recent Sessions</Text>
        <View style={styles.list}>
          {sessions.map((session) => (
            <View key={session.id} style={styles.item}>
              <Text variant="body">
                {workoutTitles.get(session.workoutId) ?? `Workout ${session.workoutId.slice(0, 8)}`}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                {new Date(session.completedAt ?? session.startedAt).toLocaleString()} · {session.exercisesCompleted.length} exercises
              </Text>
            </View>
          ))}

          {sessions.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>No completed sessions yet.</Text>
          ) : null}
        </View>
      </Card>
    </ScrollView>
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
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
  },
  metricValue: {
    marginTop: spacing.xs,
    color: colors.modules.workouts,
    fontSize: 20,
    fontWeight: '700',
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    gap: 4,
  },
});
