import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { listDueVaccinationReminders, listPets } from '@mylife/pets';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function PetsSettingsScreen() {
  const db = useDatabase();

  const pets = useMemo(() => listPets(db, { includeArchived: true }), [db]);
  const dueVaccines = useMemo(
    () => listDueVaccinationReminders(db, new Date().toISOString().slice(0, 10), 30),
    [db],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Module Snapshot</Text>
        <View style={styles.list}>
          <Text variant="body">Active pets: {pets.filter((pet) => !pet.isArchived).length}</Text>
          <Text variant="body">Archived pets: {pets.filter((pet) => pet.isArchived).length}</Text>
          <Text variant="body">Vaccines due in 30d: {dueVaccines.length}</Text>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Current Hub Scope</Text>
        <Text variant="caption" color={colors.textSecondary}>
          MyPets currently covers pet profiles, vet visits, vaccinations, medication reminders,
          weight logging, feeding schedules, and expenses in the hub. Emergency contacts, document
          storage, sitter exports, and breed-specific guidance remain future work against the full spec.
        </Text>
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
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
});
