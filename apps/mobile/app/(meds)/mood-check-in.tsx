import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  MOOD_VOCABULARY_SIMPLIFIED,
  DEFAULT_ACTIVITIES,
  createMoodEntry,
  addActivity,
  moodColor,
  type MoodQuadrant,
} from '@mylife/meds';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

type Quadrant = 'highEnergyPleasant' | 'highEnergyUnpleasant' | 'lowEnergyPleasant' | 'lowEnergyUnpleasant';

const QUADRANTS: { key: Quadrant; label: string; energy: 'high' | 'low'; pleasantness: 'pleasant' | 'unpleasant'; color: string }[] = [
  { key: 'highEnergyPleasant', label: 'High Energy\nPleasant', energy: 'high', pleasantness: 'pleasant', color: '#22C55E' },
  { key: 'highEnergyUnpleasant', label: 'High Energy\nUnpleasant', energy: 'high', pleasantness: 'unpleasant', color: '#EF4444' },
  { key: 'lowEnergyPleasant', label: 'Low Energy\nPleasant', energy: 'low', pleasantness: 'pleasant', color: '#3B82F6' },
  { key: 'lowEnergyUnpleasant', label: 'Low Energy\nUnpleasant', energy: 'low', pleasantness: 'unpleasant', color: '#8B5CF6' },
];

const INTENSITY_LABELS = ['1', '2', '3', '4', '5'];

export default function MoodCheckInScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedQuadrant, setSelectedQuadrant] = useState<typeof QUADRANTS[0] | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [intensity, setIntensity] = useState(3);

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(activity)) next.delete(activity);
      else next.add(activity);
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedQuadrant || !selectedMood) return;

    const entryId = uuid();
    createMoodEntry(db, entryId, {
      mood: selectedMood,
      energyLevel: selectedQuadrant.energy,
      pleasantness: selectedQuadrant.pleasantness,
      intensity,
    });

    for (const activity of selectedActivities) {
      addActivity(db, uuid(), entryId, activity);
    }

    router.back();
  };

  const descriptors = selectedQuadrant
    ? MOOD_VOCABULARY_SIMPLIFIED[selectedQuadrant.key]
    : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotDone]}
          />
        ))}
      </View>

      {step === 1 && (
        <Card>
          <Text variant="subheading">How are you feeling?</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Pick the quadrant that best matches your mood.
          </Text>
          <View style={styles.quadrantGrid}>
            {QUADRANTS.map((q) => (
              <Pressable
                key={q.key}
                style={[
                  styles.quadrantCard,
                  { borderColor: q.color },
                  selectedQuadrant?.key === q.key && { backgroundColor: q.color + '33' },
                ]}
                onPress={() => {
                  setSelectedQuadrant(q);
                  setSelectedMood(null);
                  setStep(2);
                }}
              >
                <Text variant="body" color={q.color} style={styles.quadrantLabel}>
                  {q.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      {step === 2 && selectedQuadrant && (
        <Card>
          <Text variant="subheading">Pick a word</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Which word best describes how you feel?
          </Text>
          <View style={styles.chipGrid}>
            {descriptors.map((word) => (
              <Pressable
                key={word}
                style={[
                  styles.moodChip,
                  selectedMood === word && {
                    backgroundColor: selectedQuadrant.color,
                    borderColor: selectedQuadrant.color,
                  },
                ]}
                onPress={() => {
                  setSelectedMood(word);
                  setStep(3);
                }}
              >
                <Text
                  variant="body"
                  color={selectedMood === word ? colors.background : colors.text}
                >
                  {word}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.backButton} onPress={() => setStep(1)}>
            <Text variant="label" color={colors.textSecondary}>Back</Text>
          </Pressable>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <Text variant="subheading">What are you doing?</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Select any activities (optional).
          </Text>
          <View style={styles.chipGrid}>
            {DEFAULT_ACTIVITIES.map((activity) => (
              <Pressable
                key={activity}
                style={[
                  styles.activityChip,
                  selectedActivities.has(activity) && styles.activityChipSelected,
                ]}
                onPress={() => toggleActivity(activity)}
              >
                <Text
                  variant="body"
                  color={selectedActivities.has(activity) ? colors.background : colors.text}
                >
                  {activity}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.navRow}>
            <Pressable style={styles.backButton} onPress={() => setStep(2)}>
              <Text variant="label" color={colors.textSecondary}>Back</Text>
            </Pressable>
            <Pressable style={styles.nextButton} onPress={() => setStep(4)}>
              <Text variant="label" color={colors.background}>Next</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <Text variant="subheading">Intensity</Text>
          <Text variant="caption" color={colors.textSecondary}>
            How strongly do you feel this? (1 = mild, 5 = intense)
          </Text>
          <View style={styles.intensityRow}>
            {INTENSITY_LABELS.map((label) => {
              const val = Number(label);
              const selected = val === intensity;
              return (
                <Pressable
                  key={label}
                  style={[styles.intensityButton, selected && styles.intensityButtonSelected]}
                  onPress={() => setIntensity(val)}
                >
                  <Text
                    variant="body"
                    color={selected ? colors.background : colors.text}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.summary}>
            <Text variant="body">
              Mood: {selectedMood} ({selectedQuadrant?.pleasantness}, {selectedQuadrant?.energy} energy)
            </Text>
            {selectedActivities.size > 0 && (
              <Text variant="caption" color={colors.textSecondary}>
                Activities: {Array.from(selectedActivities).join(', ')}
              </Text>
            )}
          </View>

          <View style={styles.navRow}>
            <Pressable style={styles.backButton} onPress={() => setStep(3)}>
              <Text variant="label" color={colors.textSecondary}>Back</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text variant="label" color={colors.background}>Save</Text>
            </Pressable>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceElevated,
  },
  stepDotActive: { backgroundColor: colors.modules.meds },
  stepDotDone: { backgroundColor: colors.modules.meds, opacity: 0.5 },
  quadrantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quadrantCard: {
    width: '47%',
    aspectRatio: 1.2,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  quadrantLabel: { textAlign: 'center', fontWeight: '600' },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  moodChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  activityChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  activityChipSelected: {
    borderColor: colors.modules.meds,
    backgroundColor: colors.modules.meds,
  },
  intensityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  intensityButton: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  intensityButtonSelected: {
    borderColor: colors.modules.meds,
    backgroundColor: colors.modules.meds,
  },
  summary: { marginTop: spacing.md, gap: spacing.xs },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.modules.meds,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.modules.meds,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
