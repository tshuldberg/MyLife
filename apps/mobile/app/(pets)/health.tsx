import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  createMedication,
  createVaccination,
  createVetVisit,
  createWeightEntry,
  listMedicationsForPet,
  listPets,
  listVaccinationsForPet,
  listVetVisitsForPet,
  listWeightEntriesForPet,
  recordMedicationLog,
} from '@mylife/pets';
import type { MedicationFrequency, VetVisitType } from '@mylife/pets';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const VISIT_TYPES: VetVisitType[] = ['wellness', 'sick', 'emergency'];
const MED_FREQUENCIES: MedicationFrequency[] = ['daily', 'weekly', 'monthly', 'as_needed'];

export default function PetsHealthScreen() {
  const db = useDatabase();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [visitReason, setVisitReason] = useState('');
  const [visitType, setVisitType] = useState<VetVisitType>('wellness');
  const [vaccineName, setVaccineName] = useState('');
  const [vaccineDueDate, setVaccineDueDate] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [medicationFrequency, setMedicationFrequency] = useState<MedicationFrequency>('monthly');
  const [medicationNextDue, setMedicationNextDue] = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((value) => value + 1);

  const pets = useMemo(() => listPets(db), [db, tick]);
  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? pets[0] ?? null,
    [pets, selectedPetId],
  );
  const visits = useMemo(
    () => (selectedPet ? listVetVisitsForPet(db, selectedPet.id) : []),
    [db, selectedPet, tick],
  );
  const vaccinations = useMemo(
    () => (selectedPet ? listVaccinationsForPet(db, selectedPet.id) : []),
    [db, selectedPet, tick],
  );
  const medications = useMemo(
    () => (selectedPet ? listMedicationsForPet(db, selectedPet.id, true) : []),
    [db, selectedPet, tick],
  );
  const weights = useMemo(
    () => (selectedPet ? listWeightEntriesForPet(db, selectedPet.id) : []),
    [db, selectedPet, tick],
  );

  if (!selectedPet) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card>
          <Text variant="subheading">Health Tracking</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Add a pet in the Pets tab before tracking health records.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Selected Pet</Text>
        <View style={styles.chipRow}>
          {pets.map((pet) => {
            const selected = pet.id === selectedPet.id;
            return (
              <Pressable
                key={pet.id}
                onPress={() => setSelectedPetId(pet.id)}
                style={[styles.chip, selected ? styles.chipActive : null]}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {pet.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Log Vet Visit</Text>
        <View style={styles.formGrid}>
          <View style={styles.chipRow}>
            {VISIT_TYPES.map((option) => {
              const selected = option === visitType;
              return (
                <Pressable
                  key={option}
                  onPress={() => setVisitType(option)}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            value={visitReason}
            onChangeText={setVisitReason}
            placeholder="Reason for visit"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (!visitReason.trim()) return;
              createVetVisit(db, uuid(), {
                petId: selectedPet.id,
                visitDate: new Date().toISOString().slice(0, 10),
                visitType,
                reason: visitReason.trim(),
              });
              setVisitReason('');
              refresh();
            }}
          >
            <Text variant="label" color={colors.background}>Add Visit</Text>
          </Pressable>
        </View>
        <View style={styles.list}>
          {visits.slice(0, 3).map((visit) => (
            <View key={visit.id} style={styles.rowBetween}>
              <View style={styles.mainCopy}>
                <Text variant="body">{visit.reason}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {visit.visitType} · {visit.visitDate}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Vaccinations</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={vaccineName}
            onChangeText={setVaccineName}
            placeholder="Vaccine name"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={vaccineDueDate}
            onChangeText={setVaccineDueDate}
            placeholder="Next due YYYY-MM-DD"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (!vaccineName.trim()) return;
              createVaccination(db, uuid(), {
                petId: selectedPet.id,
                name: vaccineName.trim(),
                dateGiven: new Date().toISOString().slice(0, 10),
                nextDueDate: vaccineDueDate.trim() || null,
              });
              setVaccineName('');
              setVaccineDueDate('');
              refresh();
            }}
          >
            <Text variant="label" color={colors.background}>Add Vaccine</Text>
          </Pressable>
        </View>
        <View style={styles.list}>
          {vaccinations.slice(0, 3).map((vaccination) => (
            <View key={vaccination.id} style={styles.rowBetween}>
              <View style={styles.mainCopy}>
                <Text variant="body">{vaccination.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  Due {vaccination.nextDueDate ?? 'not set'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Medications</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={medicationName}
            onChangeText={setMedicationName}
            placeholder="Medication name"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.chipRow}>
            {MED_FREQUENCIES.map((option) => {
              const selected = option === medicationFrequency;
              return (
                <Pressable
                  key={option}
                  onPress={() => setMedicationFrequency(option)}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {option.replace('_', ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            value={medicationNextDue}
            onChangeText={setMedicationNextDue}
            placeholder="Next due ISO (optional)"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (!medicationName.trim()) return;
              createMedication(db, uuid(), {
                petId: selectedPet.id,
                name: medicationName.trim(),
                frequency: medicationFrequency,
                startsOn: new Date().toISOString().slice(0, 10),
                nextDueAt: medicationNextDue.trim() || null,
              });
              setMedicationName('');
              setMedicationNextDue('');
              refresh();
            }}
          >
            <Text variant="label" color={colors.background}>Add Medication</Text>
          </Pressable>
        </View>
        <View style={styles.list}>
          {medications.slice(0, 3).map((medication) => (
            <View key={medication.id} style={styles.rowBetween}>
              <View style={styles.mainCopy}>
                <Text variant="body">{medication.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {medication.frequency} · {medication.nextDueAt ?? 'No due time'}
                </Text>
              </View>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  recordMedicationLog(db, { medicationId: medication.id });
                  refresh();
                }}
              >
                <Text variant="label" color={colors.text}>Given</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Weight Log</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={weightGrams}
            onChangeText={setWeightGrams}
            placeholder="Weight in grams"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
          <Pressable
            style={styles.primaryButtonCompact}
            onPress={() => {
              const parsed = Number(weightGrams);
              if (!parsed) return;
              createWeightEntry(db, uuid(), {
                petId: selectedPet.id,
                weightGrams: parsed,
              });
              setWeightGrams('');
              refresh();
            }}
          >
            <Text variant="label" color={colors.background}>Log</Text>
          </Pressable>
        </View>
        <View style={styles.list}>
          {weights.slice(0, 4).map((entry) => (
            <Text key={entry.id} variant="caption" color={colors.textSecondary}>
              {entry.loggedAt.slice(0, 10)} · {(entry.weightGrams / 1000).toFixed(1)} kg
            </Text>
          ))}
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
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  primaryButtonCompact: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mainCopy: {
    flex: 1,
    gap: 4,
  },
});
