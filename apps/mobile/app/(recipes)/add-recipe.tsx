import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  createRecipe,
  getRecipeById,
  updateRecipe,
  addIngredient,
  getIngredients,
  parseIngredientText,
  deleteIngredient,
  detectStepTimerMinutes,
  type Difficulty,
  type Step,
} from '@mylife/recipes';
import type { DatabaseAdapter } from '@mylife/db';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

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

function addStep(
  db: DatabaseAdapter,
  id: string,
  recipeId: string,
  stepNumber: number,
  instruction: string,
  timerMinutes: number | null,
): void {
  db.execute(
    `INSERT INTO rc_steps (id, recipe_id, step_number, instruction, timer_minutes, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, recipeId, stepNumber, instruction, timerMinutes, stepNumber],
  );
}

function deleteStep(db: DatabaseAdapter, id: string): void {
  db.execute(`DELETE FROM rc_steps WHERE id = ?`, [id]);
}

export default function AddRecipeScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const router = useRouter();
  const db = useDatabase();
  const isEditing = !!editId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const [ingredientLines, setIngredientLines] = useState<string[]>(['']);
  const [stepLines, setStepLines] = useState<string[]>(['']);

  useEffect(() => {
    if (!editId) return;
    const recipe = getRecipeById(db, editId);
    if (!recipe) return;

    setTitle(recipe.title);
    setDescription(recipe.description ?? '');
    setServings(recipe.servings?.toString() ?? '');
    setPrepTime(recipe.prep_time_mins?.toString() ?? '');
    setCookTime(recipe.cook_time_mins?.toString() ?? '');
    setDifficulty(recipe.difficulty ?? '');
    setNotes(recipe.notes ?? '');
    setSourceUrl(recipe.source_url ?? '');

    const existingIngredients = getIngredients(db, editId);
    if (existingIngredients.length > 0) {
      setIngredientLines(
        existingIngredients.map(
          (ing) =>
            [ing.quantity, ing.unit, ing.name].filter(Boolean).join(' '),
        ),
      );
    }

    const existingSteps = getSteps(db, editId);
    if (existingSteps.length > 0) {
      setStepLines(existingSteps.map((s) => s.instruction));
    }
  }, [db, editId]);

  const handleSave = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('Missing Title', 'Enter a recipe title.');
      return;
    }

    const servingsNum = servings ? parseInt(servings, 10) : null;
    const prepNum = prepTime ? parseInt(prepTime, 10) : null;
    const cookNum = cookTime ? parseInt(cookTime, 10) : null;
    const totalNum = (prepNum || 0) + (cookNum || 0) || null;

    if (isEditing && editId) {
      updateRecipe(db, editId, {
        title: cleanTitle,
        description: description.trim() || null,
        servings: servingsNum,
        prep_time_mins: prepNum,
        cook_time_mins: cookNum,
        total_time_mins: totalNum,
        difficulty: difficulty || null,
        notes: notes.trim() || null,
        source_url: sourceUrl.trim() || null,
      });

      // Replace ingredients
      const oldIngredients = getIngredients(db, editId);
      for (const old of oldIngredients) {
        deleteIngredient(db, old.id);
      }
      ingredientLines
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line, i) => {
          const parsed = parseIngredientText(line);
          addIngredient(db, uuid(), {
            recipe_id: editId,
            name: parsed.prepNote ? `${parsed.item}, ${parsed.prepNote}` : parsed.item || line,
            quantity: parsed.quantity !== null ? String(parsed.quantity) : null,
            unit: parsed.unit,
            item: parsed.item || line,
            quantity_value: parsed.quantity,
            prep_note: parsed.prepNote,
            sort_order: i,
          });
        });

      // Replace steps
      const oldSteps = getSteps(db, editId);
      for (const old of oldSteps) {
        deleteStep(db, old.id);
      }
      stepLines
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line, i) => {
          addStep(db, uuid(), editId, i + 1, line, detectStepTimerMinutes(line));
        });

      router.back();
    } else {
      const recipeId = uuid();
      createRecipe(db, recipeId, {
        title: cleanTitle,
        description: description.trim() || null,
        servings: servingsNum,
        prep_time_mins: prepNum,
        cook_time_mins: cookNum,
        total_time_mins: totalNum,
        difficulty: difficulty || null,
        notes: notes.trim() || null,
        source_url: sourceUrl.trim() || null,
        rating: 0,
        is_favorite: 0,
      });

      ingredientLines
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line, i) => {
          const parsed = parseIngredientText(line);
          addIngredient(db, uuid(), {
            recipe_id: recipeId,
            name: parsed.prepNote ? `${parsed.item}, ${parsed.prepNote}` : parsed.item || line,
            quantity: parsed.quantity !== null ? String(parsed.quantity) : null,
            unit: parsed.unit,
            item: parsed.item || line,
            quantity_value: parsed.quantity,
            prep_note: parsed.prepNote,
            sort_order: i,
          });
        });

      stepLines
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line, i) => {
          addStep(db, uuid(), recipeId, i + 1, line, detectStepTimerMinutes(line));
        });

      router.back();
    }
  };

  const addIngredientLine = () => setIngredientLines((prev) => [...prev, '']);
  const updateIngredientLine = (index: number, value: string) => {
    setIngredientLines((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const removeIngredientLine = (index: number) => {
    setIngredientLines((prev) => prev.filter((_, i) => i !== index));
  };

  const addStepLine = () => setStepLines((prev) => [...prev, '']);
  const updateStepLine = (index: number, value: string) => {
    setStepLines((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const removeStepLine = (index: number) => {
    setStepLines((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card>
        <Text variant="subheading">{isEditing ? 'Edit Recipe' : 'New Recipe'}</Text>

        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe title *"
          placeholderTextColor={colors.textTertiary}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />

        <View style={styles.rowFields}>
          <TextInput
            style={[styles.input, styles.flex1]}
            value={servings}
            onChangeText={setServings}
            placeholder="Servings"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.flex1]}
            value={prepTime}
            onChangeText={setPrepTime}
            placeholder="Prep (min)"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.flex1]}
            value={cookTime}
            onChangeText={setCookTime}
            placeholder="Cook (min)"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.chipRow}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
            const active = difficulty === d;
            return (
              <Pressable
                key={d}
                onPress={() => setDifficulty(active ? '' : d)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text
                  variant="caption"
                  color={active ? colors.background : colors.textSecondary}
                >
                  {d}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={styles.input}
          value={sourceUrl}
          onChangeText={setSourceUrl}
          placeholder="Source URL (optional)"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes (optional)"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Text variant="subheading">Ingredients</Text>
          <Pressable onPress={addIngredientLine}>
            <Text variant="label" color={ACCENT}>+ Add</Text>
          </Pressable>
        </View>
        {ingredientLines.map((line, i) => (
          <View key={i} style={styles.lineRow}>
            <TextInput
              style={[styles.input, styles.flex1]}
              value={line}
              onChangeText={(val) => updateIngredientLine(i, val)}
              placeholder={`Ingredient ${i + 1}`}
              placeholderTextColor={colors.textTertiary}
            />
            {ingredientLines.length > 1 ? (
              <Pressable onPress={() => removeIngredientLine(i)} style={styles.removeBtn}>
                <Text variant="caption" color={colors.danger}>X</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Text variant="subheading">Steps</Text>
          <Pressable onPress={addStepLine}>
            <Text variant="label" color={ACCENT}>+ Add</Text>
          </Pressable>
        </View>
        {stepLines.map((line, i) => (
          <View key={i} style={styles.lineRow}>
            <Text variant="caption" color={ACCENT} style={styles.stepNum}>{i + 1}.</Text>
            <TextInput
              style={[styles.input, styles.flex1, styles.multiline]}
              value={line}
              onChangeText={(val) => updateStepLine(i, val)}
              placeholder={`Step ${i + 1}`}
              placeholderTextColor={colors.textTertiary}
              multiline
            />
            {stepLines.length > 1 ? (
              <Pressable onPress={() => removeStepLine(i)} style={styles.removeBtn}>
                <Text variant="caption" color={colors.danger}>X</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </Card>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text variant="label" color={colors.background}>
          {isEditing ? 'Save Changes' : 'Create Recipe'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
    marginTop: spacing.xs,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  rowFields: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  flex1: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stepNum: {
    marginTop: spacing.sm,
    fontWeight: '700',
    fontSize: 16,
  },
  removeBtn: {
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  saveButton: {
    borderRadius: 10,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
