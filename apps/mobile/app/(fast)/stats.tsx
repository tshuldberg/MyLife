import React, { useMemo, useRef, useState, type RefObject } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {
  adherenceRate,
  averageDuration,
  durationTrend,
  getStreaks,
  weeklyRollup,
  getMonthlySummary,
  getAnnualSummary,
  formatSummaryShareText,
} from '@mylife/fast';
import type { SummaryStats } from '@mylife/fast';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

function formatSummaryValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

function SummaryCard({
  title,
  label,
  summary,
  onShare,
}: {
  title: string;
  label: string;
  summary: SummaryStats;
  onShare: () => void;
}) {
  return (
    <Card>
      <View style={styles.rowBetween}>
        <View>
          <Text variant="subheading">{title}</Text>
          <Text variant="caption" color={colors.textSecondary}>{label}</Text>
        </View>
        <Pressable style={styles.copyButton} onPress={onShare}>
          <Text variant="label" color={colors.background}>Share</Text>
        </Pressable>
      </View>

      <SummaryRow label="Total fasts" value={formatSummaryValue(summary.totalFasts)} />
      <SummaryRow label="Total hours" value={`${formatSummaryValue(summary.totalHours)}h`} />
      <SummaryRow label="Average duration" value={`${formatSummaryValue(summary.averageDurationHours)}h`} />
      <SummaryRow label="Longest fast" value={`${formatSummaryValue(summary.longestFastHours)}h`} />
      <SummaryRow label="Current streak" value={`${formatSummaryValue(summary.currentStreak)}d`} />
      <SummaryRow label="Adherence" value={`${formatSummaryValue(summary.adherenceRate)}%`} />
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.rowBetween, { marginTop: spacing.xs }]}> 
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

export default function FastStatsScreen() {
  const db = useDatabase();

  const streaks = getStreaks(db);
  const avgSeconds = averageDuration(db);
  const adherence = adherenceRate(db);
  const week = weeklyRollup(db);
  const trend = durationTrend(db, 14);

  const now = new Date();
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);
  const monthlySummaryRef = useRef<View>(null);
  const annualSummaryRef = useRef<View>(null);

  const monthSummary = useMemo(
    () => getMonthlySummary(db, summaryYear, summaryMonth),
    [db, summaryYear, summaryMonth],
  );
  const annualSummary = useMemo(
    () => getAnnualSummary(db, summaryYear),
    [db, summaryYear],
  );

  const monthLabel = `${new Date(summaryYear, summaryMonth - 1).toLocaleString(undefined, { month: 'long' })} ${summaryYear}`;
  const annualLabel = `${summaryYear}`;

  const weekHours = useMemo(
    () => week.reduce((sum, day) => sum + day.totalHours, 0),
    [week],
  );

  const handleShareSummary = async (
    summaryRef: RefObject<View | null>,
    summary: SummaryStats,
    label: string,
  ) => {
    try {
      const uri = await captureRef(summaryRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: `${label} Summary`,
        });
        return;
      }
    } catch {
      // Fall through to text share.
    }

    const text = formatSummaryShareText(summary, label);
    await Share.share({
      title: `${label} Summary`,
      message: text,
    });
  };

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

      <Card>
        <Text variant="subheading">Summary Period</Text>
        <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
          <Text variant="caption" color={colors.textSecondary}>Year</Text>
          <View style={styles.adjustControls}>
            <Pressable style={styles.adjustButton} onPress={() => setSummaryYear((y) => Math.max(2000, y - 1))}>
              <Text variant="label">-</Text>
            </Pressable>
            <Text style={styles.periodValue}>{summaryYear}</Text>
            <Pressable style={styles.adjustButton} onPress={() => setSummaryYear((y) => Math.min(2100, y + 1))}>
              <Text variant="label">+</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
          <Text variant="caption" color={colors.textSecondary}>Month</Text>
          <View style={styles.adjustControls}>
            <Pressable style={styles.adjustButton} onPress={() => setSummaryMonth((m) => (m === 1 ? 12 : m - 1))}>
              <Text variant="label">-</Text>
            </Pressable>
            <Text style={styles.periodValue}>{summaryMonth}</Text>
            <Pressable style={styles.adjustButton} onPress={() => setSummaryMonth((m) => (m === 12 ? 1 : m + 1))}>
              <Text variant="label">+</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <View ref={monthlySummaryRef} collapsable={false}>
        <SummaryCard
          title="Monthly Summary"
          label={monthLabel}
          summary={monthSummary}
          onShare={() => void handleShareSummary(monthlySummaryRef, monthSummary, monthLabel)}
        />
      </View>

      <View ref={annualSummaryRef} collapsable={false}>
        <SummaryCard
          title="Annual Summary"
          label={annualLabel}
          summary={annualSummary}
          onShare={() => void handleShareSummary(annualSummaryRef, annualSummary, annualLabel)}
        />
      </View>
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
  adjustControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  adjustButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  periodValue: {
    color: colors.modules.fast,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  copyButton: {
    borderRadius: 999,
    backgroundColor: colors.modules.fast,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
