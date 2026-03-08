import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { listJournalEntries, listJournalTags } from '@mylife/journal';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const JOURNAL_ACCENT = '#A78BFA';

export default function JournalEntriesScreen() {
  const db = useDatabase();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = listJournalTags(db);
  const entries = listJournalEntries(db, {
    tag: activeTag ?? undefined,
    limit: 50,
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Browse Entries</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Filter by tag and review recent writing. Multiple notebooks, calendar heatmaps, and On
          This Day review are still outside the current hub scope.
        </Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setActiveTag(null)}
            style={[styles.chip, !activeTag ? styles.chipActive : null]}
          >
            <Text variant="caption" color={!activeTag ? colors.background : colors.textSecondary}>
              All
            </Text>
          </Pressable>
          {tags.map((tag) => {
            const selected = tag.name === activeTag;
            return (
              <Pressable
                key={tag.id}
                onPress={() => setActiveTag(selected ? null : tag.name)}
                style={[styles.chip, selected ? styles.chipActive : null]}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">
          {activeTag ? `Entries tagged "${activeTag}"` : 'Recent entries'}
        </Text>
        <View style={styles.list}>
          {entries.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>
              No entries match this filter yet.
            </Text>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} style={styles.innerCard}>
                <Text variant="body">{entry.title ?? 'Untitled entry'}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {entry.entryDate}
                  {entry.mood ? ` · ${entry.mood}` : ''}
                  {entry.tags.length > 0 ? ` · ${entry.tags.join(', ')}` : ''}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {entry.body.slice(0, 180)}
                </Text>
              </Card>
            ))
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: {
    backgroundColor: JOURNAL_ACCENT,
    borderColor: JOURNAL_ACCENT,
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  innerCard: {
    gap: spacing.xs,
  },
});
