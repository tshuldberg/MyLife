import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getTrailStats } from '@mylife/trails';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function TrailsDashboardScreen() {
  const db = useDatabase();
  const stats = useMemo(() => getTrailStats(db), [db]);

  const accentColor = '#65A30D';

  const paceDisplay =
    stats.averagePaceMinPerKm !== null
      ? `${stats.averagePaceMinPerKm.toFixed(1)}`
      : '--';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric label="Recordings" value={String(stats.totalRecordings)} accent={accentColor} />
        <Metric
          label="Distance"
          value={`${(stats.totalDistanceMeters / 1000).toFixed(1)} km`}
          accent={accentColor}
        />
        <Metric
          label="Elevation"
          value={`${Math.round(stats.totalElevationGainMeters)} m`}
          accent={accentColor}
        />
        <Metric label="Avg Pace" value={`${paceDisplay} min/km`} accent={accentColor} />
      </View>

      <Card>
        <Text variant="subheading">Recent Activity</Text>
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary}>
            No trail recordings yet. Start your first hike to see activity here.
          </Text>
        </View>
      </Card>
    </ScrollView>
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
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { flex: 1, minWidth: 75, gap: spacing.xs },
  metricValue: { fontSize: 22, fontWeight: '700' },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
