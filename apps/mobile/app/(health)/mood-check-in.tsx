import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import {
  createMoodEntry,
  MOOD_VOCABULARY_SIMPLIFIED,
  moodColor,
} from '@mylife/health';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;

type EnergyLevel = 'high' | 'low';
type Pleasantness = 'pleasant' | 'unpleasant';

const QUADRANT_LABELS: Record<string, { energy: EnergyLevel; pleasantness: Pleasantness; label: string }> = {
  highEnergyPleasant: { energy: 'high', pleasantness: 'pleasant', label: 'High Energy + Pleasant' },
  highEnergyUnpleasant: { energy: 'high', pleasantness: 'unpleasant', label: 'High Energy + Unpleasant' },
  lowEnergyPleasant: { energy: 'low', pleasantness: 'pleasant', label: 'Low Energy + Pleasant' },
  lowEnergyUnpleasant: { energy: 'low', pleasantness: 'unpleasant', label: 'Low Energy + Unpleasant' },
};

export default function MoodCheckInScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!selectedMood || !selectedQuadrant) {
      Alert.alert('Select a mood', 'Please tap a mood word to continue.');
      return;
    }

    const quadrant = QUADRANT_LABELS[selectedQuadrant];
    if (!quadrant) return;

    try {
      const id = `mood_${Date.now()}`;
      createMoodEntry(db, id, {
        mood: selectedMood,
        energyLevel: quadrant.energy,
        pleasantness: quadrant.pleasantness,
        notes: notes || undefined,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save mood entry.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>How are you feeling?</Text>

      {/* Quadrants */}
      {(Object.entries(QUADRANT_LABELS) as [string, { energy: EnergyLevel; pleasantness: Pleasantness; label: string }][]).map(
        ([key, q]) => {
          const words = MOOD_VOCABULARY_SIMPLIFIED[key as keyof typeof MOOD_VOCABULARY_SIMPLIFIED];
          return (
            <Card key={key} style={styles.card}>
              <View style={styles.quadrantHeader}>
                <View
                  style={[
                    styles.quadrantDot,
                    { backgroundColor: moodColor(q.pleasantness) },
                  ]}
                />
                <Text variant="label" color={colors.textSecondary}>
                  {q.label}
                </Text>
              </View>
              <View style={styles.moodGrid}>
                {words.map((word) => (
                  <Pressable
                    key={word}
                    style={[
                      styles.moodChip,
                      selectedMood === word && styles.moodChipActive,
                    ]}
                    onPress={() => {
                      setSelectedMood(selectedMood === word ? null : word);
                      setSelectedQuadrant(selectedMood === word ? null : key);
                    }}
                  >
                    <Text
                      variant="caption"
                      color={selectedMood === word ? colors.background : colors.text}
                    >
                      {word}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          );
        },
      )}

      {/* Notes */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </Card>

      <Pressable
        style={[styles.saveButton, !selectedMood && styles.saveButtonDisabled]}
        onPress={handleSave}
      >
        <Text variant="label" color={colors.background}>Save Check-In</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  quadrantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quadrantDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  moodChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
});
