import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getTranscriptionStats } from '@mylife/voice';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function VoiceDictateScreen() {
  const db = useDatabase();
  const stats = useMemo(() => getTranscriptionStats(db), [db]);

  const accentColor = '#EF4444';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric label="Total" value={String(stats.totalCount)} accent={accentColor} />
        <Metric label="Duration" value={formatDuration(stats.totalDurationSeconds)} accent={accentColor} />
        <Metric label="Avg Length" value={formatDuration(stats.avgDurationSeconds)} accent={accentColor} />
        <Metric label="Languages" value={String(stats.byLanguage.length)} accent={accentColor} />
      </View>

      <Card>
        <Text variant="subheading">Recent Transcriptions</Text>
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary}>
            No transcriptions yet. Tap the mic to start dictating.
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

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { flex: 1, minWidth: 75, gap: spacing.xs },
  metricValue: { fontSize: 22, fontWeight: '700' },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.sm },
});
