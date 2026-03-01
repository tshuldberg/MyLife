import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  createMedicationExtended,
  getActiveMedications,
  checkInteractions,
  type MedFrequency,
} from '@mylife/meds';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const FREQUENCIES: MedFrequency[] = ['daily', 'twice_daily', 'weekly', 'as_needed', 'custom'];
const UNITS = ['mg', 'mcg', 'g', 'ml', 'units', 'tablets', 'capsules', 'drops'];

export default function AddMedScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg');
  const [frequency, setFrequency] = useState<MedFrequency>('daily');
  const [pillCount, setPillCount] = useState('');
  const [pillsPerDose, setPillsPerDose] = useState('1');
  const [timeSlots, setTimeSlots] = useState('08:00');
  const [instructions, setInstructions] = useState('');
  const [prescriber, setPrescriber] = useState('');
  const [pharmacy, setPharmacy] = useState('');

  const handleSave = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert('Required', 'Medication name is required.');
      return;
    }

    const activeMeds = getActiveMedications(db);
    const activeMedNames = activeMeds.map((m) => m.name);
    const warnings = checkInteractions(db, cleanName, activeMedNames);

    const doCreate = () => {
      const slots = timeSlots
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      createMedicationExtended(db, uuid(), {
        name: cleanName,
        dosage: dosage.trim() || undefined,
        unit: unit || undefined,
        frequency,
        pillCount: pillCount ? Number(pillCount) : undefined,
        pillsPerDose: pillsPerDose ? Number(pillsPerDose) : undefined,
        timeSlots: slots.length > 0 ? slots : undefined,
        instructions: instructions.trim() || undefined,
        prescriber: prescriber.trim() || undefined,
        pharmacy: pharmacy.trim() || undefined,
      });
      router.back();
    };

    if (warnings.length > 0) {
      const msg = warnings
        .map((w) => `${w.drug} (${w.severity}): ${w.description}`)
        .join('\n');
      Alert.alert('Interaction Warning', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Anyway', onPress: doCreate },
      ]);
    } else {
      doCreate();
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">New Medication</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Medication name *"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex1]}
              value={dosage}
              onChangeText={setDosage}
              placeholder="Dosage (e.g. 10)"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
            <View style={styles.unitPicker}>
              {UNITS.map((u) => (
                <Pressable
                  key={u}
                  style={[styles.chip, u === unit && styles.chipSelected]}
                  onPress={() => setUnit(u)}
                >
                  <Text
                    variant="caption"
                    color={u === unit ? colors.background : colors.textSecondary}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text variant="caption" color={colors.textSecondary}>Frequency</Text>
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <Pressable
                key={f}
                style={[styles.chip, f === frequency && styles.chipSelected]}
                onPress={() => setFrequency(f)}
              >
                <Text
                  variant="caption"
                  color={f === frequency ? colors.background : colors.textSecondary}
                >
                  {f.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={pillCount}
                onChangeText={setPillCount}
                placeholder="Pill count"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={pillsPerDose}
                onChangeText={setPillsPerDose}
                placeholder="Pills per dose"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TextInput
            style={styles.input}
            value={timeSlots}
            onChangeText={setTimeSlots}
            placeholder="Time slots (e.g. 08:00, 20:00)"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Instructions (e.g. take with food)"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={prescriber}
            onChangeText={setPrescriber}
            placeholder="Prescriber"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={pharmacy}
            onChangeText={setPharmacy}
            placeholder="Pharmacy"
            placeholderTextColor={colors.textTertiary}
          />

          <Pressable style={styles.primaryButton} onPress={handleSave}>
            <Text variant="label" color={colors.background}>Save Medication</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text variant="label">Cancel</Text>
          </Pressable>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  formGrid: { marginTop: spacing.sm, gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },
  unitPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.modules.meds,
    backgroundColor: colors.modules.meds,
  },
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
});
