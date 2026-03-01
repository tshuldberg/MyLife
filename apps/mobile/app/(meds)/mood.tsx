import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getMoodEntries,
  getMoodCalendarMonth,
  moodColor,
  type MoodEntry,
  type MoodCalendarEntry,
} from '@mylife/meds';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.meds;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MoodScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Recent entries: last 30 days
  const recentFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);
  const recentEntries = useMemo(
    () => getMoodEntries(db, recentFrom).slice(0, 10),
    [db, recentFrom, tick],
  );

  const calendarData = useMemo(
    () => getMoodCalendarMonth(db, year, month),
    [db, year, month, tick],
  );

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const calMap = new Map<number, MoodCalendarEntry>();
  for (const entry of calendarData) {
    const dayNum = parseInt(entry.date.slice(8, 10), 10);
    calMap.set(dayNum, entry);
  }
  const calendarCells: Array<{ day: number; entry: MoodCalendarEntry | null } | null> = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, entry: calMap.get(d) ?? null });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Pressable
          style={styles.checkInButton}
          onPress={() => router.push('/(meds)/mood-check-in')}
        >
          <Text variant="label" color={colors.background}>New Mood Check-In</Text>
        </Pressable>
      </Card>

      <Card>
        <View style={styles.monthNav}>
          <Pressable onPress={prevMonth}>
            <Text variant="body" color={ACCENT}>{'<'}</Text>
          </Pressable>
          <Text variant="subheading">
            {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
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
          {calendarCells.map((cell, i) => {
            const p = cell?.entry?.pleasantness;
            const bg = cell?.entry?.hasData
              ? moodColor(p === 'neutral' ? null : (p ?? null))
              : colors.surfaceElevated;
            return (
              <View
                key={i}
                style={[
                  styles.calendarCell,
                  { backgroundColor: cell ? bg : 'transparent' },
                ]}
              >
                {cell && (
                  <Text variant="caption" color={colors.text}>{cell.day}</Text>
                )}
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Recent Entries</Text>
        {recentEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="body" color={colors.textSecondary}>
              No mood entries yet. Tap the button above to start.
            </Text>
          </View>
        ) : (
          recentEntries.map((entry: MoodEntry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={[styles.moodDot, { backgroundColor: moodColor(entry.pleasantness === 'neutral' ? null : entry.pleasantness) }]} />
              <View style={styles.entryContent}>
                <Text variant="body">{entry.mood}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {entry.energyLevel} energy · intensity {entry.intensity}/5 ·{' '}
                  {new Date(entry.recordedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  checkInButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.meds,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
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
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  moodDot: { width: 12, height: 12, borderRadius: 6 },
  entryContent: { flex: 1, gap: 2 },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
