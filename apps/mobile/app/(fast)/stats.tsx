import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  adherenceRate,
  averageDuration,
  durationTrend,
  getStreaks,
  weeklyRollup,
} from '@mylife/fast';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function FastStatsScreen() {
  const db = useDatabase();

  const streaks = getStreaks(db);
  const avgSeconds = averageDuration(db);
  const adherence = adherenceRate(db);
  const week = weeklyRollup(db);
  const trend = durationTrend(db, 14);

  const weekHours = useMemo(
    () => week.reduce((sum, day) => sum + day.totalHours, 0),
    [week],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric title="Current Streak" value={String(streaks.currentStreak)} />
        <Metric title="Longest Streak" value={String(streaks.longestStreak)} />
        <Metric title="Avg Duration" value={`${(avgSeconds / 3600).toFixed(1)}h`} />
        <Metric title="Adherence" value={`${adherence.toFixed(1)}%`} />
      </View>

      <Card>
        <Text variant="subheading">Last 7 Days</Text>
        <Text variant="caption" color={colors.textSecondary}>
          {weekHours.toFixed(1)} total fasting hours
        </Text>
        <View style={styles.list}>
          {week.map((day) => (
            <View key={day.date} style={styles.rowBetween}>
              <Text variant="caption" color={colors.textSecondary}>
                {new Date(day.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text variant="body">{day.totalHours.toFixed(1)}h</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">14-Day Trend</Text>
        <View style={styles.list}>
          {trend.slice(-10).map((point) => (
            <View key={point.date} style={styles.rowBetween}>
              <Text variant="caption" color={colors.textSecondary}>
                {new Date(point.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text variant="body">
                {point.durationHours.toFixed(1)}h
                {point.movingAverage != null ? ` · avg ${point.movingAverage.toFixed(1)}h` : ''}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{title}</Text>
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
    color: colors.modules.fast,
    fontSize: 22,
    fontWeight: '700',
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
