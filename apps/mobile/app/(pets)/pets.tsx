import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  calculatePetAgeYears,
  createPet,
  createPetPhoto,
  getBreedHealthAlerts,
  getPetDashboard,
  listPetPhotosForPet,
  listPets,
  updatePet,
} from '@mylife/pets';
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
  const [photoUri, setPhotoUri] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
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
  const photos = useMemo(
    () => (selectedPet ? listPetPhotosForPet(db, selectedPet.id) : []),
    [db, selectedPet, tick],
  );
  const breedAlerts = useMemo(
    () => (selectedPet ? getBreedHealthAlerts(selectedPet.species, selectedPet.breed) : []),
    [selectedPet],
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
            <Stat label="Photos" value={String(dashboard.photoCount)} />
          </View>
          <Text variant="caption" color={colors.textSecondary}>
            Next feeding: {dashboard.nextFeedingAt ?? 'Not set'} · Last walk: {dashboard.lastExerciseAt?.slice(0, 10) ?? 'None'}
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Next grooming due: {dashboard.nextGroomingDueDate ?? 'Not scheduled'} · Last vet visit: {dashboard.lastVetVisitDate ?? 'None'}
          </Text>
        </Card>
      ) : null}

      {selectedPet ? (
        <Card>
          <Text variant="subheading">Photo Gallery</Text>
          <View style={styles.formGrid}>
            <TextInput
              style={styles.input}
              value={photoUri}
              onChangeText={setPhotoUri}
              placeholder="Local photo URI"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={photoCaption}
              onChangeText={setPhotoCaption}
              placeholder="Caption or milestone"
              placeholderTextColor={colors.textTertiary}
            />
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (!photoUri.trim()) {
                  return;
                }

                createPetPhoto(db, uuid(), {
                  petId: selectedPet.id,
                  imageUri: photoUri.trim(),
                  caption: photoCaption.trim() || null,
                });
                setPhotoUri('');
                setPhotoCaption('');
                refresh();
              }}
            >
              <Text variant="label" color={colors.background}>Add Photo</Text>
            </Pressable>
          </View>
          <View style={styles.list}>
            {photos.length === 0 ? (
              <Text variant="caption" color={colors.textSecondary}>No local photos saved yet.</Text>
            ) : (
              photos.slice(0, 4).map((photo) => (
                <Text key={photo.id} variant="caption" color={colors.textSecondary}>
                  {photo.caption ?? 'Photo'} · {photo.imageUri}
                </Text>
              ))
            )}
          </View>
        </Card>
      ) : null}

      {selectedPet && breedAlerts.length > 0 ? (
        <Card>
          <Text variant="subheading">Breed Health Alerts</Text>
          <View style={styles.list}>
            {breedAlerts.map((alert) => (
              <View key={alert.id} style={styles.mainCopy}>
                <Text variant="body">{alert.condition}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {alert.severity} · {alert.description}
                </Text>
              </View>
            ))}
          </View>
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
    fontSize: 20,
    fontWeight: '700',
  },
});
