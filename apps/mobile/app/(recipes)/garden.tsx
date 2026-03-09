import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  createGardenPlant,
  getGardenPlants,
  getNextWateringDate,
  markPlantWatered,
  type GardenPlant,
  type PlantLocation,
} from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const ACCENT = colors.modules.recipes;
const LOCATIONS: PlantLocation[] = ['indoor', 'outdoor', 'raised_bed', 'container'];

function wateringStatus(plant: GardenPlant): { label: string; overdue: boolean } {
  const next = getNextWateringDate(plant);
  const today = new Date().toISOString().slice(0, 10);
  if (next <= today) {
    return { label: 'Needs water', overdue: true };
  }
  return { label: `Water by ${next}`, overdue: false };
}

export default function GardenScreen() {
  const db = useDatabase();

  const [plants, setPlants] = useState<GardenPlant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState<PlantLocation>('outdoor');
  const [interval, setInterval] = useState('3');

  const load = useCallback(() => {
    setPlants(getGardenPlants(db));
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = () => {
    const clean = species.trim();
    if (!clean) {
      Alert.alert('Missing Info', 'Enter a plant species name.');
      return;
    }
    createGardenPlant(db, {
      id: uuid(),
      species: clean,
      location,
      plantingDate: new Date().toISOString().slice(0, 10),
      wateringIntervalDays: Math.max(1, parseInt(interval, 10) || 3),
    });
    setSpecies('');
    setInterval('3');
    setShowForm(false);
    load();
  };

  const handleWater = (plantId: string) => {
    markPlantWatered(db, plantId);
    load();
  };

  const needsWater = plants.filter((p) => wateringStatus(p).overdue);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {needsWater.length > 0 ? (
        <Card>
          <Text variant="subheading">Needs Watering</Text>
          {needsWater.map((plant) => (
            <View key={plant.id} style={styles.plantRow}>
              <View style={styles.flex1}>
                <Text variant="body">{plant.species}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {plant.location.replace('_', ' ')}
                </Text>
              </View>
              <Pressable
                style={styles.waterButton}
                onPress={() => handleWater(plant.id)}
              >
                <Text variant="label" color={colors.background}>Water</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      ) : plants.length > 0 ? (
        <Card>
          <Text variant="subheading" color={ACCENT}>All plants watered!</Text>
          <Text variant="caption" color={colors.textSecondary}>
            No plants need watering right now.
          </Text>
        </Card>
      ) : null}

      <Card>
        <View style={styles.rowBetween}>
          <Text variant="subheading">My Plants ({plants.length})</Text>
          <Pressable onPress={() => setShowForm(!showForm)}>
            <Text variant="label" color={ACCENT}>
              {showForm ? 'Cancel' : '+ Add'}
            </Text>
          </Pressable>
        </View>

        {showForm ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={species}
              onChangeText={setSpecies}
              placeholder="Plant species (e.g., Tomato)"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.chipRow}>
              {LOCATIONS.map((loc) => {
                const active = location === loc;
                return (
                  <Pressable
                    key={loc}
                    onPress={() => setLocation(loc)}
                    style={[styles.chip, active ? styles.chipActive : null]}
                  >
                    <Text
                      variant="caption"
                      color={active ? colors.background : colors.textSecondary}
                    >
                      {loc.replace('_', ' ')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              style={styles.input}
              value={interval}
              onChangeText={setInterval}
              placeholder="Watering interval (days)"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
            <Pressable style={styles.addButton} onPress={handleAdd}>
              <Text variant="label" color={colors.background}>Add Plant</Text>
            </Pressable>
          </View>
        ) : null}

        {plants.map((plant) => {
          const status = wateringStatus(plant);
          return (
            <View key={plant.id} style={styles.plantRow}>
              <View style={styles.flex1}>
                <Text variant="body">{plant.species}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {plant.location.replace('_', ' ')} {'\u00B7'} every {plant.watering_interval_days}d
                </Text>
                <Text
                  variant="caption"
                  color={status.overdue ? colors.danger : colors.textTertiary}
                >
                  {status.label}
                </Text>
              </View>
              <Pressable
                style={[styles.waterSmall, status.overdue ? styles.waterUrgent : null]}
                onPress={() => handleWater(plant.id)}
              >
                <Text variant="caption" color={colors.background}>
                  {'\uD83D\uDCA7'}
                </Text>
              </Pressable>
            </View>
          );
        })}

        {plants.length === 0 && !showForm ? (
          <Text variant="caption" color={colors.textSecondary} style={styles.emptyText}>
            No plants tracked yet. Tap + Add to start.
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  flex1: {
    flex: 1,
  },
  waterButton: {
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  waterSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterUrgent: {
    backgroundColor: '#3B82F6',
  },
  form: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT,
  },
  addButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  emptyText: {
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
});
