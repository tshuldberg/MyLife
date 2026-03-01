import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import {
  getSetting,
  setSetting,
  exportAllCSV,
  countHabits,
} from '@mylife/habits';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const WEEK_STARTS = ['monday', 'sunday'] as const;
const GRACE_DEFAULTS = ['0', '1', '2'] as const;

export default function SettingsScreen() {
  const db = useDatabase();

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const weekStartsOn = useMemo(
    () => (getSetting(db, 'week_starts_on') ?? 'monday') as 'monday' | 'sunday',
    [db, tick],
  );
  const defaultGracePeriod = useMemo(
    () => getSetting(db, 'default_grace_period') ?? '0',
    [db, tick],
  );
  const habitCount = useMemo(() => countHabits(db), [db, tick]);

  const handleWeekStart = (value: typeof WEEK_STARTS[number]) => {
    setSetting(db, 'week_starts_on', value);
    refresh();
  };

  const handleGracePeriod = (value: string) => {
    setSetting(db, 'default_grace_period', value);
    refresh();
  };

  const handleExport = async () => {
    try {
      const csv = exportAllCSV(db);
      if (!csv) {
        Alert.alert('No Data', 'There is no habit data to export.');
        return;
      }
      await Share.share({
        message: csv,
        title: 'MyHabits Export',
      });
    } catch {
      Alert.alert('Export Failed', 'Could not export data.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Week Starts On</Text>
        <View style={styles.chipRow}>
          {WEEK_STARTS.map((w) => {
            const selected = w === weekStartsOn;
            return (
              <Pressable
                key={w}
                style={[styles.chip, selected ? styles.chipSelected : null]}
                onPress={() => handleWeekStart(w)}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {w.charAt(0).toUpperCase() + w.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Default Grace Period</Text>
        <Text variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.xs }}>
          Days a streak can survive without completion
        </Text>
        <View style={styles.chipRow}>
          {GRACE_DEFAULTS.map((g) => {
            const selected = g === defaultGracePeriod;
            return (
              <Pressable
                key={g}
                style={[styles.chip, selected ? styles.chipSelected : null]}
                onPress={() => handleGracePeriod(g)}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {g} day{g !== '1' ? 's' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Export Data</Text>
        <Text variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.xs }}>
          Export habits, completions, timed sessions, and measurements as CSV
        </Text>
        <Pressable style={styles.exportBtn} onPress={handleExport}>
          <Text variant="label" color={colors.background}>Export CSV</Text>
        </Pressable>
      </Card>

      <Card>
        <Text variant="subheading">Data</Text>
        <View style={styles.dataRow}>
          <Text variant="body" color={colors.textSecondary}>Total habits</Text>
          <Text variant="body" color={colors.text}>{habitCount}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text variant="body" color={colors.textSecondary}>Storage</Text>
          <Text variant="body" color={colors.text}>On-device SQLite</Text>
        </View>
      </Card>

      <Card style={styles.privacyCard}>
        <Text variant="caption" color={colors.modules.habits}>
          MyHabits is privacy-first. All your data stays on this device.
          No accounts, no cloud sync, no telemetry.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 999,
    paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.modules.habits, backgroundColor: colors.modules.habits },
  exportBtn: {
    borderRadius: 8, backgroundColor: colors.modules.habits,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    alignItems: 'center', alignSelf: 'flex-start', marginTop: spacing.sm,
  },
  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  privacyCard: {
    borderWidth: 1, borderColor: colors.modules.habits, alignItems: 'center',
  },
});
