import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { searchJournalEntries } from '@mylife/journal';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function JournalSearchScreen() {
  const db = useDatabase();
  const [query, setQuery] = useState('');
  const results = useMemo(
    () => (query.trim() ? searchJournalEntries(db, query.trim(), 25) : []),
    [db, query],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Search Journal</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search titles, body text, or tags"
          placeholderTextColor={colors.textTertiary}
        />
        <Text variant="caption" color={colors.textSecondary}>
          Current hub build uses simple local text matching. The spec still calls for a dedicated
          FTS5 index, stemming, and richer filters.
        </Text>
      </Card>

      <Card>
        <Text variant="subheading">Results</Text>
        <View style={styles.list}>
          {!query.trim() ? (
            <Text variant="caption" color={colors.textSecondary}>
              Start typing to search your journal.
            </Text>
          ) : results.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>
              No entries matched "{query.trim()}".
            </Text>
          ) : (
            results.map((entry) => (
              <Card key={entry.id} style={styles.innerCard}>
                <Text variant="body">{entry.title ?? 'Untitled entry'}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {entry.entryDate}
                  {entry.matchedTagNames.length > 0 ? ` · matched tags: ${entry.matchedTagNames.join(', ')}` : ''}
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
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  innerCard: {
    gap: spacing.xs,
  },
});
