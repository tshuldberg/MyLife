import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteWorkout, getWorkouts, type WorkoutDefinition } from '@mylife/workouts';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function WorkoutListScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [items, setItems] = useState<WorkoutDefinition[]>([]);

  const reload = useCallback(() => {
    setItems(getWorkouts(db, { search: search || undefined }));
  }, [db, search]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search workouts"
        placeholderTextColor={colors.textTertiary}
      />

      <Pressable style={styles.primaryButton} onPress={() => router.push('/(workouts)/builder' as never)}>
        <Text variant="label" color={colors.background}>Create Workout</Text>
      </Pressable>

      <View style={styles.list}>
        {items.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <View style={styles.main}>
                <Text variant="body">{item.title}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {item.exercises.length} exercises · {Math.round(item.estimatedDuration / 60)} min · {item.difficulty}
                </Text>
              </View>
              <View style={styles.actions}>
                <Pressable style={styles.secondaryButton} onPress={() => router.push(`/(workouts)/builder?edit=${item.id}` as never)}>
                  <Text variant="caption" color={colors.text}>Edit</Text>
                </Pressable>
                <Pressable
                  style={styles.dangerButton}
                  onPress={() => {
                    deleteWorkout(db, item.id);
                    reload();
                  }}
                >
                  <Text variant="caption" color={colors.background}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        ))}

        {items.length === 0 ? (
          <Card>
            <Text variant="caption" color={colors.textSecondary}>No workouts yet.</Text>
          </Card>
        ) : null}
      </View>
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
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.modules.workouts,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  main: {
    flex: 1,
    gap: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dangerButton: {
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#7F1D1D',
  },
});
