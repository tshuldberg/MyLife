import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MUSCLE_GROUP_LABELS, getWorkoutExerciseById, type WorkoutExerciseLibraryItem } from '@mylife/workouts';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';

export default function WorkoutExerciseDetailScreen() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<WorkoutExerciseLibraryItem | null>(null);

  useEffect(() => {
    if (!params.id) return;
    setExercise(getWorkoutExerciseById(db, params.id));
  }, [db, params.id]);

  const muscleCopy = useMemo(
    () => (exercise ? exercise.muscleGroups.map((muscle) => MUSCLE_GROUP_LABELS[muscle]).join(', ') : ''),
    [exercise],
  );

  if (!exercise) {
    return (
      <View style={styles.screen}>
        <Card>
          <Text variant="caption" color={colors.textSecondary}>Exercise not found.</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Card>
        <Text variant="heading">{exercise.name}</Text>
        <Text variant="caption" color={colors.textSecondary}>
          {labelize(exercise.category)} · {labelize(exercise.difficulty)} · {exercise.defaultSets} sets
        </Text>
        <Text variant="body" style={styles.description}>{exercise.description}</Text>
        <Text variant="caption" color={colors.textTertiary}>{muscleCopy}</Text>
      </Card>

      <Card>
        <Text variant="subheading">Video</Text>
        <View style={styles.videoPlaceholder}>
          {exercise.videoUrl ? (
            <Pressable onPress={() => void Linking.openURL(exercise.videoUrl as string)} style={styles.videoButton}>
              <Text variant="label" color={colors.background}>Open Coach Video</Text>
            </Pressable>
          ) : (
            <Text variant="caption" color={colors.textSecondary}>
              No coach video attached yet for this exercise.
            </Text>
          )}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Audio Cues</Text>
        <View style={styles.cueList}>
          {exercise.audioCues.map((cue) => (
            <Text key={`${cue.timestamp}-${cue.text}`} variant="caption" color={colors.textSecondary}>
              {cue.timestamp}s · {cue.text}
            </Text>
          ))}
        </View>
      </Card>
    </View>
  );
}

function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (token) => token.toUpperCase());
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.md,
  },
  description: {
    marginTop: spacing.sm,
  },
  videoPlaceholder: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  videoButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.modules.workouts,
  },
  cueList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
});
