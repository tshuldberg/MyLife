import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  WORKOUT_DIFFICULTIES,
  createWorkout,
  getWorkoutById,
  getWorkoutExercises,
  updateWorkout,
  type WorkoutDefinition,
  type WorkoutDifficulty,
  type WorkoutExerciseEntry,
  type WorkoutExerciseLibraryItem,
} from '@mylife/workouts';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

function estimateDuration(exercises: WorkoutExerciseEntry[]): number {
  let total = 0;
  for (const exercise of exercises) {
    const reps = exercise.reps ?? 10;
    const duration = exercise.duration ?? reps * 3;
    total += duration * exercise.sets;
    if (exercise.sets > 1) {
      total += exercise.restAfter * (exercise.sets - 1);
    }
  }
  return Math.max(0, Math.round(total));
}

export default function WorkoutBuilderScreen() {
  const db = useDatabase();
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty>('beginner');
  const [selected, setSelected] = useState<WorkoutExerciseEntry[]>([]);
  const [search, setSearch] = useState('');
  const [allExercises, setAllExercises] = useState<WorkoutExerciseLibraryItem[]>([]);

  useEffect(() => {
    setAllExercises(getWorkoutExercises(db));

    if (!params.edit) {
      return;
    }

    const existing = getWorkoutById(db, params.edit);
    if (!existing) {
      return;
    }

    hydrateFromWorkout(existing);
  }, [db, params.edit]);

  const library = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return allExercises;
    }
    return allExercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(needle) ||
        exercise.category.toLowerCase().includes(needle),
    );
  }, [allExercises, search]);

  const hydrateFromWorkout = (workout: WorkoutDefinition) => {
    setTitle(workout.title);
    setDescription(workout.description);
    setDifficulty(workout.difficulty);
    setSelected(workout.exercises);
  };

  const addExercise = (exercise: WorkoutExerciseLibraryItem) => {
    setSelected((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: exercise.defaultSets,
        reps: exercise.defaultReps,
        duration: exercise.defaultDuration,
        restAfter: 60,
        order: prev.length,
      },
    ]);
  };

  const updateExerciseEntry = (index: number, updates: Partial<WorkoutExerciseEntry>) => {
    setSelected((prev) =>
      prev.map((exercise, rowIndex) =>
        rowIndex === index ? { ...exercise, ...updates } : exercise,
      ),
    );
  };

  const removeExercise = (index: number) => {
    setSelected((prev) =>
      prev
        .filter((_, rowIndex) => rowIndex !== index)
        .map((exercise, rowIndex) => ({ ...exercise, order: rowIndex })),
    );
  };

  const save = () => {
    if (!title.trim() || selected.length === 0) {
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      exercises: selected.map((exercise, index) => ({ ...exercise, order: index })),
      estimatedDuration: estimateDuration(selected),
      isPremium: false,
    };

    if (params.edit) {
      updateWorkout(db, params.edit, payload);
    } else {
      createWorkout(db, uuid(), payload);
    }

    router.push('/(workouts)/workouts' as never);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Workout Details</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Workout title"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            placeholderTextColor={colors.textTertiary}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {WORKOUT_DIFFICULTIES.map((value) => (
              <Pressable
                key={value}
                style={[styles.chip, difficulty === value ? styles.chipActive : null]}
                onPress={() => setDifficulty(value)}
              >
                <Text variant="caption" color={difficulty === value ? colors.background : colors.textSecondary}>
                  {labelize(value)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Selected Exercises ({selected.length})</Text>
        <View style={styles.list}>
          {selected.map((exercise, index) => (
            <View key={`${exercise.exerciseId}-${index}`} style={styles.selectedItem}>
              <View style={styles.selectedMain}>
                <Text variant="body">{exercise.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>{labelize(exercise.category)}</Text>
              </View>

              <View style={styles.numericInputs}>
                <TextInput
                  style={styles.numberInput}
                  value={String(exercise.sets)}
                  onChangeText={(value) => updateExerciseEntry(index, { sets: Math.max(1, Number(value) || 1) })}
                  keyboardType="number-pad"
                  placeholder="sets"
                  placeholderTextColor={colors.textTertiary}
                />
                <TextInput
                  style={styles.numberInput}
                  value={exercise.reps ? String(exercise.reps) : ''}
                  onChangeText={(value) => updateExerciseEntry(index, { reps: value ? Math.max(1, Number(value)) : null })}
                  keyboardType="number-pad"
                  placeholder="reps"
                  placeholderTextColor={colors.textTertiary}
                />
                <TextInput
                  style={styles.numberInput}
                  value={exercise.duration ? String(exercise.duration) : ''}
                  onChangeText={(value) => updateExerciseEntry(index, { duration: value ? Math.max(1, Number(value)) : null })}
                  keyboardType="number-pad"
                  placeholder="sec"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <Pressable style={styles.dangerButton} onPress={() => removeExercise(index)}>
                <Text variant="caption" color={colors.background}>Remove</Text>
              </Pressable>
            </View>
          ))}

          {selected.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>Add exercises from the library below.</Text>
          ) : null}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Exercise Library</Text>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercise name/category"
          placeholderTextColor={colors.textTertiary}
        />

        <View style={styles.list}>
          {library.map((exercise) => (
            <Pressable key={exercise.id} style={styles.libraryItem} onPress={() => addExercise(exercise)}>
              <View style={styles.selectedMain}>
                <Text variant="body">{exercise.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {labelize(exercise.category)} · {labelize(exercise.difficulty)}
                </Text>
              </View>
              <Text variant="caption" color={colors.modules.workouts}>Add</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Pressable
        style={title.trim() && selected.length > 0 ? styles.primaryButton : styles.primaryButtonDisabled}
        disabled={!title.trim() || selected.length === 0}
        onPress={save}
      >
        <Text variant="label" color={colors.background}>{params.edit ? 'Update Workout' : 'Save Workout'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (token) => token.toUpperCase());
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
  form: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
    paddingRight: spacing.md,
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
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: colors.modules.workouts,
    backgroundColor: colors.modules.workouts,
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  selectedItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  selectedMain: {
    gap: 3,
  },
  numericInputs: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text,
    backgroundColor: colors.background,
  },
  dangerButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#7F1D1D',
  },
  libraryItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.modules.workouts,
  },
  primaryButtonDisabled: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#4B5563',
  },
});
