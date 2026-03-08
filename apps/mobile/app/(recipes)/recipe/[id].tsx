import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getRecipeById,
  getStructuredIngredients,
  getTags,
  updateRecipe,
  deleteRecipe,
  scaleIngredients,
  formatQuantity,
  type Recipe,
  type RecipeTag,
  type ScaledIngredient,
  type Step,
} from '@mylife/recipes';
import type { DatabaseAdapter } from '@mylife/db';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';

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

function formatTime(mins: number | null): string | null {
  if (!mins) return null;
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDatabase();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<ScaledIngredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [tags, setTags] = useState<RecipeTag[]>([]);
  const [targetServings, setTargetServings] = useState(1);

  const load = useCallback(() => {
    if (!id) return;
    const nextRecipe = getRecipeById(db, id);
    const baseIngredients = getStructuredIngredients(db, id);
    setRecipe(nextRecipe);
    const servings = nextRecipe?.servings ?? 1;
    setTargetServings((current) => (current > 0 ? current : servings));
    setIngredients(scaleIngredients(baseIngredients, servings, servings));
    setSteps(getSteps(db, id));
    setTags(getTags(db, id));
  }, [db, id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFavorite = () => {
    if (!recipe) return;
    updateRecipe(db, recipe.id, { is_favorite: recipe.is_favorite ? 0 : 1 });
    load();
  };

  const handleDelete = () => {
    Alert.alert('Delete Recipe', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (id) {
            deleteRecipe(db, id);
            router.back();
          }
        },
      },
    ]);
  };

  const handleRating = (newRating: number) => {
    if (!recipe) return;
    updateRecipe(db, recipe.id, { rating: newRating });
    load();
  };

  const adjustServings = (direction: -1 | 1) => {
    if (!recipe?.servings || !id) {
      return;
    }
    const nextServings = Math.max(1, targetServings + direction);
    setTargetServings(nextServings);
    const baseIngredients = getStructuredIngredients(db, id);
    setIngredients(scaleIngredients(baseIngredients, recipe.servings, nextServings));
  };

  if (!recipe) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary}>Recipe not found</Text>
        </View>
      </View>
    );
  }

  const prepTime = formatTime(recipe.prep_time_mins);
  const cookTime = formatTime(recipe.cook_time_mins);
  const totalTime = formatTime(recipe.total_time_mins);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroLetter}>{recipe.title.charAt(0).toUpperCase()}</Text>
      </View>

      {/* Title + actions */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Pressable onPress={handleFavorite} style={styles.favButton}>
          <Text style={[styles.favIcon, recipe.is_favorite ? styles.favActive : null]}>
            {recipe.is_favorite ? '\u2605' : '\u2606'}
          </Text>
        </Pressable>
      </View>

      {recipe.description ? (
        <Text variant="body" color={colors.textSecondary} style={styles.description}>
          {recipe.description}
        </Text>
      ) : null}

      {/* Time metadata */}
      {(prepTime || cookTime || totalTime) ? (
        <View style={styles.metaRow}>
          {prepTime ? (
            <View style={styles.metaBadge}>
              <Text variant="caption" color={colors.textTertiary}>Prep</Text>
              <Text variant="body">{prepTime}</Text>
            </View>
          ) : null}
          {cookTime ? (
            <View style={styles.metaBadge}>
              <Text variant="caption" color={colors.textTertiary}>Cook</Text>
              <Text variant="body">{cookTime}</Text>
            </View>
          ) : null}
          {totalTime ? (
            <View style={styles.metaBadge}>
              <Text variant="caption" color={colors.textTertiary}>Total</Text>
              <Text variant="body">{totalTime}</Text>
            </View>
          ) : null}
          {recipe.difficulty ? (
            <View style={styles.metaBadge}>
              <Text variant="caption" color={colors.textTertiary}>Difficulty</Text>
              <Text variant="body">{recipe.difficulty}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {recipe.servings ? (
        <View style={styles.servingsRow}>
          <Text variant="caption" color={colors.textSecondary}>Servings</Text>
          <View style={styles.servingsControls}>
            <Pressable style={styles.servingsButton} onPress={() => adjustServings(-1)}>
              <Text variant="label">-</Text>
            </Pressable>
            <Text variant="body">{targetServings}</Text>
            <Pressable style={styles.servingsButton} onPress={() => adjustServings(1)}>
              <Text variant="label">+</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Rating */}
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => handleRating(star)}>
            <Text style={[styles.ratingStar, star <= recipe.rating ? styles.starFilled : null]}>
              {star <= recipe.rating ? '\u2605' : '\u2606'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tags */}
      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag.id} style={styles.tagChip}>
              <Text variant="caption" color={ACCENT}>{tag.tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Cooking mode button */}
      {steps.length > 0 ? (
        <Pressable
          style={styles.cookButton}
          onPress={() => router.push(`/(recipes)/cooking-mode?recipeId=${recipe.id}`)}
        >
          <Text variant="label" color={colors.background}>Start Cooking Mode</Text>
        </Pressable>
      ) : null}

      {/* Ingredients */}
      {ingredients.length > 0 ? (
        <Card>
          <Text variant="subheading">Ingredients</Text>
          <Text variant="caption" color={colors.textSecondary}>
            {recipe.servings ? `${recipe.servings} base · ${targetServings} shown` : ''}
          </Text>
          {ingredients.map((ing) => (
            <View key={ing.id} style={styles.ingredientRow}>
              <Text variant="body">
                {formatQuantity(ing.scaled_quantity) ? `${formatQuantity(ing.scaled_quantity)} ` : ''}
                {ing.unit ? `${ing.unit} ` : ''}
                {ing.item ?? ing.name}
                {ing.prep_note ? `, ${ing.prep_note}` : ''}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Steps */}
      {steps.length > 0 ? (
        <Card>
          <Text variant="subheading">Instructions</Text>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text variant="caption" color={colors.background}>{step.step_number}</Text>
              </View>
              <View style={styles.flex1}>
                <Text variant="body">{step.instruction}</Text>
                {step.timer_minutes ? (
                  <Text variant="caption" color={ACCENT}>
                    Timer: {formatTime(step.timer_minutes)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Notes */}
      {recipe.notes ? (
        <Card>
          <Text variant="subheading">Notes</Text>
          <Text variant="body" color={colors.textSecondary}>{recipe.notes}</Text>
        </Card>
      ) : null}

      {/* Source */}
      {recipe.source_url ? (
        <Card>
          <Text variant="caption" color={colors.textTertiary}>
            Source: {recipe.source_url}
          </Text>
        </Card>
      ) : null}

      {/* Actions */}
      <View style={styles.actionRow}>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/(recipes)/add-recipe?editId=${recipe.id}`)}
        >
          <Text variant="label">Edit</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text variant="label" color={colors.background}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    height: 180,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLetter: {
    color: colors.textTertiary,
    fontSize: 64,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  favButton: {
    padding: spacing.xs,
  },
  favIcon: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  favActive: {
    color: ACCENT,
  },
  description: {
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  metaBadge: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  ratingStar: {
    fontSize: 24,
    color: colors.textTertiary,
  },
  starFilled: {
    color: ACCENT,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  cookButton: {
    marginHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  ingredientRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
