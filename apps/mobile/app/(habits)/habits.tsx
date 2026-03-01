import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getHabits,
  updateHabit,
  type Habit,
  type HabitType,
} from '@mylife/habits';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const TYPE_COLORS: Record<HabitType, string> = {
  standard: colors.modules.habits,
  timed: colors.modules.surf,
  negative: colors.danger,
  measurable: colors.modules.budget,
};

export default function AllHabitsScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [showArchived, setShowArchived] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const activeHabits = useMemo(() => getHabits(db, { isArchived: false }), [db, tick]);
  const archivedHabits = useMemo(
    () => showArchived ? getHabits(db, { isArchived: true }) : [],
    [db, tick, showArchived],
  );

  const moveHabit = (habit: Habit, direction: 'up' | 'down') => {
    const list = activeHabits;
    const idx = list.findIndex((h) => h.id === habit.id);
    if (direction === 'up' && idx > 0) {
      updateHabit(db, list[idx].id, { sortOrder: list[idx - 1].sortOrder });
      updateHabit(db, list[idx - 1].id, { sortOrder: list[idx].sortOrder });
      refresh();
    } else if (direction === 'down' && idx < list.length - 1) {
      updateHabit(db, list[idx].id, { sortOrder: list[idx + 1].sortOrder });
      updateHabit(db, list[idx + 1].id, { sortOrder: list[idx].sortOrder });
      refresh();
    }
  };

  const toggleArchive = (habit: Habit) => {
    Alert.alert(
      habit.isArchived ? 'Unarchive Habit' : 'Archive Habit',
      habit.isArchived
        ? `Restore "${habit.name}" to your active habits?`
        : `Archive "${habit.name}"? It will be hidden but data preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: habit.isArchived ? 'Unarchive' : 'Archive',
          onPress: () => {
            updateHabit(db, habit.id, { isArchived: !habit.isArchived });
            refresh();
          },
        },
      ],
    );
  };

  const renderHabitItem = ({ item }: { item: Habit }) => (
    <Pressable
      onPress={() => router.push(`/(habits)/${item.id}`)}
      onLongPress={() => toggleArchive(item)}
    >
      <Card style={styles.habitCard}>
        <View style={styles.rowBetween}>
          <View style={styles.mainCopy}>
            <View style={styles.nameRow}>
              <Text variant="body" color={item.isArchived ? colors.textTertiary : colors.text}>
                {item.icon ?? '\u2705'} {item.name}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.habitType] }]}>
                <Text variant="caption" color={colors.background} style={{ fontSize: 10 }}>
                  {item.habitType}
                </Text>
              </View>
            </View>
            <Text variant="caption" color={colors.textTertiary}>
              {item.frequency}
              {item.timeOfDay !== 'anytime' ? ` / ${item.timeOfDay}` : ''}
              {item.targetCount > 1 ? ` / target: ${item.targetCount}${item.unit ? ` ${item.unit}` : ''}` : ''}
            </Text>
          </View>
          {!item.isArchived && (
            <View style={styles.reorderButtons}>
              <Pressable style={styles.reorderBtn} onPress={() => moveHabit(item, 'up')}>
                <Text variant="caption" color={colors.textSecondary}>{'\u25B2'}</Text>
              </Pressable>
              <Pressable style={styles.reorderBtn} onPress={() => moveHabit(item, 'down')}>
                <Text variant="caption" color={colors.textSecondary}>{'\u25BC'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text variant="subheading">Active Habits ({activeHabits.length})</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/(habits)/add-habit')}>
          <Text variant="label" color={colors.background}>+ New Habit</Text>
        </Pressable>
      </View>

      <FlatList
        data={activeHabits}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={renderHabitItem}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text variant="body" color={colors.textSecondary}>
              No habits yet. Tap &quot;+ New Habit&quot; to create one.
            </Text>
          </Card>
        }
      />

      <Pressable style={styles.toggleRow} onPress={() => setShowArchived(!showArchived)}>
        <Text variant="label" color={colors.textSecondary}>
          {showArchived ? 'Hide' : 'Show'} Archived ({archivedHabits.length || '...'})
        </Text>
      </Pressable>

      {showArchived && archivedHabits.length > 0 && (
        <FlatList
          data={archivedHabits}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={renderHabitItem}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  addButton: {
    borderRadius: 8, backgroundColor: colors.modules.habits,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center',
  },
  habitCard: { marginBottom: spacing.sm, backgroundColor: colors.surfaceElevated },
  rowBetween: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm,
  },
  mainCopy: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  typeBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  reorderButtons: { flexDirection: 'column', gap: 2 },
  reorderBtn: {
    width: 28, height: 20, borderRadius: 4, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleRow: {
    paddingVertical: spacing.sm, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.lg },
});
