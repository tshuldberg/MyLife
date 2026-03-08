import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { getFlashDashboard, getFlashSetting, listDecks, setFlashSetting } from '@mylife/flash';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const FLASH_ACCENT = '#FBBF24';
const TARGETS = ['1', '5', '10'];

export default function FlashSettingsScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((value) => value + 1);
  const decks = listDecks(db);
  const dashboard = getFlashDashboard(db);
  const dailyTarget = getFlashSetting(db, 'dailyStudyTarget') ?? '1';

  void tick;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Module Snapshot</Text>
        <View style={styles.list}>
          <Text variant="body">Decks: {decks.length}</Text>
          <Text variant="body">Cards: {dashboard.cardCount}</Text>
          <Text variant="body">Due reviews: {dashboard.dueCount}</Text>
          <Text variant="body">Current streak: {dashboard.currentStreak}</Text>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Daily Target</Text>
        <Text variant="caption" color={colors.textSecondary}>
          This target determines how many reviews count as a completed study day in the current hub build.
        </Text>
        <View style={styles.chipRow}>
          {TARGETS.map((target) => {
            const selected = target === dailyTarget;
            return (
              <Pressable
                key={target}
                onPress={() => {
                  setFlashSetting(db, 'dailyStudyTarget', target);
                  refresh();
                }}
                style={[styles.chip, selected ? styles.chipActive : null]}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {target}/day
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Spec Gap Check</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Implemented now: local deck creation, basic and reversed cards, study queue, lightweight
          card scheduling, review logs, streaks, and deck plus dashboard counts.
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          Still missing from the full spec: true FSRS parameterization, nested decks, cloze cards,
          rich media and markdown cards, suspend and bury controls, import and export, advanced
          card browser, reminders, AI generation, shared decks, practice tests, match game, leagues,
          and onboarding flows.
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
    backgroundColor: FLASH_ACCENT,
    borderColor: FLASH_ACCENT,
  },
});
