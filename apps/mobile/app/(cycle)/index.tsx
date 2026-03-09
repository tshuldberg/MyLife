import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getCycleStats,
  getCycles,
  getCurrentPhase,
  type CycleStats,
} from '@mylife/cycle';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const accentColor = '#F472B6';

export default function CycleTodayScreen() {
  const db = useDatabase();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => getCycleStats(db), [db]);
  const recentCycles = useMemo(() => getCycles(db, 1), [db]);

  const currentCycle = recentCycles.length > 0 && !recentCycles[0].endDate
    ? recentCycles[0]
    : null;

  const currentPhase = currentCycle
    ? getCurrentPhase(
        currentCycle.startDate,
        today,
        stats.averageCycleLength ?? 28,
      )
    : null;

  const dayOfCycle = currentCycle
    ? Math.round(
        (new Date(today + 'T00:00:00Z').getTime() -
          new Date(currentCycle.startDate + 'T00:00:00Z').getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.navRow}>
        <NavButton label="Log Day" onPress={() => router.push('/(cycle)/log-day')} />
        <NavButton label="Insights" onPress={() => router.push('/(cycle)/insights')} />
        <NavButton label="Settings" onPress={() => router.push('/(cycle)/settings')} />
      </View>

      <View style={styles.metricsGrid}>
        <Metric
          label="Day"
          value={dayOfCycle !== null ? String(dayOfCycle) : '--'}
        />
        <Metric
          label="Phase"
          value={currentPhase ? currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1) : '--'}
        />
        <Metric
          label="Avg Length"
          value={stats.averageCycleLength !== null ? String(stats.averageCycleLength) : '--'}
        />
        <Metric
          label="Cycles"
          value={String(stats.totalCycles)}
        />
      </View>

      <Card>
        <Text variant="subheading">Current Cycle</Text>
        <View style={styles.list}>
          {currentCycle ? (
            <View style={styles.cycleInfo}>
              <Text variant="body">
                Started {currentCycle.startDate}
              </Text>
              {currentPhase && (
                <Text variant="caption" color={colors.textSecondary}>
                  {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} phase, day {dayOfCycle}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>
                No active cycle. Tap Log Day to start tracking.
              </Text>
            </View>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

function NavButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.navButton, { borderColor: accentColor }]} onPress={onPress}>
      <Text variant="caption" color={accentColor}>{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={[styles.metricValue, { color: accentColor }]}>{value}</Text>
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
  cycleInfo: { gap: 4 },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
