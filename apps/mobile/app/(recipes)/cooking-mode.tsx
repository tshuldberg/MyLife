import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getRecipeById,
  getIngredients,
  detectStepTimerMinutes,
  type Recipe,
  type Ingredient,
  type Step,
} from '@mylife/recipes';
import type { DatabaseAdapter } from '@mylife/db';
import { Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.recipes;

function getSteps(db: DatabaseAdapter, recipeId: string): Step[] {
  return db.query<Step>(
    `SELECT id, recipe_id, step_number, instruction, timer_minutes, sort_order
     FROM rc_steps
     WHERE recipe_id = ?
     ORDER BY sort_order ASC, step_number ASC`,
    [recipeId],
  );
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CookingModeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const router = useRouter();
  const db = useDatabase();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!recipeId) return;
    setRecipe(getRecipeById(db, recipeId));
    setSteps(getSteps(db, recipeId));
    setIngredients(getIngredients(db, recipeId));
  }, [db, recipeId]);

  // Note: expo-keep-awake could be added here to prevent screen sleep during cooking.

  // Timer tick
  useEffect(() => {
    if (timerRunning && timerSeconds !== null && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === null || prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerRunning, timerSeconds]);

  const step = steps[currentStep];
  const totalSteps = steps.length;

  const stepTimerMinutes = step
    ? step.timer_minutes ?? detectStepTimerMinutes(step.instruction)
    : null;

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((p) => p + 1);
      resetTimer();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep((p) => p - 1);
      resetTimer();
    }
  };

  const startTimer = () => {
    if (stepTimerMinutes) {
      setTimerSeconds(stepTimerMinutes * 60);
      setTimerRunning(true);
    }
  };

  const resetTimer = () => {
    setTimerSeconds(null);
    setTimerRunning(false);
  };

  if (!recipe || steps.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.centered}>
          <Text variant="body" color={colors.textSecondary}>
            {!recipe ? 'Recipe not found.' : 'No steps to cook.'}
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text variant="label" color={ACCENT}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Text variant="label" color={colors.textSecondary}>Close</Text>
        </Pressable>
        <Text variant="caption" color={colors.textSecondary}>
          {recipe.title}
        </Text>
        <Pressable onPress={() => setShowIngredients(!showIngredients)}>
          <Text variant="label" color={ACCENT}>
            {showIngredients ? 'Steps' : 'Ingredients'}
          </Text>
        </Pressable>
      </View>

      {showIngredients ? (
        /* Ingredients panel */
        <View style={styles.contentArea}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {ingredients.map((ing) => (
            <Text key={ing.id} style={styles.ingredientText}>
              {ing.quantity ? `${ing.quantity} ` : ''}
              {ing.unit ? `${ing.unit} ` : ''}
              {ing.name}
            </Text>
          ))}
        </View>
      ) : (
        /* Step content */
        <View style={styles.contentArea}>
          <Text style={styles.stepLabel}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
          <Text style={styles.instruction}>{step.instruction}</Text>

          {/* Timer section */}
          {stepTimerMinutes ? (
            <View style={styles.timerSection}>
              {timerSeconds !== null ? (
                <>
                  <Text
                    style={[
                      styles.timerText,
                      timerSeconds === 0 ? styles.timerDone : null,
                    ]}
                  >
                    {timerSeconds === 0 ? 'Done!' : formatTimer(timerSeconds)}
                  </Text>
                  <View style={styles.timerControls}>
                    {timerSeconds > 0 ? (
                      <Pressable
                        style={styles.timerButton}
                        onPress={() => setTimerRunning(!timerRunning)}
                      >
                        <Text variant="label" color={colors.background}>
                          {timerRunning ? 'Pause' : 'Resume'}
                        </Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={[styles.timerButton, styles.timerReset]}
                      onPress={resetTimer}
                    >
                      <Text variant="label">Reset</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable style={styles.startTimerButton} onPress={startTimer}>
                  <Text variant="label" color={colors.background}>
                    Start {stepTimerMinutes}min Timer
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </View>
      )}

      {/* Navigation */}
      {!showIngredients ? (
        <View style={styles.navRow}>
          <Pressable
            style={[styles.navButton, currentStep === 0 ? styles.navDisabled : null]}
            onPress={goPrev}
            disabled={currentStep === 0}
          >
            <Text
              variant="label"
              color={currentStep === 0 ? colors.textTertiary : colors.text}
            >
              Previous
            </Text>
          </Pressable>

          <Text variant="caption" color={colors.textSecondary}>
            {currentStep + 1}/{totalSteps}
          </Text>

          {currentStep < totalSteps - 1 ? (
            <Pressable style={styles.navButton} onPress={goNext}>
              <Text variant="label" color={ACCENT}>Next</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.doneButton} onPress={() => router.back()}>
              <Text variant="label" color={colors.background}>Done</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  backButton: {
    padding: spacing.sm,
  },
  contentArea: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  stepLabel: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  instruction: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'center',
  },
  sectionTitle: {
    color: ACCENT,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  ingredientText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 28,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timerSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  timerText: {
    color: ACCENT,
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerDone: {
    color: colors.success,
  },
  timerControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timerButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  timerReset: {
    backgroundColor: colors.surfaceElevated,
  },
  startTimerButton: {
    borderRadius: 10,
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.xl,
  },
  navButton: {
    padding: spacing.sm,
  },
  navDisabled: {
    opacity: 0.4,
  },
  doneButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
