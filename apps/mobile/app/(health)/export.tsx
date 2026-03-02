import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, colors, spacing } from '@mylife/ui';
import { generateDoctorReport, generateTherapyReport } from '@mylife/health';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;

function getDateRange(): { from: string; to: string } {
  const to = new Date().toISOString().slice(0, 10);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 90);
  return { from: fromDate.toISOString().slice(0, 10), to };
}

export default function ExportScreen() {
  const db = useDatabase();
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleDoctorReport = () => {
    try {
      const { from, to } = getDateRange();
      const report = generateDoctorReport(db, from, to);
      setLastExport(report);
      Alert.alert('Report Generated', 'Doctor report is ready. You can copy the text below.');
    } catch {
      Alert.alert('Error', 'Failed to generate doctor report. Log more data first.');
    }
  };

  const handleTherapyReport = () => {
    try {
      const { from, to } = getDateRange();
      const report = generateTherapyReport(db, from, to);
      setLastExport(report);
      Alert.alert('Report Generated', 'Therapy report is ready. You can copy the text below.');
    } catch {
      Alert.alert('Error', 'Failed to generate therapy report. Log more data first.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>Export Data</Text>
      <Text variant="caption" color={colors.textSecondary} style={styles.subtitle}>
        Generate reports to share with your healthcare providers.
      </Text>

      <Card style={styles.card}>
        <Text variant="subheading">Doctor Report</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Medication list, adherence rates, recent vitals, and active conditions.
        </Text>
        <Pressable style={styles.exportButton} onPress={handleDoctorReport}>
          <Text variant="label" color={colors.background}>Generate</Text>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <Text variant="subheading">Therapy Report</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Mood trends, symptom patterns, sleep quality, and wellness timeline.
        </Text>
        <Pressable style={styles.exportButton} onPress={handleTherapyReport}>
          <Text variant="label" color={colors.background}>Generate</Text>
        </Pressable>
      </Card>

      {lastExport && (
        <Card style={styles.reportCard}>
          <Text variant="label" color={colors.textSecondary}>Preview</Text>
          <Text variant="caption" color={colors.text} selectable>
            {lastExport.slice(0, 2000)}
            {lastExport.length > 2000 ? '\n...(truncated)' : ''}
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  exportButton: {
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reportCard: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
