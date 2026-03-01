import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  getAdherenceCalendar,
  getAdherenceStats,
  getActiveMedications,
  getMeasurements,
  type CalendarDay,
  type DayStatus,
  type HealthMeasurement,
} from '@mylife/meds';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.meds;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function statusColor(status: DayStatus): string {
  switch (status) {
    case 'taken':
      return '#22C55E';
    case 'missed':
      return '#EF4444';
    case 'partial':
      return '#F59E0B';
    case 'late':
      return '#F59E0B';
    case 'none':
    default:
      return colors.surfaceElevated;
  }
}

function getMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function HistoryScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const calendarDays = useMemo(
    () => getAdherenceCalendar(db, monthStr),
    [db, monthStr, tick],
  );

  const activeMeds = useMemo(() => getActiveMedications(db), [db, tick]);
  const firstMedStats = useMemo(() => {
    if (activeMeds.length === 0) return null;
    return getAdherenceStats(db, activeMeds[0].id, 30);
  }, [db, activeMeds, tick]);

  const measurements = useMemo(() => getMeasurements(db), [db, tick]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayMap = new Map<number, CalendarDay>();
  for (const day of calendarDays) {
    const dayNum = parseInt(day.date.slice(8, 10), 10);
    dayMap.set(dayNum, day);
  }

  const calendarCells: Array<{ day: number; overallStatus: DayStatus } | null> = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const calDay = dayMap.get(d);
    let overallStatus: DayStatus = 'none';
    if (calDay && calDay.meds.length > 0) {
      const statuses = calDay.meds.map((m) => m.status);
      if (statuses.every((s) => s === 'taken')) overallStatus = 'taken';
      else if (statuses.every((s) => s === 'missed')) overallStatus = 'missed';
      else if (statuses.some((s) => s === 'taken' || s === 'partial' || s === 'late'))
        overallStatus = 'partial';
    }
    calendarCells.push({ day: d, overallStatus });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.monthNav}>
          <Pressable onPress={prevMonth}>
            <Text variant="body" color={ACCENT}>{'<'}</Text>
          </Pressable>
          <Text variant="subheading">{getMonthLabel(year, month)}</Text>
          <Pressable onPress={nextMonth}>
            <Text variant="body" color={ACCENT}>{'>'}</Text>
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((wd) => (
            <View key={wd} style={styles.weekdayCell}>
              <Text variant="caption" color={colors.textTertiary}>{wd}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarCells.map((cell, i) => (
            <View
              key={i}
              style={[
                styles.calendarCell,
                { backgroundColor: cell ? statusColor(cell.overallStatus) : 'transparent' },
              ]}
            >
              {cell && (
                <Text variant="caption" color={colors.text}>
                  {cell.day}
                </Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <LegendItem color="#22C55E" label="All taken" />
          <LegendItem color="#F59E0B" label="Partial" />
          <LegendItem color="#EF4444" label="Missed" />
          <LegendItem color={colors.surfaceElevated} label="No data" />
        </View>
      </Card>

      {firstMedStats && (
        <Card>
          <Text variant="subheading">30-Day Stats ({activeMeds[0].name})</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Adherence" value={`${firstMedStats.rate}%`} />
            <StatItem label="Streak" value={`${firstMedStats.streak}d`} />
            <StatItem label="Taken" value={String(firstMedStats.totalTaken)} />
            <StatItem label="Missed" value={String(firstMedStats.totalMissed)} />
          </View>
        </Card>
      )}

      {measurements.length > 0 && (
        <Card>
          <Text variant="subheading">Recent Measurements</Text>
          {measurements.slice(0, 5).map((m: HealthMeasurement) => (
            <View key={m.id} style={styles.measurementRow}>
              <Text variant="body">{m.type.replace('_', ' ')}: {m.value} {m.unit}</Text>
              <Text variant="caption" color={colors.textSecondary}>
                {new Date(m.measuredAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weekdayRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekdayCell: { flex: 1, alignItems: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  statItem: { width: '45%', gap: 2 },
  statValue: { color: colors.modules.meds, fontSize: 18, fontWeight: '700' },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
