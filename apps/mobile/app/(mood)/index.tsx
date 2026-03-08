import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getMoodDashboard,
  getMoodEntriesByDate,
  type MoodEntry,
  MoodScoreDescriptors,
} from '@mylife/mood';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function MoodTodayScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [tick, setTick] = useState(0);

  const today = new Date().toISOString().slice(0, 10);
  const dashboard = useMemo(() => getMoodDashboard(db), [db, tick]);
  const todayEntries = useMemo(() => getMoodEntriesByDate(db, today), [db, today, tick]);

  const accentColor = '#FB923C';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.navRow}>
        <NavButton label="Log Mood" accent={accentColor} onPress={() => router.push('/(mood)/log-mood')} />
        <NavButton label="Insights" accent={accentColor} onPress={() => router.push('/(mood)/insights')} />
        <NavButton label="Breathing" accent={accentColor} onPress={() => router.push('/(mood)/breathing')} />
        <NavButton label="Settings" accent={accentColor} onPress={() => router.push('/(mood)/settings')} />
      </View>

      <View style={styles.metricsGrid}>
        <Metric label="Today" value={dashboard.todayAverage ? String(dashboard.todayAverage) : '--'} accent={accentColor} />
        <Metric label="Week Avg" value={dashboard.weekAverage ? String(dashboard.weekAverage) : '--'} accent={accentColor} />
        <Metric label="Streak" value={String(dashboard.currentStreak)} accent={accentColor} />
        <Metric label="Total" value={String(dashboard.totalEntries)} accent={accentColor} />
      </View>

      <Card>
        <Text variant="subheading">Today&apos;s Entries</Text>
        <View style={styles.list}>
          {todayEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>
                No mood entries today. Tap Log Mood to get started!
              </Text>
            </View>
          ) : (
            todayEntries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

function EntryRow({ entry }: { entry: MoodEntry }) {
  const descriptor = MoodScoreDescriptors[entry.score];
  return (
    <Card style={styles.innerCard}>
      <View style={styles.rowBetween}>
        <View style={styles.mainCopy}>
          <Text variant="body">{descriptor?.label ?? `Score ${entry.score}`}</Text>
          {entry.note && (
            <Text variant="caption" color={colors.textSecondary} numberOfLines={2}>
              {entry.note}
            </Text>
          )}
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: '#FB923C' }]}>
          <Text variant="label" color={colors.background}>{entry.score}</Text>
        </View>
      </View>
    </Card>
  );
}

function NavButton({ label, accent, onPress }: { label: string; accent: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.navButton, { borderColor: accent }]} onPress={onPress}>
      <Text variant="caption" color={accent}>{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  navRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  navButton: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { flex: 1, minWidth: 75, gap: spacing.xs },
  metricValue: { fontSize: 22, fontWeight: '700' },
  list: { marginTop: spacing.sm },
  innerCard: { marginBottom: spacing.sm, backgroundColor: colors.surfaceElevated },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  mainCopy: { flex: 1, gap: 2 },
  scoreBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
