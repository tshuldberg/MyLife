import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  getJournalDashboard,
  getJournalSetting,
  listJournalEntries,
  listJournalTags,
  setJournalSetting,
} from '@mylife/journal';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const JOURNAL_ACCENT = '#A78BFA';

export default function JournalSettingsScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((value) => value + 1);
  const entries = listJournalEntries(db, { limit: 200 });
  const tags = listJournalTags(db);
  const dashboard = getJournalDashboard(db);
  const promptEnabled = getJournalSetting(db, 'dailyPromptEnabled') === 'true';

  void tick;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Module Snapshot</Text>
        <View style={styles.list}>
          <Text variant="body">Entries: {entries.length}</Text>
          <Text variant="body">Tags: {tags.length}</Text>
          <Text variant="body">Current streak: {dashboard.currentStreak}</Text>
          <Text variant="body">Longest streak: {dashboard.longestStreak}</Text>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Prompt Preference</Text>
        <Text variant="caption" color={colors.textSecondary}>
          This flag is stored locally now, but the full 365-prompt rotation and prompt categories
          from the spec are not wired into the hub yet.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            setJournalSetting(db, 'dailyPromptEnabled', promptEnabled ? 'false' : 'true');
            refresh();
          }}
        >
          <Text variant="label" color={colors.background}>
            {promptEnabled ? 'Disable prompt preference' : 'Enable prompt preference'}
          </Text>
        </Pressable>
      </Card>

      <Card>
        <Text variant="subheading">Spec Gap Check</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Implemented now: dated journal entries, tags, mood labels, basic settings, simple local
          search, and streak plus word-count dashboard stats.
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          Still missing from the full spec: rich markdown toolbar and reading view, multiple
          journals, photo and voice attachment flows, encryption with biometric lock, FTS5 search,
          calendar heatmap, On This Day, export, CBT and gratitude templates, metadata capture,
          and printed-book workflows.
        </Text>
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
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: JOURNAL_ACCENT,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
