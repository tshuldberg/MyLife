import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getHabitById,
  getHeatmapData,
  getStreaks,
  getStreaksWithGrace,
  getNegativeStreaks,
  getMeasurableStreaks,
  getCompletions,
  updateHabit,
  deleteHabit,
  type Habit,
  type HeatmapDay,
} from '@mylife/habits';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HabitDetailScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);
  const [editing, setEditing] = useState(false);

  const habit = useMemo(() => id ? getHabitById(db, id) : null, [db, id, tick]);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const heatmap = useMemo(() => {
    if (!id) return [];
    return getHeatmapData(db, id);
  }, [db, id, tick]);

  const streakInfo = useMemo(() => {
    if (!habit) return null;
    if (habit.habitType === 'negative') {
      return getNegativeStreaks(db, habit.id);
    }
    if (habit.habitType === 'measurable') {
      return getMeasurableStreaks(db, habit.id, habit.gracePeriod);
    }
    if (habit.gracePeriod > 0) {
      return getStreaksWithGrace(db, habit.id, habit.gracePeriod);
    }
    return getStreaks(db, habit.id);
  }, [db, habit, tick]);

  const recentCompletions = useMemo(() => {
    if (!id) return [];
    return getCompletions(db, id).slice(0, 20);
  }, [db, id, tick]);

  if (!habit) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary}>Habit not found.</Text>
        </View>
      </View>
    );
  }

  const startEdit = () => {
    setEditName(habit.name);
    setEditIcon(habit.icon ?? '');
    setEditing(true);
  };

  const saveEdit = () => {
    updateHabit(db, habit.id, {
      name: editName.trim() || habit.name,
      icon: editIcon || habit.icon || undefined,
    });
    setEditing(false);
    refresh();
  };

  const handleArchive = () => {
    Alert.alert(
      habit.isArchived ? 'Unarchive' : 'Archive',
      habit.isArchived
        ? `Restore "${habit.name}"?`
        : `Archive "${habit.name}"? Data will be preserved.`,
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

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      `Permanently delete "${habit.name}" and all its data? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteHabit(db, habit.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <Card>
        {editing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Habit name"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={[styles.input, styles.iconInput]}
              value={editIcon}
              onChangeText={setEditIcon}
              placeholder="Icon emoji"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.editActions}>
              <Pressable style={styles.saveBtn} onPress={saveEdit}>
                <Text variant="label" color={colors.background}>Save</Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text variant="label" color={colors.textSecondary}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.habitIcon}>{habit.icon ?? '\u2705'}</Text>
              <View style={styles.headerText}>
                <Text variant="subheading">{habit.name}</Text>
                <Text variant="caption" color={colors.textTertiary}>
                  {habit.habitType} / {habit.frequency}
                  {habit.timeOfDay !== 'anytime' ? ` / ${habit.timeOfDay}` : ''}
                </Text>
              </View>
            </View>
            <Pressable style={styles.editBtn} onPress={startEdit}>
              <Text variant="caption" color={colors.modules.habits}>Edit</Text>
            </Pressable>
          </View>
        )}
      </Card>

      {/* Streak Info */}
      <Card>
        <Text variant="subheading">Streaks</Text>
        <View style={styles.streakGrid}>
          {habit.habitType === 'negative' && 'daysSinceLastSlip' in (streakInfo ?? {}) ? (
            <>
              <StreakMetric
                label="Days Clean"
                value={String((streakInfo as { daysSinceLastSlip: number }).daysSinceLastSlip)}
              />
              <StreakMetric
                label="Best Clean Streak"
                value={String((streakInfo as { longestCleanStreak: number }).longestCleanStreak)}
              />
            </>
          ) : streakInfo && 'currentStreak' in streakInfo ? (
            <>
              <StreakMetric label="Current Streak" value={String(streakInfo.currentStreak)} />
              <StreakMetric label="Longest Streak" value={String(streakInfo.longestStreak)} />
            </>
          ) : null}
          {habit.gracePeriod > 0 && (
            <View style={styles.graceBadge}>
              <Text variant="caption" color={colors.modules.habits}>
                Grace period: {habit.gracePeriod} day{habit.gracePeriod > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Heatmap */}
      <Card>
        <Text variant="subheading">Activity Heatmap ({new Date().getFullYear()})</Text>
        <Heatmap data={heatmap} />
      </Card>

      {/* Recent Completions */}
      <Card>
        <Text variant="subheading">Recent Activity ({recentCompletions.length})</Text>
        {recentCompletions.length === 0 ? (
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
            No completions yet.
          </Text>
        ) : (
          <View style={styles.completionsList}>
            {recentCompletions.map((c) => (
              <View key={c.id} style={styles.completionRow}>
                <Text variant="body" color={colors.text}>
                  {formatDate(c.completedAt)}
                </Text>
                <Text variant="caption" color={colors.textTertiary}>
                  {c.value !== null && c.value !== 1 ? `value: ${c.value}` : 'completed'}
                  {c.notes ? ` - ${c.notes}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Actions */}
      <View style={styles.actionRow}>
        <Pressable style={styles.archiveBtn} onPress={handleArchive}>
          <Text variant="label" color={colors.textSecondary}>
            {habit.isArchived ? 'Unarchive' : 'Archive'}
          </Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text variant="label" color={colors.danger}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StreakMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.streakMetric}>
      <Text style={styles.streakValue}>{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

function Heatmap({ data }: { data: HeatmapDay[] }) {
  if (data.length === 0) {
    return (
      <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
        No data yet.
      </Text>
    );
  }

  // Group by week (7-day rows)
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // Show last 26 weeks (approximately 6 months)
  const displayWeeks = weeks.slice(-26);

  return (
    <View style={styles.heatmapContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.heatmapGrid}>
          {displayWeeks.map((week, wi) => (
            <View key={wi} style={styles.heatmapCol}>
              {week.map((day) => {
                const intensity = day.count / maxCount;
                const bg = day.count === 0
                  ? colors.surface
                  : `rgba(139, 92, 246, ${0.2 + intensity * 0.8})`;
                return (
                  <View
                    key={day.date}
                    style={[styles.heatmapCell, { backgroundColor: bg }]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.heatmapLegend}>
        <Text variant="caption" color={colors.textTertiary}>Less</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((i) => (
          <View
            key={i}
            style={[
              styles.legendCell,
              { backgroundColor: i === 0 ? colors.surface : `rgba(139, 92, 246, ${0.2 + i * 0.8})` },
            ]}
          />
        ))}
        <Text variant="caption" color={colors.textTertiary}>More</Text>
      </View>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  habitIcon: { fontSize: 32 },
  headerText: { flex: 1, gap: 2 },
  editBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: 6, borderWidth: 1, borderColor: colors.modules.habits,
  },
  editForm: { gap: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    color: colors.text, backgroundColor: colors.surfaceElevated,
  },
  iconInput: { width: 100 },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  saveBtn: {
    borderRadius: 8, backgroundColor: colors.modules.habits,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  cancelBtn: {
    borderRadius: 8, backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  streakGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  streakMetric: { flex: 1, minWidth: 100, gap: 2, alignItems: 'center' },
  streakValue: { color: colors.modules.habits, fontSize: 28, fontWeight: '700' },
  graceBadge: {
    borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.modules.habits, alignSelf: 'flex-start',
  },
  heatmapContainer: { marginTop: spacing.sm, gap: spacing.sm },
  heatmapGrid: { flexDirection: 'row', gap: 2 },
  heatmapCol: { gap: 2 },
  heatmapCell: { width: 10, height: 10, borderRadius: 2 },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  completionsList: { marginTop: spacing.sm, gap: spacing.xs },
  completionRow: {
    paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 2,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  archiveBtn: {
    flex: 1, borderRadius: 8, backgroundColor: colors.surface,
    paddingVertical: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  deleteBtn: {
    flex: 1, borderRadius: 8, backgroundColor: colors.surface,
    paddingVertical: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.danger,
  },
});
