import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  createJournalEntry,
  getDailyJournalPrompt,
  getEntriesForDate,
  getJournalDashboard,
  getJournalSetting,
  listJournalNotebooks,
} from '@mylife/journal';
import type { JournalMood } from '@mylife/journal';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const JOURNAL_ACCENT = '#A78BFA';
const MOODS: JournalMood[] = ['low', 'okay', 'good', 'great', 'grateful'];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

function splitTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function JournalTodayScreen() {
  const db = useDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [mood, setMood] = useState<JournalMood | null>(null);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((value) => value + 1);
  const notebooks = useMemo(() => listJournalNotebooks(db), [db, tick]);
  const selectedJournal = useMemo(
    () => notebooks.find((journal) => journal.id === selectedJournalId) ?? notebooks[0] ?? null,
    [notebooks, selectedJournalId],
  );
  const promptEnabled = getJournalSetting(db, 'dailyPromptEnabled') === 'true';
  const promptCategory = getJournalSetting(db, 'dailyPromptCategory') ?? 'reflection';
  const prompt = useMemo(
    () => getDailyJournalPrompt(today, promptCategory as 'reflection' | 'gratitude' | 'therapy' | 'stoic'),
    [today, promptCategory],
  );
  const draftWordCount = useMemo(
    () => (body.trim() ? body.trim().split(/\s+/).length : 0),
    [body],
  );
  const todayEntries = useMemo(
    () => getEntriesForDate(db, today, selectedJournal?.id),
    [db, tick, today, selectedJournal],
  );
  const dashboard = useMemo(
    () => getJournalDashboard(db, today, selectedJournal?.id),
    [db, tick, today, selectedJournal],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Today&apos;s Writing</Text>
        {selectedJournal ? (
          <View style={styles.chipRow}>
            {notebooks.map((journal) => {
              const selected = selectedJournal.id === journal.id;
              return (
                <Pressable
                  key={journal.id}
                  onPress={() => setSelectedJournalId(journal.id)}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {journal.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <View style={styles.statsGrid}>
          <Stat label="Entries Today" value={String(todayEntries.length)} />
          <Stat label="Current Streak" value={String(dashboard.currentStreak)} />
          <Stat label="Words This Month" value={String(dashboard.monthlyWords)} />
          <Stat label="Journals" value={String(dashboard.journalCount)} />
        </View>
        <Text variant="caption" color={colors.textSecondary}>
          Notebook-aware entries, prompt rotation, On This Day, and export are now wired into the hub.
          Encryption, voice capture, and richer markdown editing are still pending.
        </Text>
      </Card>

      {promptEnabled ? (
        <Card>
          <Text variant="subheading">Daily Prompt</Text>
          <Text variant="body">{prompt.prompt}</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Category: {prompt.category}
          </Text>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              if (!body.includes(prompt.prompt)) {
                setBody((current) => (current ? `${current}\n\n${prompt.prompt}\n` : `${prompt.prompt}\n`));
              }
            }}
          >
            <Text variant="label" color={colors.text}>Use Prompt</Text>
          </Pressable>
        </Card>
      ) : null}

      <Card>
        <Text variant="subheading">New Entry</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Title (optional)"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder="Write what happened, what mattered, or what you want to remember."
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
          />
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="Tags, comma separated"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.chipRow}>
            {MOODS.map((option) => {
              const selected = option === mood;
              return (
                <Pressable
                  key={option}
                  onPress={() => setMood(selected ? null : option)}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.rowBetween}>
            <Text variant="caption" color={colors.textSecondary}>
              Draft words: {draftWordCount}
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (!body.trim() || !selectedJournal) {
                  return;
                }

                createJournalEntry(db, uuid(), {
                  journalId: selectedJournal.id,
                  entryDate: today,
                  title: title.trim() || null,
                  body: body.trim(),
                  tags: splitTags(tags),
                  mood,
                });
                setTitle('');
                setBody('');
                setTags('');
                setMood(null);
                refresh();
              }}
            >
              <Text variant="label" color={colors.background}>Save Entry</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Today&apos;s Entries</Text>
        <View style={styles.list}>
          {todayEntries.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>
              No entries yet today.
            </Text>
          ) : (
            todayEntries.map((entry) => (
              <Card key={entry.id} style={styles.innerCard}>
                <Text variant="body">{entry.title ?? 'Untitled entry'}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {entry.wordCount} words
                  {entry.mood ? ` · mood: ${entry.mood}` : ''}
                  {entry.tags.length > 0 ? ` · ${entry.tags.join(', ')}` : ''}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {entry.body.slice(0, 160)}
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
  formGrid: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    minWidth: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    gap: 4,
  },
  statValue: {
    color: JOURNAL_ACCENT,
    fontSize: 22,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  bodyInput: {
    minHeight: 140,
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: JOURNAL_ACCENT,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
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
