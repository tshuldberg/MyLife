import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS,
  WORKOUT_CATEGORIES,
  getWorkoutExercises,
  seedWorkoutExerciseLibrary,
  type MuscleGroup,
  type WorkoutCategory,
} from '@mylife/workouts';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function WorkoutExploreScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<WorkoutCategory | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    seedWorkoutExerciseLibrary(db);
    setTick((value) => value + 1);
  }, [db]);

  const exercises = useMemo(
    () =>
      getWorkoutExercises(db, {
        search: search || undefined,
        category,
        muscleGroups: selectedMuscles.length ? selectedMuscles : undefined,
      }),
    [db, search, category, selectedMuscles, tick],
  );

  const toggleMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((value) => value !== muscle)
        : [...prev, muscle],
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises"
              placeholderTextColor={colors.textTertiary}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              <Chip selected={category === null} label="All" onPress={() => setCategory(null)} />
              {WORKOUT_CATEGORIES.map((value) => (
                <Chip
                  key={value}
                  selected={category === value}
                  label={labelize(value)}
                  onPress={() => setCategory(category === value ? null : value)}
                />
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {MUSCLE_GROUPS.map((muscle) => (
                <Chip
                  key={muscle}
                  selected={selectedMuscles.includes(muscle)}
                  label={MUSCLE_GROUP_LABELS[muscle]}
                  onPress={() => toggleMuscle(muscle)}
                />
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.exerciseCard}
            onPress={() => router.push(`/(workouts)/exercise/${item.id}` as never)}
          >
            <View style={styles.exerciseMain}>
              <Text variant="body">{item.name}</Text>
              <Text variant="caption" color={colors.textSecondary}>
                {labelize(item.category)} · {labelize(item.difficulty)}
              </Text>
              <Text variant="caption" color={colors.textTertiary}>
                {item.muscleGroups.map((muscle) => MUSCLE_GROUP_LABELS[muscle]).join(', ')}
              </Text>
            </View>
            <Text variant="caption" color={colors.modules.workouts}>Open</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card>
            <Text variant="caption" color={colors.textSecondary}>No exercises match this filter.</Text>
          </Card>
        }
      />
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, selected ? styles.chipActive : null]} onPress={onPress}>
      <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>{label}</Text>
    </Pressable>
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
  header: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  row: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.modules.workouts,
    borderColor: colors.modules.workouts,
  },
  exerciseCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  exerciseMain: {
    flex: 1,
    gap: 3,
  },
});
