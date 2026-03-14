import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ParsedRecipe } from '@mylife/recipes';
import { Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { RecipeForm, type RecipeFormValues } from '../../components/recipes/RecipeForm';
import { saveRecipe } from '../../hooks/useRecipeSave';

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  url: 'Website',
  text: 'Pasted Text',
  photo: 'Photo',
};

export default function ImportReviewScreen() {
  const params = useLocalSearchParams<{
    parsed?: string;
    source?: string;
    sourceUrl?: string;
    metaAuthor?: string;
    metaThumb?: string;
  }>();

  const router = useRouter();
  const db = useDatabase();

  const recipe: ParsedRecipe | null = useMemo(() => {
    if (!params.parsed) return null;
    try {
      return JSON.parse(params.parsed) as ParsedRecipe;
    } catch {
      return null;
    }
  }, [params.parsed]);

  const source = params.source ?? 'url';
  const sourceUrl = params.sourceUrl ?? '';
  const author = params.metaAuthor ?? '';

  const initialValues: Partial<RecipeFormValues> = useMemo(() => {
    if (!recipe) return {};
    return {
      title: recipe.title || '',
      description: recipe.description || '',
      servings: recipe.servings?.toString() ?? '',
      prepTime: recipe.prep_time_min?.toString() ?? '',
      cookTime: recipe.cook_time_min?.toString() ?? '',
      sourceUrl,
      ingredientLines: recipe.ingredients.length > 0 ? recipe.ingredients : [''],
      stepLines: recipe.steps.length > 0 ? recipe.steps : [''],
    };
  }, [recipe, sourceUrl]);

  const handleSave = (values: RecipeFormValues) => {
    const id = saveRecipe(db, values);
    if (id) {
      // Go back to the recipes tab, skipping the import screens
      router.dismissAll();
    }
  };

  return (
    <RecipeForm
      initialValues={initialValues}
      onSave={handleSave}
      saveLabel="Save Recipe"
      header={
        <View style={styles.sourceCard}>
          <Text variant="caption" color={colors.textSecondary}>
            Imported from {PLATFORM_LABELS[source] ?? source}
          </Text>
          {author ? (
            <Text variant="caption" color={colors.textSecondary}>
              by {author}
            </Text>
          ) : null}
          {sourceUrl ? (
            <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {sourceUrl}
            </Text>
          ) : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  sourceCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    gap: 2,
  },
});
