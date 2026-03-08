import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { calculatePetAgeYears, createPet, getPetDashboard, listPets, updatePet } from '@mylife/pets';
import type { PetSpecies } from '@mylife/pets';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const SPECIES: PetSpecies[] = ['dog', 'cat', 'bird', 'rabbit', 'other'];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

export default function PetsHomeScreen() {
  const db = useDatabase();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((value) => value + 1);

  const pets = useMemo(() => listPets(db, { includeArchived: true }), [db, tick]);
  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? pets.find((pet) => !pet.isArchived) ?? pets[0] ?? null,
    [pets, selectedPetId],
  );
  const dashboard = useMemo(
    () => (selectedPet ? getPetDashboard(db, selectedPet.id) : null),
    [db, selectedPet, tick],
  );

  const handleAddPet = () => {
    if (!name.trim()) {
      return;
    }

    const id = uuid();
    createPet(db, id, {
      name: name.trim(),
      species,
      breed: breed.trim() || null,
      birthDate: birthDate.trim() || null,
    });
    setName('');
    setBreed('');
    setBirthDate('');
    setSelectedPetId(id);
    refresh();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Add Pet</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Pet name"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.chipRow}>
            {SPECIES.map((option) => {
              const selected = option === species;
              return (
                <Pressable
                  key={option}
                  onPress={() => setSpecies(option)}
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
            value={breed}
            onChangeText={setBreed}
            placeholder="Breed (optional)"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="Birth date YYYY-MM-DD"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable style={styles.primaryButton} onPress={handleAddPet}>
            <Text variant="label" color={colors.background}>Save Pet</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Pet Profiles</Text>
        <View style={styles.list}>
          {pets.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>No pets added yet.</Text>
          ) : (
            pets.map((pet) => {
              const selected = selectedPet?.id === pet.id;
              const age = calculatePetAgeYears(pet.birthDate);
              return (
                <Card key={pet.id} style={[styles.innerCard, selected ? styles.innerCardSelected : null]}>
                  <View style={styles.rowBetween}>
                    <Pressable style={styles.mainCopy} onPress={() => setSelectedPetId(pet.id)}>
                      <Text variant="body">{pet.name}</Text>
                      <Text variant="caption" color={colors.textSecondary}>
                        {pet.species} · {pet.breed ?? 'Breed unknown'}{age ? ` · ${age}y` : ''}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={pet.isArchived ? styles.primaryButtonSmall : styles.secondaryButtonSmall}
                      onPress={() => {
                        updatePet(db, pet.id, { isArchived: !pet.isArchived });
                        refresh();
                      }}
                    >
                      <Text variant="label" color={pet.isArchived ? colors.background : colors.text}>
                        {pet.isArchived ? 'Restore' : 'Archive'}
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </Card>

      {selectedPet && dashboard ? (
        <Card>
          <Text variant="subheading">{selectedPet.name} Dashboard</Text>
          <View style={styles.statsGrid}>
            <Stat label="Due Vaccines" value={String(dashboard.dueVaccinations)} />
            <Stat label="Due Meds" value={String(dashboard.dueMedications)} />
            <Stat label="Spent" value={`$${(dashboard.totalExpensesCents / 100).toFixed(0)}`} />
            <Stat label="Weight" value={dashboard.latestWeightGrams ? `${(dashboard.latestWeightGrams / 1000).toFixed(1)}kg` : 'N/A'} />
          </View>
          <Text variant="caption" color={colors.textSecondary}>
            Next feeding: {dashboard.nextFeedingAt ?? 'Not set'} · Last vet visit: {dashboard.lastVetVisitDate ?? 'None'}
          </Text>
        </Card>
      ) : null}
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
  primaryButtonSmall: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  secondaryButtonSmall: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  innerCard: {
    backgroundColor: colors.surfaceElevated,
  },
  innerCardSelected: {
    borderColor: '#F59E0B',
    borderWidth: 1,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    minWidth: 110,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
});
