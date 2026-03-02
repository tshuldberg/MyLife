import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import {
  createGoal,
  type GoalDomain,
  type GoalPeriod,
  type GoalDirection,
} from '@mylife/health';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;

const DOMAINS: { id: GoalDomain; label: string; defaultMetric: string; defaultUnit: string }[] = [
  { id: 'steps', label: 'Steps', defaultMetric: 'daily_steps', defaultUnit: 'steps' },
  { id: 'sleep', label: 'Sleep', defaultMetric: 'sleep_hours', defaultUnit: 'hours' },
  { id: 'water', label: 'Water', defaultMetric: 'glasses', defaultUnit: 'glasses' },
  { id: 'fasting', label: 'Fasting', defaultMetric: 'fasts_completed', defaultUnit: 'fasts' },
  { id: 'weight', label: 'Weight', defaultMetric: 'body_weight', defaultUnit: 'lbs' },
  { id: 'adherence', label: 'Med Adherence', defaultMetric: 'adherence_rate', defaultUnit: '%' },
  { id: 'custom', label: 'Custom', defaultMetric: '', defaultUnit: '' },
];

const PERIODS: { id: GoalPeriod; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const DIRECTIONS: { id: GoalDirection; label: string }[] = [
  { id: 'at_least', label: 'At Least' },
  { id: 'at_most', label: 'At Most' },
  { id: 'exactly', label: 'Exactly' },
];

export default function AddGoalScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [domain, setDomain] = useState<GoalDomain>('steps');
  const [period, setPeriod] = useState<GoalPeriod>('daily');
  const [direction, setDirection] = useState<GoalDirection>('at_least');
  const [targetValue, setTargetValue] = useState('');
  const [label, setLabel] = useState('');
  const [customMetric, setCustomMetric] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  const selectedDomain = DOMAINS.find((d) => d.id === domain);
  const isCustom = domain === 'custom';

  const handleSave = () => {
    const numTarget = Number(targetValue);
    if (!Number.isFinite(numTarget) || numTarget <= 0) {
      Alert.alert('Invalid target', 'Please enter a valid target value.');
      return;
    }

    if (isCustom && !customMetric.trim()) {
      Alert.alert('Missing metric', 'Please enter a metric name for your custom goal.');
      return;
    }

    try {
      createGoal(db, {
        domain,
        metric: isCustom ? customMetric.trim() : (selectedDomain?.defaultMetric ?? ''),
        target_value: numTarget,
        unit: isCustom ? customUnit.trim() || undefined : selectedDomain?.defaultUnit,
        period,
        direction,
        label: label.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to create goal.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>New Goal</Text>

      {/* Domain */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Category</Text>
        <View style={styles.chipRow}>
          {DOMAINS.map((d) => (
            <Pressable
              key={d.id}
              style={[styles.chip, domain === d.id && styles.chipActive]}
              onPress={() => setDomain(d.id)}
            >
              <Text
                variant="caption"
                color={domain === d.id ? colors.background : colors.text}
              >
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Custom metric (only for custom domain) */}
      {isCustom && (
        <Card style={styles.card}>
          <Text variant="label" color={colors.textSecondary}>Custom Metric</Text>
          <TextInput
            style={styles.input}
            placeholder="Metric name (e.g., meditation minutes)"
            placeholderTextColor={colors.textTertiary}
            value={customMetric}
            onChangeText={setCustomMetric}
          />
          <TextInput
            style={styles.input}
            placeholder="Unit (e.g., minutes)"
            placeholderTextColor={colors.textTertiary}
            value={customUnit}
            onChangeText={setCustomUnit}
          />
        </Card>
      )}

      {/* Target */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>
          Target ({selectedDomain?.defaultUnit || customUnit || 'value'})
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 10000"
          placeholderTextColor={colors.textTertiary}
          value={targetValue}
          onChangeText={setTargetValue}
          keyboardType="numeric"
        />
      </Card>

      {/* Direction */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Direction</Text>
        <View style={styles.chipRow}>
          {DIRECTIONS.map((d) => (
            <Pressable
              key={d.id}
              style={[styles.chip, direction === d.id && styles.chipActive]}
              onPress={() => setDirection(d.id)}
            >
              <Text
                variant="caption"
                color={direction === d.id ? colors.background : colors.text}
              >
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Period */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Period</Text>
        <View style={styles.chipRow}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.chip, period === p.id && styles.chipActive]}
              onPress={() => setPeriod(p.id)}
            >
              <Text
                variant="caption"
                color={period === p.id ? colors.background : colors.text}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Label */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Label (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Walk 10k steps daily"
          placeholderTextColor={colors.textTertiary}
          value={label}
          onChangeText={setLabel}
        />
      </Card>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text variant="label" color={colors.background}>Create Goal</Text>
      </Pressable>
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
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
