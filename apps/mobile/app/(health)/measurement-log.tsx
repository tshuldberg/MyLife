import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import { logVital, type VitalType } from '@mylife/health';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;

const VITAL_PRESETS: { type: VitalType; label: string; unit: string; placeholder: string }[] = [
  { type: 'heart_rate', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
  { type: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80' },
  { type: 'blood_oxygen', label: 'Blood Oxygen', unit: '%', placeholder: '98' },
  { type: 'body_temperature', label: 'Temperature', unit: 'F', placeholder: '98.6' },
  { type: 'respiratory_rate', label: 'Respiratory Rate', unit: 'breaths/min', placeholder: '16' },
  { type: 'steps', label: 'Steps', unit: 'steps', placeholder: '10000' },
  { type: 'active_energy', label: 'Active Energy', unit: 'kcal', placeholder: '350' },
];

export default function MeasurementLogScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [selected, setSelected] = useState<VitalType>('heart_rate');
  const [value, setValue] = useState('');
  const [valueSecondary, setValueSecondary] = useState('');

  const preset = VITAL_PRESETS.find((p) => p.type === selected);
  const isBP = selected === 'blood_pressure';

  const handleSave = () => {
    const numVal = Number(value);
    if (!Number.isFinite(numVal) || numVal <= 0) {
      Alert.alert('Invalid value', 'Please enter a valid number.');
      return;
    }

    try {
      logVital(db, {
        vital_type: selected,
        value: numVal,
        value_secondary: isBP ? Number(valueSecondary) || undefined : undefined,
        unit: preset?.unit ?? '',
        source: 'manual',
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save measurement.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>Log Measurement</Text>

      {/* Type selector */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Measurement Type</Text>
        <View style={styles.chipRow}>
          {VITAL_PRESETS.map((p) => (
            <Pressable
              key={p.type}
              style={[styles.chip, selected === p.type && styles.chipActive]}
              onPress={() => {
                setSelected(p.type);
                setValue('');
                setValueSecondary('');
              }}
            >
              <Text
                variant="caption"
                color={selected === p.type ? colors.background : colors.text}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Value input */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>
          {preset?.label ?? 'Value'} ({preset?.unit ?? ''})
        </Text>
        {isBP ? (
          <View style={styles.bpRow}>
            <TextInput
              style={[styles.input, styles.bpInput]}
              placeholder="Systolic"
              placeholderTextColor={colors.textTertiary}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
            />
            <Text variant="body" color={colors.textSecondary}>/</Text>
            <TextInput
              style={[styles.input, styles.bpInput]}
              placeholder="Diastolic"
              placeholderTextColor={colors.textTertiary}
              value={valueSecondary}
              onChangeText={setValueSecondary}
              keyboardType="numeric"
            />
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder={preset?.placeholder ?? '0'}
            placeholderTextColor={colors.textTertiary}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
          />
        )}
      </Card>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text variant="label" color={colors.background}>Save</Text>
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
    fontSize: 18,
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bpInput: {
    flex: 1,
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
