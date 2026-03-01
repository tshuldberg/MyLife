import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  createHabit,
  type HabitType,
  type Frequency,
  type TimeOfDay,
  type DayOfWeek,
} from '@mylife/habits';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const HABIT_TYPES: HabitType[] = ['standard', 'timed', 'negative', 'measurable'];
const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly', 'specific_days'];
const TIMES_OF_DAY: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];
const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

const EMOJI_OPTIONS = [
  '\u2705', '\uD83D\uDCAA', '\uD83D\uDCDA', '\uD83C\uDFC3', '\uD83E\uDDD8',
  '\uD83D\uDCA7', '\uD83C\uDF4E', '\uD83D\uDE34', '\u2708\uFE0F', '\uD83C\uDFB5',
  '\u270D\uFE0F', '\uD83E\uDD14', '\uD83D\uDE4F', '\uD83C\uDFAF', '\uD83D\uDD25',
  '\u2B50', '\uD83C\uDF1F', '\uD83C\uDF3F', '\u2764\uFE0F', '\uD83D\uDCA4',
];

const COLOR_OPTIONS = [
  '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#14B8A6', '#3B82F6', '#6366F1', '#A855F7',
];

export default function AddHabitScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('\u2705');
  const [color, setColor] = useState('#8B5CF6');
  const [habitType, setHabitType] = useState<HabitType>('standard');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('anytime');
  const [specificDays, setSpecificDays] = useState<DayOfWeek[]>([]);
  const [targetCount, setTargetCount] = useState('1');
  const [unit, setUnit] = useState('');
  const [gracePeriod, setGracePeriod] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    setSpecificDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSave = () => {
    const clean = name.trim();
    if (!clean) return;

    createHabit(db, uuid(), {
      name: clean,
      icon,
      color,
      habitType,
      frequency,
      timeOfDay,
      specificDays: frequency === 'specific_days' ? specificDays : undefined,
      targetCount: parseInt(targetCount, 10) || 1,
      gracePeriod: gracePeriod ? 1 : 0,
    });

    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Habit name"
          placeholderTextColor={colors.textTertiary}
          autoFocus
        />
      </Card>

      <Card>
        <Text variant="subheading">Icon</Text>
        <View style={styles.optionGrid}>
          {EMOJI_OPTIONS.map((e) => (
            <Pressable
              key={e}
              style={[styles.emojiBtn, icon === e ? styles.emojiBtnSelected : null]}
              onPress={() => setIcon(e)}
            >
              <Text style={styles.emoji}>{e}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Color</Text>
        <View style={styles.optionGrid}>
          {COLOR_OPTIONS.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorBtn, { backgroundColor: c }, color === c ? styles.colorBtnSelected : null]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Habit Type</Text>
        <View style={styles.chipRow}>
          {HABIT_TYPES.map((t) => {
            const selected = t === habitType;
            return (
              <Pressable
                key={t}
                style={[styles.chip, selected ? styles.chipSelected : null]}
                onPress={() => setHabitType(t)}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.xs }}>
          {habitType === 'standard' && 'Check off daily. Simple yes/no tracking.'}
          {habitType === 'timed' && 'Track time spent. Set a target duration in seconds.'}
          {habitType === 'negative' && 'Track avoidance. Log slips to maintain clean streaks.'}
          {habitType === 'measurable' && 'Count progress toward a numeric target.'}
        </Text>
      </Card>

      <Card>
        <Text variant="subheading">Frequency</Text>
        <View style={styles.chipRow}>
          {FREQUENCIES.map((f) => {
            const selected = f === frequency;
            const label = f === 'specific_days' ? 'specific days' : f;
            return (
              <Pressable
                key={f}
                style={[styles.chip, selected ? styles.chipSelected : null]}
                onPress={() => setFrequency(f)}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {frequency === 'specific_days' && (
          <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
            {DAYS.map((d) => {
              const selected = specificDays.includes(d);
              return (
                <Pressable
                  key={d}
                  style={[styles.dayChip, selected ? styles.dayChipSelected : null]}
                  onPress={() => toggleDay(d)}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {DAY_LABELS[d]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Card>

      <Card>
        <Text variant="subheading">Time of Day</Text>
        <View style={styles.chipRow}>
          {TIMES_OF_DAY.map((t) => {
            const selected = t === timeOfDay;
            return (
              <Pressable
                key={t}
                style={[styles.chip, selected ? styles.chipSelected : null]}
                onPress={() => setTimeOfDay(t)}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {(habitType === 'measurable' || habitType === 'timed') && (
        <Card>
          <Text variant="subheading">
            {habitType === 'timed' ? 'Target Duration (seconds)' : 'Target Count'}
          </Text>
          <View style={styles.targetRow}>
            <TextInput
              style={[styles.input, styles.targetInput]}
              value={targetCount}
              onChangeText={setTargetCount}
              keyboardType="number-pad"
              placeholderTextColor={colors.textTertiary}
            />
            {habitType === 'measurable' && (
              <TextInput
                style={[styles.input, styles.unitInput]}
                value={unit}
                onChangeText={setUnit}
                placeholder="unit (e.g. cups, pages)"
                placeholderTextColor={colors.textTertiary}
              />
            )}
          </View>
        </Card>
      )}

      <Card>
        <Pressable style={styles.toggleRow} onPress={() => setGracePeriod(!gracePeriod)}>
          <View>
            <Text variant="body">Grace Period</Text>
            <Text variant="caption" color={colors.textTertiary}>
              Allow 1 missed day without breaking streak
            </Text>
          </View>
          <View style={[styles.toggle, gracePeriod ? styles.toggleOn : null]}>
            <View style={[styles.toggleThumb, gracePeriod ? styles.toggleThumbOn : null]} />
          </View>
        </Pressable>
      </Card>

      <Pressable
        style={[styles.saveButton, !name.trim() ? styles.saveDisabled : null]}
        onPress={handleSave}
        disabled={!name.trim()}
      >
        <Text variant="label" color={colors.background}>Create Habit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    color: colors.text, backgroundColor: colors.surfaceElevated, marginTop: spacing.sm,
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  emojiBtn: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  emojiBtnSelected: { borderColor: colors.modules.habits },
  emoji: { fontSize: 20 },
  colorBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent',
  },
  colorBtnSelected: { borderColor: colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 999,
    paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.modules.habits, backgroundColor: colors.modules.habits },
  dayChip: {
    width: 40, borderRadius: 8, paddingVertical: 6, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  dayChipSelected: { borderColor: colors.modules.habits, backgroundColor: colors.modules.habits },
  targetRow: { flexDirection: 'row', gap: spacing.sm },
  targetInput: { flex: 1 },
  unitInput: { flex: 2 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  toggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: colors.border,
    justifyContent: 'center', padding: 2,
  },
  toggleOn: { backgroundColor: colors.modules.habits },
  toggleThumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.text,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  saveButton: {
    borderRadius: 8, backgroundColor: colors.modules.habits,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  saveDisabled: { opacity: 0.5 },
});
