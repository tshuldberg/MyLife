import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  countHabits,
  createHabit,
  deleteCompletion,
  deleteHabit,
  getCompletionsForDate,
  getHabits,
  getStreaks,
  recordCompletion,
  type Completion,
  type Frequency,
  type Habit,
} from '@mylife/habits';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly'];

export default function HabitsScreen() {
  const db = useDatabase();

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const habits = useMemo(() => getHabits(db, { isArchived: false }), [db, tick]);
  const today = new Date().toISOString().slice(0, 10);
  const completions = useMemo(() => getCompletionsForDate(db, today), [db, today, tick]);

  const completionsByHabitId = useMemo(() => {
    const map = new Map<string, Completion[]>();
    for (const completion of completions) {
      const list = map.get(completion.habitId) ?? [];
      list.push(completion);
      map.set(completion.habitId, list);
    }
    return map;
  }, [completions]);

  const addHabit = () => {
    const clean = name.trim();
    if (!clean) return;
    createHabit(db, uuid(), {
      name: clean,
      frequency,
      targetCount: 1,
      icon: '✅',
    });
    setName('');
    setFrequency('daily');
    refresh();
  };

  const toggleToday = (habitId: string) => {
    const existing = completionsByHabitId.get(habitId)?.[0];
    if (existing) {
      deleteCompletion(db, existing.id);
    } else {
      recordCompletion(db, uuid(), habitId, new Date().toISOString(), 1);
    }
    refresh();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric label="Habits" value={String(countHabits(db))} />
        <Metric label="Done Today" value={String(completionsByHabitId.size)} />
      </View>

      <Card>
        <Text variant="subheading">Add Habit</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.row}>
            {FREQUENCIES.map((value) => {
              const selected = value === frequency;
              return (
                <Pressable
                  key={value}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                  onPress={() => setFrequency(value)}
                >
                  <Text
                    variant="caption"
                    color={selected ? colors.background : colors.textSecondary}
                  >
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={styles.primaryButton} onPress={addHabit}>
            <Text variant="label" color={colors.background}>Create Habit</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Today Checklist</Text>
        <FlatList
          data={habits}
          keyExtractor={(item: Habit) => item.id}
          scrollEnabled={false}
          style={styles.list}
          renderItem={({ item }) => {
            const done = Boolean(completionsByHabitId.get(item.id)?.length);
            const streak = getStreaks(db, item.id);
            return (
              <Card style={styles.innerCard}>
                <View style={styles.rowBetween}>
                  <Pressable style={styles.checkRow} onPress={() => toggleToday(item.id)}>
                    <View style={[styles.checkbox, done ? styles.checkboxDone : null]}>
                      <Text variant="label" color={done ? colors.background : colors.textTertiary}>
                        {done ? '✓' : ''}
                      </Text>
                    </View>
                    <View style={styles.mainCopy}>
                      <Text variant="body" color={done ? colors.textSecondary : colors.text}>
                        {item.name}
                      </Text>
                      <Text variant="caption" color={colors.textTertiary}>
                        {item.frequency} · streak {streak.currentStreak} / best {streak.longestStreak}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.dangerButton}
                    onPress={() => {
                      deleteHabit(db, item.id);
                      refresh();
                    }}
                  >
                    <Text variant="label" color={colors.background}>Delete</Text>
                  </Pressable>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>No habits yet.</Text>
            </View>
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
    color: colors.modules.habits,
    fontSize: 22,
    fontWeight: '700',
  },
  formGrid: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
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
    borderColor: colors.modules.habits,
    backgroundColor: colors.modules.habits,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.habits,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  list: {
    marginTop: spacing.sm,
  },
  innerCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.modules.habits,
    borderColor: colors.modules.habits,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
  dangerButton: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
