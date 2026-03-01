import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import {
  generateDoctorReport,
  generateTherapyReport,
  getOverallStats,
  type OverallStats,
} from '@mylife/meds';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.meds;

function dateMinusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function SettingsScreen() {
  const db = useDatabase();
  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => getOverallStats(db), [db]);

  const handleExportDoctor = async () => {
    try {
      const from = dateMinusDays(90);
      const report = generateDoctorReport(db, from, today);
      await Share.share({ message: report, title: 'Doctor Report' });
    } catch {
      Alert.alert('Error', 'Failed to generate report.');
    }
  };

  const handleExportTherapy = async () => {
    try {
      const from = dateMinusDays(90);
      const report = generateTherapyReport(db, from, today);
      await Share.share({ message: report, title: 'Therapy Report' });
    } catch {
      Alert.alert('Error', 'Failed to generate report.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Export Reports</Text>
        <Text variant="caption" color={colors.textSecondary} style={styles.hint}>
          Generate markdown reports covering the last 90 days.
        </Text>
        <View style={styles.buttonGroup}>
          <Pressable style={styles.primaryButton} onPress={handleExportDoctor}>
            <Text variant="label" color={colors.background}>Export for Doctor</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleExportTherapy}>
            <Text variant="label">Export for Therapy</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Overall Summary</Text>
        <View style={styles.statsGrid}>
          <StatRow label="Total Medications" value={String(stats.totalMedications)} />
          <StatRow label="Active Medications" value={String(stats.activeMedications)} />
          <StatRow label="30-Day Adherence" value={`${stats.overallAdherence30d}%`} />
          <StatRow label="Mood Entries (30d)" value={String(stats.moodEntries30d)} />
          <StatRow
            label="Avg Mood Score"
            value={stats.averageMoodScore != null ? stats.averageMoodScore.toFixed(1) : 'N/A'}
          />
          <StatRow label="Symptom Entries (30d)" value={String(stats.symptomEntries30d)} />
        </View>
      </Card>

      <Card>
        <Text variant="subheading">About</Text>
        <Text variant="caption" color={colors.textSecondary}>
          MyMeds v1.0 - Privacy-first medication tracking.
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          All data stored locally on your device. No cloud, no telemetry.
        </Text>
      </Card>
    </ScrollView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text variant="body" color={colors.textSecondary}>{label}</Text>
      <Text variant="body" color={ACCENT}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  hint: { marginTop: spacing.xs },
  buttonGroup: { marginTop: spacing.sm, gap: spacing.sm },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.meds,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statsGrid: { marginTop: spacing.sm, gap: spacing.xs },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
