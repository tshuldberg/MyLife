import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getNotes,
  getNotesStats,
  type Note,
} from '@mylife/notes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function NotesHomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [tick, setTick] = useState(0);

  const notes = useMemo(() => getNotes(db, { limit: 20 }), [db, tick]);
  const stats = useMemo(() => getNotesStats(db), [db, tick]);

  const accentColor = '#64748B';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.navRow}>
        <NavButton label="New Note" accent={accentColor} onPress={() => router.push('/(notes)/note-editor')} />
        <NavButton label="Folders" accent={accentColor} onPress={() => router.push('/(notes)/folders')} />
        <NavButton label="Search" accent={accentColor} onPress={() => router.push('/(notes)/search')} />
        <NavButton label="Settings" accent={accentColor} onPress={() => router.push('/(notes)/settings')} />
      </View>

      <View style={styles.metricsGrid}>
        <Metric label="Notes" value={String(stats.totalNotes)} accent={accentColor} />
        <Metric label="Folders" value={String(stats.totalFolders)} accent={accentColor} />
        <Metric label="Tags" value={String(stats.totalTags)} accent={accentColor} />
        <Metric label="Words" value={stats.totalWords > 999 ? `${(stats.totalWords / 1000).toFixed(1)}k` : String(stats.totalWords)} accent={accentColor} />
      </View>

      <Card>
        <Text variant="subheading">Recent Notes</Text>
        <View style={styles.list}>
          {notes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>
                No notes yet. Tap New Note to create one!
              </Text>
            </View>
          ) : (
            notes.map((note) => (
              <NoteRow key={note.id} note={note} onPress={() => router.push(`/(notes)/note-editor?id=${note.id}`)} />
            ))
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

function NoteRow({ note, onPress }: { note: Note; onPress: () => void }) {
  const preview = note.body.slice(0, 80).replace(/\n/g, ' ');
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.innerCard}>
        <View style={styles.rowBetween}>
          <View style={styles.mainCopy}>
            <View style={styles.titleRow}>
              {note.isPinned && <Text variant="caption" color="#64748B">pin</Text>}
              <Text variant="body" numberOfLines={1}>{note.title || 'Untitled'}</Text>
            </View>
            <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {preview || 'Empty note'}
            </Text>
          </View>
          <Text variant="caption" color={colors.textTertiary}>
            {note.wordCount}w
          </Text>
        </View>
      </Card>
    </Pressable>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
