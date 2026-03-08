import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getMailStats } from '@mylife/mail';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const accentColor = '#3B82F6';

export default function MailInboxScreen() {
  const db = useDatabase();
  const router = useRouter();

  const stats = useMemo(() => getMailStats(db), [db]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.navRow}>
        <NavButton label="Compose" accent={accentColor} onPress={() => router.push('/(mail)/compose-message')} />
        <NavButton label="Server Setup" accent={accentColor} onPress={() => router.push('/(mail)/server-setup')} />
      </View>

      <View style={styles.metricsGrid}>
        <Metric label="Unread" value={String(stats.unreadCount)} accent={accentColor} />
        <Metric label="Total" value={String(stats.totalMessages)} accent={accentColor} />
        <Metric label="Starred" value={String(stats.starredCount)} accent={accentColor} />
        <Metric label="Drafts" value={String(stats.draftCount)} accent={accentColor} />
      </View>

      <Card>
        <Text variant="subheading">Inbox</Text>
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary}>
            No messages yet. Set up a mail server to get started.
          </Text>
        </View>
      </Card>

      {stats.byFolder.length > 0 && (
        <Card>
          <Text variant="subheading">Folders</Text>
          <View style={styles.list}>
            {stats.byFolder.map((f) => (
              <View key={f.folder} style={styles.folderRow}>
                <Text variant="body">{f.folder}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {f.total} total, {f.unread} unread
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </ScrollView>
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
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
  folderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: spacing.sm,
  },
});
