import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  exportFlashData,
  getFlashDashboard,
  getFlashSetting,
  listDecks,
  listFlashExportRecords,
  serializeFlashExport,
  setFlashSetting,
} from '@mylife/flash';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const FLASH_ACCENT = '#FBBF24';
const TARGETS = ['1', '5', '10'];
const LIMITS = ['10', '20', '50', '100', '200'];
const REMINDER_TIMES = ['07:30', '09:00', '18:00', '21:00'];
const RETENTION = ['0.85', '0.90', '0.95'];

export default function FlashSettingsScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState<string | null>(null);
  const refresh = () => setTick((value) => value + 1);
  const decks = listDecks(db);
  const dashboard = getFlashDashboard(db);
  const dailyTarget = getFlashSetting(db, 'dailyStudyTarget') ?? '1';
  const dailyNewLimit = getFlashSetting(db, 'dailyNewLimit') ?? '20';
  const dailyReviewLimit = getFlashSetting(db, 'dailyReviewLimit') ?? '200';
  const autoBurySiblings = getFlashSetting(db, 'autoBurySiblings') ?? '1';
  const reminderEnabled = getFlashSetting(db, 'dailyReminderEnabled') ?? '0';
  const reminderTime = getFlashSetting(db, 'dailyReminderTime') ?? '09:00';
  const desiredRetention = getFlashSetting(db, 'desiredRetention') ?? '0.90';
  const exportHistory = listFlashExportRecords(db).slice(0, 4);

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
        <Text variant="subheading">Study Limits</Text>
        <Text variant="caption" color={colors.textSecondary}>
          These controls cover the current local queue limits and sibling bury behavior.
        </Text>
        <View style={styles.list}>
          <Text variant="body">New cards/day: {dailyNewLimit}</Text>
          <View style={styles.chipRow}>
            {LIMITS.slice(0, 4).map((value) => {
              const selected = value === dailyNewLimit;
              return (
                <Pressable
                  key={`new-${value}`}
                  onPress={() => {
                    setFlashSetting(db, 'dailyNewLimit', value);
                    refresh();
                  }}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="body">Reviews/day: {dailyReviewLimit}</Text>
          <View style={styles.chipRow}>
            {LIMITS.map((value) => {
              const selected = value === dailyReviewLimit;
              return (
                <Pressable
                  key={`review-${value}`}
                  onPress={() => {
                    setFlashSetting(db, 'dailyReviewLimit', value);
                    refresh();
                  }}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Behavior</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Auto-bury keeps sibling cards out of the same session. Reminder timing is stored locally for later notification wiring.
        </Text>
        <View style={styles.chipRow}>
          {[
            { label: 'Auto-bury on', value: '1' },
            { label: 'Auto-bury off', value: '0' },
          ].map((option) => {
            const selected = option.value === autoBurySiblings;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setFlashSetting(db, 'autoBurySiblings', option.value);
                  refresh();
                }}
                style={[styles.chip, selected ? styles.chipActive : null]}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.chipRow}>
          {[
            { label: 'Reminder off', value: '0' },
            { label: 'Reminder on', value: '1' },
          ].map((option) => {
            const selected = option.value === reminderEnabled;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setFlashSetting(db, 'dailyReminderEnabled', option.value);
                  refresh();
                }}
                style={[styles.chip, selected ? styles.chipActive : null]}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.chipRow}>
          {REMINDER_TIMES.map((value) => {
            const selected = value === reminderTime;
            return (
              <Pressable
                key={value}
                onPress={() => {
                  setFlashSetting(db, 'dailyReminderTime', value);
                  refresh();
                }}
                style={[styles.chip, selected ? styles.chipActive : null]}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.chipRow}>
          {RETENTION.map((value) => {
            const selected = value === desiredRetention;
            return (
              <Pressable
                key={value}
                onPress={() => {
                  setFlashSetting(db, 'desiredRetention', value);
                  refresh();
                }}
                style={[styles.chip, selected ? styles.chipActive : null]}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {Number(value) * 100}%
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Export & History</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Current export covers local JSON, markdown, and text bundles plus export history. Full .apkg packaging is still pending.
        </Text>
        <View style={styles.chipRow}>
          <Pressable
            style={styles.chip}
            onPress={() => {
              const bundle = exportFlashData(db, { includeScheduling: true, includeTags: true });
              setPreviewLabel('JSON archive');
              setPreview(serializeFlashExport(bundle, 'json').slice(0, 420));
              refresh();
            }}
          >
            <Text variant="caption" color={colors.textSecondary}>JSON archive</Text>
          </Pressable>
          <Pressable
            style={styles.chip}
            onPress={() => {
              const bundle = exportFlashData(db, { includeScheduling: true, includeTags: true });
              setPreviewLabel('Markdown handoff');
              setPreview(serializeFlashExport(bundle, 'markdown'));
              refresh();
            }}
          >
            <Text variant="caption" color={colors.textSecondary}>Markdown</Text>
          </Pressable>
          <Pressable
            style={styles.chip}
            onPress={() => {
              const bundle = exportFlashData(db, { includeScheduling: false, includeTags: false });
              setPreviewLabel('Text share');
              setPreview(serializeFlashExport(bundle, 'text'));
              refresh();
            }}
          >
            <Text variant="caption" color={colors.textSecondary}>Text</Text>
          </Pressable>
        </View>
        {preview ? (
          <Card style={styles.previewCard}>
            <Text variant="body">{previewLabel}</Text>
            <Text variant="caption" color={colors.textSecondary}>
              {preview}
            </Text>
          </Card>
        ) : null}
        <View style={styles.list}>
          {exportHistory.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>
              No exports yet.
            </Text>
          ) : (
            exportHistory.map((record) => (
              <Text key={record.id} variant="caption" color={colors.textSecondary}>
                {record.fileName} · {record.cardsExported} cards · {record.exportedAt.slice(0, 16)}
              </Text>
            ))
          )}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Spec Gap Check</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Implemented now: deck creation, basic, reversed, and cloze cards, browser search, queue controls,
          reminder preferences, export history, study queue, lightweight scheduling, review logs, and streaks.
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          Still missing from the full spec: true FSRS parameter tuning, nested decks, rich media and image occlusion,
          bulk browser actions, import and .apkg packaging, undo review, AI generation, shared decks,
          practice tests, match game, leagues, and onboarding flows.
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
  previewCard: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
});
