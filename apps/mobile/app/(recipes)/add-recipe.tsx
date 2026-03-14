import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getRecipeById, getIngredients, type Step } from '@mylife/recipes';
import { Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { RecipeForm, type RecipeFormValues } from '../../components/recipes/RecipeForm';
import { saveRecipe } from '../../hooks/useRecipeSave';

const ACCENT = colors.modules.recipes;

export default function AddRecipeScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const router = useRouter();
  const db = useDatabase();
  const isEditing = !!editId;

  const [initialValues, setInitialValues] = useState<Partial<RecipeFormValues> | undefined>(
    undefined,
  );
  const [loaded, setLoaded] = useState(!isEditing);

  useEffect(() => {
    if (!editId) return;
    const recipe = getRecipeById(db, editId);
    if (!recipe) return;

    const existingIngredients = getIngredients(db, editId);
    const existingSteps = db.query<Step>(
      `SELECT id, recipe_id, step_number, instruction, timer_minutes, sort_order
       FROM rc_steps WHERE recipe_id = ? ORDER BY sort_order ASC, step_number ASC`,
      [editId],
    );

    setInitialValues({
      title: recipe.title,
      description: recipe.description ?? '',
      servings: recipe.servings?.toString() ?? '',
      prepTime: recipe.prep_time_mins?.toString() ?? '',
      cookTime: recipe.cook_time_mins?.toString() ?? '',
      difficulty: recipe.difficulty ?? '',
      notes: recipe.notes ?? '',
      sourceUrl: recipe.source_url ?? '',
      ingredientLines:
        existingIngredients.length > 0
          ? existingIngredients.map((ing) =>
              [ing.quantity, ing.unit, ing.name].filter(Boolean).join(' '),
            )
          : [''],
      stepLines:
        existingSteps.length > 0 ? existingSteps.map((s) => s.instruction) : [''],
    });
    setLoaded(true);
  }, [db, editId]);

  const handleSave = (values: RecipeFormValues) => {
    const id = saveRecipe(db, values, editId);
    if (id) router.back();
  };

  if (!loaded) return null;

  return (
    <RecipeForm
      initialValues={initialValues}
      onSave={handleSave}
      saveLabel={isEditing ? 'Save Changes' : 'Create Recipe'}
      header={
        !isEditing ? (
          <View style={styles.importRow}>
            <Pressable
              style={styles.importButton}
              onPress={() => router.push('/(recipes)/import-source')}
            >
              <Text variant="label" color={ACCENT}>
                Import Recipe
              </Text>
            </Pressable>
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  importRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  importButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
