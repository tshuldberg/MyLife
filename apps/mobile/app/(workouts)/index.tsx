import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  createWorkoutLog,
  createWorkoutProgram,
  deleteWorkoutLog,
  deleteWorkoutProgram,
  getWorkoutLogs,
  getWorkoutMetrics,
  getWorkoutPrograms,
  setActiveWorkoutProgram,
  type WorkoutFocus,
  type WorkoutLog,
  type WorkoutProgram,
} from '@mylife/workouts';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const FOCUS_OPTIONS: WorkoutFocus[] = [
  'full_body',
  'upper_body',
  'lower_body',
  'push',
  'pull',
  'legs',
  'cardio',
  'mobility',
  'custom',
];

export default function WorkoutsScreen() {
  const db = useDatabase();

  const [programName, setProgramName] = useState('');
  const [programGoal, setProgramGoal] = useState('Build strength');
  const [logName, setLogName] = useState('');
  const [logFocus, setLogFocus] = useState<WorkoutFocus>('full_body');
  const [logDuration, setLogDuration] = useState('45');

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const overview = useMemo(() => getWorkoutMetrics(db, 30), [db, tick]);
  const programs = useMemo(() => getWorkoutPrograms(db), [db, tick]);
  const logs = useMemo(() => getWorkoutLogs(db, { limit: 100 }), [db, tick]);

  const activeProgram = programs.find((program) => program.isActive) ?? null;

  const addProgram = () => {
    createWorkoutProgram(db, uuid(), {
      name: programName.trim() || 'New Program',
      goal: programGoal.trim() || 'General fitness',
      weeks: 8,
      sessionsPerWeek: 4,
      isActive: true,
    });
    setProgramName('');
    refresh();
  };

  const addLog = () => {
    const duration = Math.max(10, Number(logDuration) || 30);
    createWorkoutLog(db, uuid(), {
      name: logName.trim() || 'Workout',
      focus: logFocus,
      durationMin: duration,
      calories: Math.max(0, Math.round(duration * 7)),
      rpe: 7,
      completedAt: new Date().toISOString(),
    });
    setLogName('');
    refresh();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric label="Workouts" value={String(overview.workouts)} />
        <Metric label="Minutes" value={String(overview.totalMinutes)} />
        <Metric label="Calories" value={String(overview.totalCalories)} />
        <Metric label="Avg RPE" value={overview.workouts ? overview.averageRpe.toFixed(1) : '--'} />
      </View>

      <Card>
        <Text variant="subheading">Programs</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={programName}
            onChangeText={setProgramName}
            placeholder="Program name"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={programGoal}
            onChangeText={setProgramGoal}
            placeholder="Goal"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable style={styles.primaryButton} onPress={addProgram}>
            <Text variant="label" color={colors.background}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {programs.map((program: WorkoutProgram) => (
            <Card key={program.id} style={styles.innerCard}>
              <View style={styles.rowBetween}>
                <View style={styles.mainCopy}>
                  <Text variant="body">{program.name}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {program.goal} · {program.weeks}w · {program.sessionsPerWeek}/wk
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={program.isActive ? styles.primaryButton : styles.secondaryButton}
                    onPress={() => {
                      setActiveWorkoutProgram(db, program.isActive ? null : program.id);
                      refresh();
                    }}
                  >
                    <Text
                      variant="label"
                      color={program.isActive ? colors.background : colors.text}
                    >
                      {program.isActive ? 'Active' : 'Set'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.dangerButton}
                    onPress={() => {
                      deleteWorkoutProgram(db, program.id);
                      refresh();
                    }}
                  >
                    <Text variant="label" color={colors.background}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}
          {programs.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>No workout programs yet.</Text>
          ) : null}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Workout Logs {activeProgram ? `· ${activeProgram.name}` : ''}</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={logName}
            onChangeText={setLogName}
            placeholder="Workout name"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={logDuration}
            onChangeText={setLogDuration}
            keyboardType="numeric"
            placeholder="Duration"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.row}>
          {FOCUS_OPTIONS.map((focus) => {
            const selected = logFocus === focus;
            return (
              <Pressable
                key={focus}
                style={[styles.chip, selected ? styles.chipSelected : null]}
                onPress={() => setLogFocus(focus)}
              >
                <Text
                  variant="caption"
                  color={selected ? colors.background : colors.textSecondary}
                >
                  {focus.replace('_', ' ')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.primaryButton} onPress={addLog}>
          <Text variant="label" color={colors.background}>Add Log</Text>
        </Pressable>

        <FlatList
          data={logs}
          keyExtractor={(item: WorkoutLog) => item.id}
          scrollEnabled={false}
          style={styles.logList}
          renderItem={({ item }) => (
            <Card style={styles.innerCard}>
              <View style={styles.rowBetween}>
                <View style={styles.mainCopy}>
                  <Text variant="body">{item.name}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {item.focus.replace('_', ' ')} · {item.durationMin} min · {item.calories} cal · RPE {item.rpe}
                  </Text>
                </View>
                <Pressable
                  style={styles.dangerButton}
                  onPress={() => {
                    deleteWorkoutLog(db, item.id);
                    refresh();
                  }}
                >
                  <Text variant="label" color={colors.background}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <Text variant="caption" color={colors.textSecondary}>No workout logs yet.</Text>
          }
        />
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
    gap: spacing.xs,
  },
  metricValue: {
    color: colors.modules.workouts,
    fontSize: 22,
    fontWeight: '700',
  },
  row: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    minWidth: 120,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.modules.workouts,
    backgroundColor: colors.modules.workouts,
  },
  primaryButton: {
    marginTop: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.modules.workouts,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
    minWidth: 88,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dangerButton: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  innerCard: {
    backgroundColor: colors.surfaceElevated,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
  logList: {
    marginTop: spacing.sm,
  },
});
