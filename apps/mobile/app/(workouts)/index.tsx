import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getWorkoutDashboard,
  getWorkoutMetrics,
  getWorkouts,
  seedWorkoutExerciseLibrary,
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

export default function WorkoutsScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [tick, setTick] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardView>(EMPTY_DASHBOARD);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    seedWorkoutExerciseLibrary(db);
    setDashboard(getWorkoutDashboard(db));
  }, [db, tick]);

  const metrics = useMemo(() => getWorkoutMetrics(db, 30), [db, tick]);
  const workouts = useMemo(() => getWorkouts(db, { limit: 6 }), [db, tick]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricGrid}>
        <Metric label="Workouts" value={String(dashboard.workouts)} />
        <Metric label="Exercise Library" value={String(dashboard.exercises)} />
        <Metric label="Sessions" value={String(dashboard.sessions)} />
        <Metric label="Streak" value={`${dashboard.streakDays}d`} />
        <Metric label="Minutes (30d)" value={String(dashboard.totalMinutes30d)} />
        <Metric label="Calories (30d)" value={String(metrics.totalCalories)} />
      </View>

      <Card>
        <Text variant="subheading">Quick Actions</Text>
        <View style={styles.quickRow}>
          <QuickButton label="Explore" onPress={() => router.push('/(workouts)/explore' as never)} />
          <QuickButton label="Builder" onPress={() => router.push('/(workouts)/builder' as never)} />
          <QuickButton label="All Workouts" onPress={() => router.push('/(workouts)/workouts' as never)} />
          <QuickButton label="Progress" onPress={() => router.push('/(workouts)/progress' as never)} />
          <QuickButton label="Recordings" onPress={() => router.push('/(workouts)/recordings' as never)} />
        </View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Text variant="subheading">Recent Workouts</Text>
          <Pressable onPress={() => router.push('/(workouts)/workouts' as never)}>
            <Text variant="caption" color={colors.modules.workouts}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {workouts.map((workout) => (
            <Pressable key={workout.id} style={styles.listItem} onPress={() => router.push(`/(workouts)/builder?edit=${workout.id}` as never)}>
              <View style={styles.listMain}>
                <Text variant="body">{workout.title}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {workout.exercises.length} exercises · {Math.round(workout.estimatedDuration / 60)} min · {workout.difficulty}
                </Text>
              </View>
              <Text variant="caption" color={colors.modules.workouts}>Edit</Text>
            </Pressable>
          ))}

          {workouts.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>No workouts yet. Build one from exercise library.</Text>
          ) : null}
        </View>
      </Card>

      <Pressable style={styles.refreshButton} onPress={refresh}>
        <Text variant="label" color={colors.background}>Refresh</Text>
      </Pressable>
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

function QuickButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickButton} onPress={onPress}>
      <Text variant="label" color={colors.background}>{label}</Text>
    </Pressable>
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
  quickRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickButton: {
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.modules.workouts,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  listItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  listMain: {
    flex: 1,
    gap: 4,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.modules.workouts,
  },
});
