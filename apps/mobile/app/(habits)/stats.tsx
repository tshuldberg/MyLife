import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getOverallStats,
  getHabits,
  getYearlyStats,
  getCompletionRateByDayOfWeek,
  getCompletionRateByTimeOfDay,
  type Habit,
  type HabitStats,
} from '@mylife/habits';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const DAY_LABELS: Record<string, string> = {
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function StatsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [tick] = useState(0);

  const overall = useMemo(() => getOverallStats(db), [db, tick]);
  const habits = useMemo(() => getHabits(db, { isArchived: false }), [db, tick]);

  const habitStats = useMemo(() => {
    const map = new Map<string, HabitStats>();
    for (const h of habits) {
      map.set(h.id, getYearlyStats(db, h.id));
    }
    return map;
  }, [db, habits, tick]);

  // Find best day of week across all habits
  const bestDayOverall = useMemo(() => {
    const combined: Record<string, number> = { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 };
    for (const h of habits) {
      const byDow = getCompletionRateByDayOfWeek(db, h.id);
      for (const [day, rate] of Object.entries(byDow)) {
        combined[day] += rate;
      }
    }
    if (habits.length > 0) {
      for (const day of Object.keys(combined)) combined[day] /= habits.length;
    }
    return Object.entries(combined).reduce((a, b) => b[1] > a[1] ? b : a, ['none', 0]);
  }, [db, habits, tick]);

  // Find best time of day across all habits
  const bestTimeOverall = useMemo(() => {
    const combined: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const h of habits) {
      const byTod = getCompletionRateByTimeOfDay(db, h.id);
      for (const [slot, rate] of Object.entries(byTod)) {
        combined[slot] += rate;
      }
    }
    if (habits.length > 0) {
      for (const slot of Object.keys(combined)) combined[slot] /= habits.length;
    }
    return Object.entries(combined).reduce((a, b) => b[1] > a[1] ? b : a, ['none', 0]);
  }, [db, habits, tick]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Overall stats */}
      <Card>
        <Text variant="subheading">Overall</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total Habits" value={String(overall.totalHabits)} />
          <StatCard label="Total Completions" value={String(overall.totalCompletions)} />
          <StatCard label="Avg Completion Rate" value={`${Math.round(overall.averageCompletionRate * 100)}%`} />
          {overall.bestHabit && (
            <StatCard
              label="Best Habit"
              value={`${overall.bestHabit.name} (${Math.round(overall.bestHabit.completionRate * 100)}%)`}
            />
          )}
        </View>
      </Card>

      {/* Best day / time */}
      <Card>
        <Text variant="subheading">Patterns</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Best Day" value={DAY_LABELS[bestDayOverall[0]] ?? 'N/A'} />
          <StatCard label="Best Time" value={String(bestTimeOverall[0])} />
        </View>
      </Card>

      {/* Per-habit completion bars */}
      <Card>
        <Text variant="subheading">Per-Habit Completion Rate</Text>
        <View style={styles.barList}>
          {habits.map((h) => {
            const stats = habitStats.get(h.id);
            const rate = stats ? Math.round(stats.completionRate * 100) : 0;
            return (
              <Pressable key={h.id} onPress={() => router.push(`/(habits)/${h.id}`)}>
                <View style={styles.barRow}>
                  <View style={styles.barLabel}>
                    <Text variant="body" color={colors.text} numberOfLines={1}>
                      {h.icon ?? '\u2705'} {h.name}
                    </Text>
                    <Text variant="caption" color={colors.textTertiary}>{rate}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.min(100, rate)}%`, backgroundColor: h.color ?? colors.modules.habits },
                      ]}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
          {habits.length === 0 && (
            <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
              No habits to show stats for.
            </Text>
          )}
        </View>
      </Card>

      {/* Monthly trends for top habit */}
      {habits.length > 0 && (
        <Card>
          <Text variant="subheading">Monthly Trends ({new Date().getFullYear()})</Text>
          <MonthlyChart habits={habits} habitStats={habitStats} />
        </Card>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

function MonthlyChart({
  habits,
  habitStats,
}: {
  habits: Habit[];
  habitStats: Map<string, HabitStats>;
}) {
  // Show average monthly rate across all habits
  const monthlyAvg = useMemo(() => {
    const months: Record<string, number[]> = {};
    for (let m = 1; m <= 12; m++) {
      const key = String(m).padStart(2, '0');
      months[key] = [];
    }
    for (const h of habits) {
      const stats = habitStats.get(h.id);
      if (stats) {
        for (const [month, rate] of Object.entries(stats.monthlyRates)) {
          months[month]?.push(rate);
        }
      }
    }
    const result: { month: string; rate: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const key = String(m).padStart(2, '0');
      const rates = months[key];
      const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
      result.push({ month: MONTH_LABELS[m - 1], rate: avg });
    }
    return result;
  }, [habits, habitStats]);

  const maxRate = Math.max(0.01, ...monthlyAvg.map((m) => m.rate));

  return (
    <View style={styles.monthlyChart}>
      {monthlyAvg.map((m) => {
        const height = Math.max(2, (m.rate / maxRate) * 80);
        return (
          <View key={m.month} style={styles.monthBar}>
            <View style={styles.monthBarContainer}>
              <View
                style={[styles.monthBarFill, { height, backgroundColor: colors.modules.habits }]}
              />
            </View>
            <Text variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>
              {m.month}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  statCard: { flex: 1, minWidth: 120, gap: 2, alignItems: 'center' },
  statValue: { color: colors.modules.habits, fontSize: 22, fontWeight: '700' },
  barList: { marginTop: spacing.sm, gap: spacing.sm },
  barRow: { gap: 4 },
  barLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barTrack: {
    height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: 4 },
  monthlyChart: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 4,
    marginTop: spacing.sm, height: 100,
  },
  monthBar: { flex: 1, alignItems: 'center', gap: 2 },
  monthBarContainer: { flex: 1, justifyContent: 'flex-end' },
  monthBarFill: { width: '100%', borderRadius: 2, minHeight: 2 },
});
